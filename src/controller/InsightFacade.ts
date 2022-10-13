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
	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.dataset = [];
		this.course = [];
		this.allDatasetIds = [];
	}

										/** addDataset Methods **/

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// Check for invalid dataset id
		if (!this.checkValidDatasetID(id)) {
			return Promise.reject(new InsightError("Invalid dataset ID"));
		}
		// **TODO: check if file is .zip
		// if (content.substring(content.lastIndexOf(".") + 1) === "zip") { // !!! not working
		// 	return Promise.reject(new InsightError("Dataset provided not a zip file"));
		// }
		// **TODO: unzip file using JSZip
		const jsZip = new JSZip();
		const jsonKeys = ["Subject", "Course", "Avg", "Professor", "Title", "Pass", "Fail", "Audit", "id", "Year",
			"Section"];

		return jsZip.loadAsync(content, {base64: true}).then((zip) => {
			const zipData: any[] = [];

			zip.folder("courses")?.forEach((filename, zipObj) => {
				zipData.push(zipObj.async("text"));
			});

			// Reject if empty dataset
			return (zipData.length === 0) ?
				Promise.reject(new InsightError("Dataset empty")) : Promise.all(zipData.slice(1));
		}).then((zipData: any[]) => {
			zipData.forEach((data: any) => {
				// **TODO: skip over invalid JSON files (check if it is in JSON)
				// Parse valid course files into a data structure
				let jsonObject = JSON.parse(data);
				jsonObject.result.forEach((sectionJSON: any) => {
						// Check if each JSON section includes all query keys
					if (jsonKeys.every((key) => Object.keys(sectionJSON).includes(key))) {
							// let sectionObject = new SectionObject(
							// 	id,
							// 	String(sectionJSON["Subject"]),
							// 	String(sectionJSON["Course"]),
							// 	Number(sectionJSON["Avg"]),
							// 	String(sectionJSON["Professor"]),
							// 	String(sectionJSON["Title"]),
							// 	Number(sectionJSON["Pass"]),
							// 	Number(sectionJSON["Fail"]),
							// 	Number(sectionJSON["Audit"]),
							// 	String(sectionJSON["id"]),
							// 	(sectionJSON["Section"] === "overall") ? 1900 : Number(sectionJSON["Year"]));

							// Without using class SectionObject:
						let sectionObject: {[key: string]: any} = {};
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

						this.course.push(sectionObject);
					}
				});
			});
			this.dataset.push(this.course);
			this.allDatasetIds.push(id);
			this.saveFileToDisk(id);

			return Promise.resolve(this.allDatasetIds);
		}).catch((err) => {
			return Promise.reject(new InsightError(err));
		});

			// **TODO: check if dataset is valid
	}

	// Helper function to check if dataset ID is valid
	private checkValidDatasetID(id: string): boolean {
		return !(id.includes("_") ||
			   id.trim().length === 0 ||
			   id === "" ||
			   id === null ||
			   id === undefined ||
			   this.allDatasetIds.includes(id));
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
	// **TODO: has to contain at least one valid course section that meets the requirements below:
	//         - root directory contains a folder called courses/ (CAUGHT IN CATCH ALL)
	//         - valid courses will always be in JSON format
	//         - each JSON file represents a course and can contain zero or more course valid sections
	//         - a valid section must contain every field used which can be used by a query (DONE)
	private isDatasetValid(id: string, content: string, kind: InsightDatasetKind): boolean {
		// Check if courses are in JSON format
		return false;
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
