import JSZip from "jszip";
import {parse} from "parse5";
import * as http from "http";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import {saveFileToDisk, isZipValid, roomKeys} from "./AddDatasetUtils";

export default class RoomsController {
	private buildings: object[];
	private rooms: object[];
	private linkArray: string[];
	private finalBuildings: object[];

	constructor() {
		this.buildings = [];
		this.rooms = [];
		this.linkArray = [];
		this.finalBuildings = [];
	}

	public async addRoomsDataset(id: string, content: string): Promise<string> {
        // Unzip valid files
		const jsZip = new JSZip();
		let parsedIndexFile: any;
		let roomsDatasetIds: string[] = [];

		return jsZip.loadAsync(content, {base64: true}).then((zip: any) => {
			if (!isZipValid(zip, InsightDatasetKind.Rooms)) {
				return Promise.reject(new InsightError("Error: Invalid Rooms Zip file"));
			}
			const promiseArr: any[] = [];
			promiseArr.push(zip.file("index.htm")?.async("text"));
			zip.folder("campus")?.folder("discover")?.folder("buildings-and-classrooms")?.
				forEach((_: any, zipObj: any) => {
					promiseArr.push(zipObj.async("text"));
				});
			return Promise.all(promiseArr);
		}).then((zipData: any[]) => {
			// process index.htm
			parsedIndexFile =  parse(zipData[0]);
			let tBody = this.findTBody(parsedIndexFile), trArray = this.filterByNodeName(tBody, "tr");
			trArray.forEach((tr: any) => {
				let tdArray = this.filterByNodeName(tr, "td");
				this.getBuildingInfo(tdArray, id);
			});
			// process rooms.htm
			for (let i = 1; i < zipData.length; i++) {
				let parsedBuildingsFile = parse(zipData[i]);
        		let tBodyRooms = this.findTBody(parsedBuildingsFile);
            	let trRoomsArray = this.filterByNodeName(tBodyRooms, "tr");

            	trRoomsArray.forEach((tr: any) => {
                	let tdArray = this.filterByNodeName(tr, "td");
                	this.getRoomsInfo(tdArray, id);
           		});
			}
			return this.getGeoLocation(id);
		}).then((geoLocResults: object[]) => {
			this.getFinalBuildings(geoLocResults, id);
			const roomsDataWithNames = this.addBuildingNamesToRooms(id);

			const datasetInfo: InsightDataset = {
				id,
				kind: InsightDatasetKind.Rooms,
				numRows: roomsDataWithNames.length,
			};
			roomsDataWithNames.push(datasetInfo);
			saveFileToDisk(id, roomsDataWithNames);
			return Promise.resolve(id);
		}).catch((err) => {
			return Promise.reject(new InsightError(err));
		});
	}

	private findTBody(node: any): any {
		if (node.nodeName === "tbody") {
			return node;
		} else {
			for (let i = 0; i < node.childNodes?.length; i++) {
				const result = this.findTBody(node.childNodes[i]);
				if (result) {
					return result;
				}
			}
		}
	};

	private filterByNodeName(node: any, nodeName: string): any {
		let filteredNodes: any[] = [];
		for (let i = 0; i < node?.childNodes?.length; i++) {
			if (node.childNodes[i].nodeName === nodeName) {
				filteredNodes.push(node.childNodes[i]);
			}
		}
		return filteredNodes;
	}

	private async getBuildingInfo(tdArray: any[], id: string) {
		let building = {};
		tdArray.forEach((td: any) => {
			building = this.getBuildingAttributes(td, building, id);
		});
		this.buildings.push(building);
	}

	private getBuildingAttributes(td: any, building: any, id: string): object {
		td.attrs.forEach((attr: any) => {
			let shortNameVal: string = "", addressVal: string = "", fullNameVal: string = "";
			if (attr.value === "views-field views-field-title") {
				let aNodeArr = this.filterByNodeName(td, "a");
				if (aNodeArr.length > 0) {
					let aNodeAttrValue = aNodeArr[0].attrs[0].value;
					if (aNodeAttrValue.endsWith(".htm") && !this.linkArray.includes(aNodeAttrValue)) {
						this.linkArray.push(aNodeAttrValue.replace("./", ""));
					}
					fullNameVal = aNodeArr[0].childNodes[0].value;
					const fullNameKey = `${id}_fullname`;
					building = {
                    	...building,
                    	[fullNameKey]: fullNameVal,
					};
				}
			}
			if (attr.value === "views-field views-field-field-building-code") {
				shortNameVal = td.childNodes[0].value.replace("\n", "").trim();
				const shortNameKey = `${id}_shortname`;
				building = {
					...building,
					[shortNameKey]: shortNameVal,
				};
			}
			if (attr.value === "views-field views-field-field-building-address") {
				addressVal = td.childNodes[0].value.replace("\n", "").trim();
				const addressKey = `${id}_address`;
				building = {
					...building,
					[addressKey]: addressVal,
				};
			}
		});
		return building;
	}

	private getRoomsInfo(tdArray: any[], id: string): void {
		let room = {};
		tdArray.forEach((td: any) => {
			room = this.getRoomAttributes(td, room, id);
		});
		this.rooms.push(room);
	}

