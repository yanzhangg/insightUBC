import JSZip, {file} from "jszip";
import * as fs from "fs-extra";

import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";

import SectionObject from "./SectionObject";
import path from "path";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private dataset: any[];
	private course: any[];
	private allDatasetIds: string[];
	private error: string;
	private jsonKeys: string[];

	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.dataset = [];
		this.course = [];
		this.allDatasetIds = [];
		this.error = "";
		this.jsonKeys = ["Subject", "Course", "Avg", "Professor", "Title", "Pass", "Fail", "Audit", "id", "Year",
			"Section"];
	}

										/** addDataset Methods **/

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// Reset dataset array
		this.dataset = [];
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
					}
				});
				if (this.course.length !== 0) {
					this.dataset.push(this.course);
				}
			});

			if (this.dataset.length === 0) {
				return Promise.reject(new InsightError("Dataset Empty"));
			}
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

	// Helper function to check if dataset is valid
	// has to contain at least one valid course section that meets the requirements below:
	//         - root directory contains a folder called courses/ (CAUGHT IN CATCH ALL)
	//         - valid courses will always be in JSON format
	//         - each JSON file represents a course and can contain zero or more course valid sections
	//         - a valid section must contain every field used which can be used by a query (DONE)
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

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}
}
