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

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// **TODO: unzip file using JSZip

		const jsZip = new JSZip();

		return jsZip.loadAsync(content, {base64:true}).then((zip) => {
			const zipData: any[] = [];
			zip.folder("courses")?.forEach((filename, zipObj) => {
				zipData.push(zipObj.async("text"));
			});
			return Promise.all(zipData);
		});

		// **TODO: check if dataset is valid


		// **TODO: parse valid course files into a data structure

		// **TODO: save files to the <PROJECT_DIR>/data directory

		return Promise.reject("Not implemented.");
	}

	// Helper function to check if dataset is valid
	// **TODO: has to contain at least one valid course section that meets the requirements below:
	//         - root directory contains a folder called courses/
	//         - valid courses will always be in JSON format
	//         - each JSON file represents a course and can contain zero or more course valid sections
	//         - a valid section must contain every field used which can be used by a query
	private isDatasetValid(id: string, content: string, kind: InsightDatasetKind): boolean {

		return false;
	}

	// Helper function to check for valid fields keys
	private checkValidFields(): boolean {
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
