import JSZip, {file} from "jszip";
import * as fs from "fs-extra";
import path from "path";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import SectionObject from "./SectionObject";
import {filterQuery, outputQuery} from "./QueryController";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private dataset: any[];
	private course: object[];
	private allDatasetIds: string[];
	private error: string;
	private jsonKeys: string[];
	private datasetKeys: string[];
	private id: string;

	constructor() {
		this.dataset = [];
		this.course = [];
		this.allDatasetIds = [];
		this.error = "";
		this.jsonKeys = ["Subject", "Course", "Avg", "Professor", "Title", "Pass", "Fail", "Audit", "id", "Year",
			"Section"];
		this.datasetKeys = ["dept", "id", "avg", "instructor", "title", "pass", "fail", "audit", "uuid", "year"];
		this.id = "";
	}

											/** addDataset Methods **/

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// Reset dataset array
		this.dataset = [];
		// Reset numSections count
		let numSections: number = 0;
		if (!this.isDatasetValid(id, content, kind)) {
			return Promise.reject(new InsightError(`Invalid dataset ${this.error}`));
		}
		// Unzip valid files
		const jsZip = new JSZip();
		return jsZip.loadAsync(content, {base64: true}).then((zip) => {
			const zipData: any[] = [];
			if (!this.isZipValid(zip)) {
				return Promise.reject(new InsightError(`Invalid dataset ${this.error}`));
			}
			zip.folder("courses")?.forEach((_, zipObj) => {
				zipData.push(zipObj.async("text"));
			});
			return (zipData.length === 0) ?
				Promise.reject(new InsightError("Dataset empty 1")) : Promise.all(zipData.slice(1));
		}).then((zipData: any[]) => {
			zipData.forEach((data: any) => {
				this.course = [];
				// Parse valid course files into a data structure
				let jsonObject = this.parseValidJSON(data);
				jsonObject?.result.forEach((sectionJSON: any) => {
					// Check if each JSON section includes all query keys
					if (this.jsonKeys.every((key) => Object.keys(sectionJSON).includes(key))) {
						let sectionObject = this.createSectionObject(id, sectionJSON);
						this.course.push(sectionObject);
						numSections++;
					}
				});
				if (this.course.length !== 0) {
					this.dataset.push(this.course);
				}
			});
			if (this.dataset.length === 0) {
				return Promise.reject(new InsightError("Dataset Empty"));
			}
			const datasetInfo: InsightDataset = {
				id,
				kind: InsightDatasetKind.Sections,
				numRows: numSections,
			};
			this.dataset.push(datasetInfo);

			this.allDatasetIds.push(id);
			this.saveFileToDisk(id);
			return Promise.resolve(this.allDatasetIds);
		}).catch((err) => {
			return Promise.reject(new InsightError(err));
		});
	}

	// Helper function to save file to disk (__dir/data)
	private saveFileToDisk(id: string): void {
		if (!fs.existsSync(path.resolve(__dirname, "../../data"))) {
			fs.mkdirSync(path.resolve(__dirname, "../../data"));
		}
		fs.writeFileSync(path.resolve(__dirname, `../../data/${id}.json`),
			JSON.stringify(this.dataset));
	}

	private isDatasetValid(id: string, content: string, kind: InsightDatasetKind): boolean {
		// Check for valid id
		if (id.includes("_") || id.trim().length === 0 || id === "" || id === null || id === undefined ||
			this.allDatasetIds.includes(id)) {
			this.error = "id";
			return false;
		}
		// check for Sections kind
		if (kind !== InsightDatasetKind.Sections) {
			this.error = "kind";
			return false;
		}
		this.error = "";
		return true;
	}

	// Helper function to check if zip file is valid
	private isZipValid(zip: JSZip): boolean {
		// check for courses folder
		if (!Object.keys(zip.files).includes("courses/")) {
			this.error = "no courses folder";
			return false;
		}
		// check for at least one section in courses folder
		let filenames: string[] = [];
		zip.folder("courses")?.forEach((filename) => {
			filenames.push(filename);
		});
		if (filenames.length === 0) {
			this.error = "zip folder empty";
			return false;
		}
		this.error = "";
		return true;
	}

	// Helper function to parse valid JSON files and skip invalid ones
	private parseValidJSON(data: any): any {
		try {
			let validJSON = JSON.parse(data);
			return validJSON;
		} catch (err) {
			return;
		}
	}

	// Helper function to create an object for each section from parsed JSON data
	private createSectionObject(id: string, sectionJSON: any): {[key: string]: any} {
		const sectionObject: {[key: string]: any} = {};
		sectionObject[`${id}_dept`] = String(sectionJSON["Subject"]);
		sectionObject[`${id}_id`] = String(sectionJSON["Course"]);
		sectionObject[`${id}_avg`] = Number(sectionJSON["Avg"]);
		sectionObject[`${id}_instructor`] = String(sectionJSON["Professor"]);
		sectionObject[`${id}_title`] = String(sectionJSON["Title"]);
		sectionObject[`${id}_pass`] = Number(sectionJSON["Pass"]);
		sectionObject[`${id}_fail`] = Number(sectionJSON["Fail"]);
		sectionObject[`${id}_audit`] = Number(sectionJSON["Audit"]);
		sectionObject[`${id}_uuid`] = String(sectionJSON["id"]);
		sectionObject[`${id}_year`] =
			(sectionJSON["Section"] === "overall") ? 1900 : Number(sectionJSON["Year"]);
		return sectionObject;
	}

									/** removeDataset & listDataset Methods **/

	public removeDataset(id: string): Promise<string> {
		if (id.includes("_") || id.trim().length === 0 || id === "" || id === null || id === undefined) {
			return Promise.reject(new InsightError("Invalid dataset id"));
		}

		if (!fs.existsSync(path.resolve(__dirname, `../../data/${id}.json`))) {
			return Promise.reject(new NotFoundError("No dataset with this id"));
		}

		fs.unlinkSync(`data/${id}.json`);
		const idIndex = this.allDatasetIds.findIndex((idString) => {
			return idString === id;
		});
		if (idIndex !== -1) {
			this.allDatasetIds.splice(idIndex);
		}
		return Promise.resolve(`${id}`);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		const datasets: InsightDataset[] = [];

		if (!fs.existsSync(path.resolve(__dirname, "../../data"))) {
			return Promise.resolve([]);
		}

		const files = fs.readdirSync("data");
		files.map((jsonFile) => {
			const rawData = fs.readFileSync(`data/${jsonFile}`);
			const data = JSON.parse(rawData.toString());
			datasets.push(data.pop());
		});

		return Promise.resolve(datasets);
	}

											/** performQuery Methods **/

	public performQuery(query: unknown): Promise<InsightResult[]> {
		if (query === undefined || query === null) {
			return Promise.reject(new InsightError("Undefined/Null Query Object"));
		}

		let queryObject = query as object;

		if (!this.isQueryValid(queryObject)) {
			return Promise.reject(new InsightError("Invalid Query"));
		}
		const queryWhere: object = queryObject["WHERE" as keyof object];
		const queryOptions: object = queryObject["OPTIONS" as keyof object];

		if (!this.isQueryWhereValid(queryWhere)) {
			return Promise.reject(new InsightError("Invalid Query: where"));
		}
		if (!this.isQueryOptionsValid(queryOptions)) {
			return Promise.reject(new InsightError("Invalid Query: options"));
		}

		return filterQuery(queryWhere, this.id).then((result) => outputQuery(result, queryOptions));
	}

	private isQueryValid(query: object): boolean {
		return (query !== undefined && query !== null && Object.keys(query).length !== 0 &&
				 Object.keys(query).includes("WHERE") && Object.keys(query).includes("OPTIONS") &&
				 query["WHERE" as keyof object] !== undefined && query["WHERE" as keyof object] !== null &&
				 query["OPTIONS" as keyof object] !== undefined && !query["OPTIONS" as keyof object] !== null);
	}

	private isQueryOptionsValid(queryOptions: object): boolean {
		this.id = "";
		if (queryOptions === undefined || queryOptions === null || Object.keys(queryOptions).length === 0 ||
			!Object.keys(queryOptions).includes("COLUMNS") || Object.keys(queryOptions).length > 2) {
			return false;
		}
		const optionsKeys: string[] = Object.keys(queryOptions).filter((key) => key !== "COLUMNS")
			.filter((key) => key !== "ORDER");
		if (optionsKeys.length > 0) {
			return false;
		}
		const optionsColumns: string[] = queryOptions["COLUMNS" as keyof object];
		if (optionsColumns === undefined || optionsColumns === null || Object.keys(optionsColumns).length === 0) {
			return false;
		}
		let keys: string[] = [];
		optionsColumns.map((column) => {
			if (typeof column !== "string") {
				return false;
			}
			keys.push(column.split("_")[1]);
		});
		if (!keys.every((key) => this.datasetKeys.includes(key))) {
			return false;
		}
		if (Object.keys(queryOptions).includes("ORDER")) {
			let optionsOrder: string = queryOptions["ORDER" as keyof object];
			if (!optionsColumns.includes(optionsOrder) || optionsOrder === null ||
				optionsOrder === undefined || typeof optionsOrder !== "string" ) {
				return false;
			}
		}
		let columns: string[] = [];
		optionsColumns.map((column) => {
			let columnId = column.split("_")[0];
			if (columnId.includes("_")) {
				return false;
			}
			columns.push(columnId);
		});
		if (!columns.every((column) => column === columns[0]) ||
			!fs.existsSync(path.resolve(__dirname, `../../data/${columns[0]}.json`))) {
			return false;
		}
		this.id = columns[0];
		return true;
	}

	private isQueryWhereValid(queryWhere: object): boolean {
		if (!(Object.keys(queryWhere).length <= 1)) {
			return false;
		}
		return !(queryWhere === undefined && queryWhere === null);
	}
}