	private getRoomAttributes(td: any, room: any, id: string): object {
		td.attrs.forEach((attr: any) => {
			let numberVal: string = "", seatsVal: number = 0, typeVal: string = "", furnitureVal: string = "",
				hrefVal: string = "";

			if (attr.value === "views-field views-field-field-room-number") {
				let aNodeArr = this.filterByNodeName(td, "a");
				if (aNodeArr.length > 0) {
					hrefVal = aNodeArr[0].attrs[0].value;
					const hrefKey = `${id}_href`;
					room = {
                    	...room,
                    	[hrefKey]: hrefVal,
					};

					numberVal = aNodeArr[0].childNodes[0].value;
					const numberKey = `${id}_number`;
					room = {
                    	...room,
                    	[numberKey]: numberVal,
					};
				}
			}
			if (attr.value === "views-field views-field-field-room-capacity") {
				seatsVal = Number(td.childNodes[0].value.replace("\n", "").trim());
				const seatsValKey = `${id}_seats`;
				room = {
					...room,
					[seatsValKey]: seatsVal,
				};
			}
			if (attr.value === "views-field views-field-field-room-furniture") {
				furnitureVal = td.childNodes[0].value.replace("\n", "").trim();
				const furnitureValKey = `${id}_furniture`;
				room = {
					...room,
					[furnitureValKey]: furnitureVal,
				};
			}
			if (attr.value === "views-field views-field-field-room-type") {
				typeVal = td.childNodes[0].value.replace("\n", "").trim();
				const typeValKey = `${id}_type`;
				room = {
					...room,
					[typeValKey]: typeVal,
				};
			}
		});
		return room;
	}

	private addBuildingNamesToRooms(id: string): object[] {
		const buildingsMap: Map<string,object> = new Map();
		this.finalBuildings.forEach((building: object) => {
			buildingsMap.set(building[`${id}_shortname` as keyof object], building);
		});
		let roomsInBuildings: object[] = [];
		this.rooms.forEach((room: object) => {
			let roomHref: string = room[`${id}_href` as keyof object];
			let slashIndex = roomHref.lastIndexOf("/");
			let dashIndex = roomHref.lastIndexOf("-");
			let roomShortName = roomHref.substring(slashIndex + 1, dashIndex);
			if (buildingsMap.has(roomShortName)) {
				// find building in buildingsMap
				const buildingInfo: any = buildingsMap.get(roomShortName);
				if (buildingInfo) {
					let nameKey = `${id}_name`;
					let nameValue =
						`${buildingInfo[`${id}_shortname` as keyof object]}_${room[`${id}_number` as keyof object]}`;
					let newRoom = {
						...buildingInfo,
						[nameKey]: nameValue,
						...room,
					};
					roomsInBuildings.push(newRoom);
				}
			}
		});
		roomsInBuildings.filter((room) => Object.keys(room).length === 0);
		roomsInBuildings.filter((room: any) => {
			let onlyKeys = Object.keys(room).map((key: string) => key.split("_")[1]);
			return !onlyKeys.every((key) => roomKeys.includes(key));
		});
		return roomsInBuildings;
	}

	private getGeoLocation(id: string): Promise<object[]> {
		let geoLocResultsArr: object[] = [];
		this.buildings.forEach(async (bldng: any, index) => {
			const options = this.getGeoLocationOptions(bldng, id);
			const shortname = bldng[`${id}_shortname`];
			let geoLoc = this.findGeolocationCBWrapped(options, id, shortname);
			geoLocResultsArr.push(geoLoc);
		});
		return Promise.all(geoLocResultsArr);
	}

	private getFinalBuildings(geoLocResults: object[], id: string): void {
		geoLocResults.forEach((result: object) => {
			let shortname: string = result[`${id}_shortname` as keyof object];
			let idShort = `${id}_shortname`;
			let building = this.buildings.find((bldng: any) => bldng[idShort] === shortname);
			building = {
				...building,
				...result,
			};
			this.finalBuildings.push(building);
		});
	}

	private getGeoLocationOptions(building: object, id: string): URL {
		let buildingAddress: string = building[`${id}_address` as keyof object];
		let buildingAddressURL: string = buildingAddress.replace(/ /g, "%20");
		return new URL(`http://cs310.students.cs.ubc.ca:11316/api/v1/project_team215/${buildingAddressURL}`);
	}

	private findGeolocationCBWrapped(options: URL, id: string, shortname: string): Promise<object> {
		return new Promise<object>((resolve, reject) => {
			http.get(options, (res) => {
				res.setEncoding("utf8");
				let str = "";
				res.on("data", (chunk) => {
					str += chunk;
				});
				res.on("end", () => {
					try {
						const parsedData = JSON.parse(str);
						let latKey = `${id}_${Object.keys(parsedData)[0]}`;
						let lonKey = `${id}_${Object.keys(parsedData)[1]}`;
						let shortnameKey = `${id}_shortname`;
						let geoLocObj: object = {
							[shortnameKey]: shortname,
							[latKey]: Object.values(parsedData)[0],
							[lonKey]: Object.values(parsedData)[1],
						};
						resolve(geoLocObj);
					} catch (err: any) {
						reject(err);
						console.error(err.message);
					}
				});
			}).on("error", (err: any) => {
				reject(err);
			});
		});
	}
}
