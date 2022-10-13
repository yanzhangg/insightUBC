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
	private allDatasetIds: Set<string>;
	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.dataset = [];
		this.course = [];
		this.allDatasetIds = new Set();
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// Check for invalid dataset id
		if (id.includes("_") || id.trim().length === 0 || id === "" || id === null || id === undefined ||
				this.allDatasetIds.has(id)) {
			return Promise.reject(new InsightError("Invalid dataset id"));
		}
		// **TODO: - throw insighterror if dataset is empty
		// if (content.substring(content.lastIndexOf(".") + 1) === "zip") { // !!! not working
		// 	return Promise.reject(new InsightError("Dataset provided not a zip file"));
		// }
		// **TODO: unzip file using JSZip
		const jsZip = new JSZip();
		const jsonKeys = ["Subject", "Course", "Avg", "Professor", "Title", "Pass", "Fail", "Audit", "id", "Year",
			"Section"];

		return jsZip.loadAsync(content, {base64: true}).then((zip) => {
			const zipData: any[] = [];
			// if (zip.folder("courses")?.length === 0) { //* *TODO: does not work
			// 	return Promise.reject(new InsightError("Dataset empty"));
			// }
			zip.folder("courses")?.forEach((filename, zipObj) => {
				zipData.push(zipObj.async("text"));
			});
			return Promise.all(zipData.slice(1));
		}).then((zipData: any[]) => {
			zipData.forEach((data: any) => {
				// **TODO: parse valid course files into a data structure
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

						// **TODO: save files to the <PROJECT_DIR>/data directory
						fs.writeFileSync(path.resolve(__dirname, `../../data/${id}.json`),
							JSON.stringify(sectionObject));
					}
				});
				this.dataset.push(this.course);
				this.allDatasetIds.add(id);
			});
			return Promise.resolve(this.course);
		}).catch((err) => {
			return Promise.reject(new InsightError(err));
		});

			// **TODO: check if dataset is valid
	}

	// Helper function to check if dataset is valid
	// **TODO: has to contain at least one valid course section that meets the requirements below:
	//         - root directory contains a folder called courses/
	//         - valid courses will always be in JSON format
	//         - each JSON file represents a course and can contain zero or more course valid sections
	//         - a valid section must contain every field used which can be used by a query
	private isDatasetValid(id: string, content: string, kind: InsightDatasetKind): boolean {
		// Check if courses are in JSON format


		return false;
	}

	// Helper function to check for valid query keys
	private checkValidQueryKeys(): boolean {
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
