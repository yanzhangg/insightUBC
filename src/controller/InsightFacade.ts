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
		// const jsZip = new JSZip();
		// let zipData;
		// jsZip.loadAsync(content).then((zip) => {
		// 	Object.keys(zip.files).forEach(function (filename) {
		// 		zip.files[filename].async("string").then(function (fileData) {
		// 			console.log(fileData);
		// 		});
		// 	});
		// });

		// fs.readFile(content, function (err, data) {
		// 	if (err) {
		// 		throw err;
		// 	}
		// 	JSZip.loadAsync(data).then(function (zip) {
		// 		zipData = zip.files["CPSC547.json"];
		// 	});
		// });

		// fs.readFile(content, function (err, data) {
		// 	if (err) {
		// 		throw err;
		// 	}
		// 	jsZip.loadAsync(data).then(function (zip) {
		// 		console.log(jsZip);
		// 	});
		// });

		// return Promise.resolve(zipData);

		// **TODO: check if dataset is valid: has to contain at least one valid course section that meets the requirements below:
		//         - root directory contains a folder called courses/
		//         - valid courses will always be in JSON format
		//         - each JSON file represents a course and can contain zero or more course valid sections
		//         - a valid section must contain every field used which can be used by a query


		// **TODO: parse valid course files into a data structure

		// **TODO: save files to the <PROJECT_DIR>/data directory

		return Promise.reject("Not implemented.");
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
