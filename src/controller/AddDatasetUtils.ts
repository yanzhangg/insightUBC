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

export const roomKeys: string[] = [
	"fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type", "furniture", "href"];

export const sectionKeys: string[] = [
	"dept", "id", "avg", "instructor", "title", "pass", "fail", "audit", "uuid", "year"];

export const queryApplyTokens: string[] = [
	"MAX", "MIN", "AVG", "COUNT", "SUM"
];

export const stringKeys: string[] = [
	"dept", "id", "title", "instructor", "uuid", "fullname", "shortname", "number",
	"name", "address", "type", "furniture", "href"
];
export const numKeys: string[] = [
	"avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"
];

// Helper function to save file to disk (__dir/data)
export function saveFileToDisk(id: string, dataset: any[]): void {
	if (!fs.existsSync(path.resolve(__dirname, "../../data"))) {
		fs.mkdirSync(path.resolve(__dirname, "../../data"));
	}
	fs.writeFileSync(path.resolve(__dirname, `../../data/${id}.json`),
		JSON.stringify(dataset));
}

export function isDatasetValid(id: string, kind: InsightDatasetKind, allDatasetIds: string[]): string {
	let error = "";
	// Check for valid id
	if (id.includes("_") || id.trim().length === 0 || id === "" || id === null || id === undefined ||
			allDatasetIds.includes(id)) {
		error = "id";
	}
	// check for Sections kind
	if (kind !== InsightDatasetKind.Sections && kind !== InsightDatasetKind.Rooms) {
		error = "kind";
	}
	return error;
}

// Helper function to check if zip file is valid
export function isZipValid(zip: JSZip, kind: InsightDatasetKind): string {
	let error = "";
	if (kind === InsightDatasetKind.Sections) {
        // check for courses folder
		if (!Object.keys(zip.files).includes("courses/")) {
			error = "no courses folder";
		}
        // check for at least one section in courses folder
		let filenames: string[] = [];
		zip.folder("courses")?.forEach((filename) => {
			filenames.push(filename);
		});
		if (filenames.length === 0) {
			error = "zip folder empty";
		}
	} else if (kind === InsightDatasetKind.Rooms) {
		if (!Object.keys(zip.files).includes("campus/") ||
			!Object.keys(zip.files).includes("discover/") ||
			!Object.keys(zip.files).includes("buildings-and-classrooms/") ||
			!Object.keys(zip.files).includes("index.htm")) {
			error = "missing folder or index.htm";
		}
		let rooms: string[] = [];
		zip.folder("campus")?.folder("discover")?.folder("buildings-and-classrooms")?.
			forEach((filename: string) => {
				rooms.push(filename);
			});
		if (rooms.length === 0) {
			error = "rooms zip folder empty";
		}
	} else {
		error = "Invalid Dataset Kind";
	}
	return error;
}
