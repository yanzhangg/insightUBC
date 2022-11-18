
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import * as fs from "fs-extra";
import path from "path";
import {sectionKeys, roomKeys, stringKeys, numKeys} from "./AddDatasetUtils";

// Performs query based on filters in the body of given query
export function filterQuery(whereObject: object, id: string): Promise<InsightResult[]> {
	if (!fs.existsSync(path.resolve(__dirname, `../../data/${id}.json`))) {
		return Promise.reject(new InsightError("Dataset does not exist"));
	}
	const rawDataset = fs.readFileSync(`data/${id}.json`);
	const dataset = JSON.parse(rawDataset.toString());
	const datasetOnly: any = dataset.slice(0, -1);
	const listDatasetInfo: InsightDataset = dataset.pop();
	const datasetKind: InsightDatasetKind = listDatasetInfo.kind;

	let filteredArr: InsightResult[] = [];

	if (datasetKind === InsightDatasetKind.Sections) {
		datasetOnly.forEach((course: object[]) => {
			Array.from(course).forEach((section: any) => {
				filteredArr.push(section);
			});
		});
	} else if (datasetKind === InsightDatasetKind.Rooms) {
		filteredArr = datasetOnly;
	}
	if (Object.keys(whereObject).length === 0) {
		return Promise.resolve(filteredArr);
	}
	let filteredResult: InsightResult[] | InsightError = recurse(whereObject, filteredArr, id, datasetKind);
	if (filteredResult instanceof InsightError) {
		return Promise.reject(filteredResult);
	}
	return Promise.resolve(filteredResult);
}

export function recurse(obj: object, datasetArr: InsightResult[], id: string, kind: InsightDatasetKind):
InsightResult[] | InsightError {
	const whereKey = Object.keys(obj)[0], whereValue = obj[whereKey as keyof object];
	if (whereKey === "IS") {
		const errorStr = checkWhereValue(whereValue, id, kind);
		if (errorStr !== "") {
			return new InsightError(errorStr);
		}
		return sComparison(datasetArr, whereValue);
	} else if (whereKey === "LT" || whereKey === "GT" || whereKey === "EQ") {
		const errorStr = checkWhereValue(whereValue, id, kind);
		if (errorStr !== "") {
			return new InsightError(errorStr);
		}
		return mComparison(datasetArr, whereKey, whereValue);
	} else if (whereKey === "AND" || whereKey === "OR") {
		if (Object.keys(whereValue).length === 0 || Object.values(whereValue).length === 0 ||
			Object.values(whereValue)[0] === undefined ||
			Object.keys(Object.values(whereValue)[0] as object).length === 0) {
			return new InsightError("Empty AND/OR query");
		}
		let finalResult: InsightResult[] | InsightError = [];
		let resultsArr: InsightResult[][] = [];
		Array.from(whereValue).forEach((filterObj) => {
			let filterObjResult: InsightResult[] | InsightError = recurse(filterObj as object, datasetArr, id, kind);
			if (filterObjResult instanceof InsightError) {
				finalResult = filterObjResult;
				return;
			}
			resultsArr.push(filterObjResult);
		});
		if (finalResult instanceof InsightError) {
			return finalResult;
		}
		if (whereKey === "AND") {
			finalResult = resultsArr.reduce((arr1, arr2) => arr1.filter((object) => arr2.includes(object)));
		} else {
			let finalOrArr: InsightResult[] = [];
			resultsArr.forEach((resultArr) => {
				finalOrArr.push(...resultArr);
			});
			finalResult = [...new Set(finalOrArr)];
		}
		return finalResult;
	} else if (whereKey === "NOT") {
		return notFilter(whereValue, datasetArr, id, kind);
	} else {
		return new InsightError("Invalid query filter");
	}
}

export function checkType(queryObj: object): boolean {
	const key: string = Object.keys(queryObj)[0];
	const value: number | string = Object.values(queryObj)[0];
	let field: string = key.split("_")[1];
	if (stringKeys.includes(field)) {
		return typeof value === "string";
	} else if (numKeys.includes(field)) {
		return typeof value === "number";
	}
	return false;
}

export function checkKeyKind(queryObj: object, datasetKind: InsightDatasetKind): boolean {
	const key: string = Object.keys(queryObj)[0];
	let field: string = key.split("_")[1];
	if (datasetKind === InsightDatasetKind.Rooms) {
		return roomKeys.includes(field);
	} else if (datasetKind === InsightDatasetKind.Sections) {
		return sectionKeys.includes(field);
	}
	return false;
}

export function checkWhereValue(whereValue: object, id: string, datasetKind: InsightDatasetKind): string {
	if (!checkType(whereValue)) {
		return "Invalid key value type";
	}
	if (!checkKeyKind(whereValue, datasetKind)) {
		return "Invalid key match with dataset kind";
	}
	if (Object.keys(whereValue)[0].split("_")[0] !== id) {
		return "Invalid dataset id key";
	}
	return "";
}

export function sComparison(datasetArr: InsightResult[], isObj: object): InsightResult[] | InsightError {
	const skey: string = Object.keys(isObj)[0];
	// Check that inputString is valid (inside columns)
	if (typeof Object.values(isObj)[0] !== "string") {
		return new InsightError("SComparison: input not a string");
	}
	const inputString: string = Object.values(isObj)[0];
	let filteredIsArr: InsightResult[] = [];
    // Check for wildcards
	if (inputString.slice(0, 1) === "*" && inputString.slice(-1) === "*") {
		if (inputString.slice(1, -1) === undefined || inputString.slice(1, -1).includes("*")) {
			return new InsightError("SComparison: input contains asterisk");
		}
		filteredIsArr = getFilteredArray(datasetArr, skey, inputString.slice(1, -1), "includes");
	} else if (inputString.slice(0, 1) === "*") {
		if (inputString.slice(1) === undefined || inputString.slice(1).includes("*")) {
			return new InsightError("SComparison: input contains asterisk");
		}
		filteredIsArr = getFilteredArray(datasetArr, skey, inputString.slice(1), "endsWith");
	} else if (inputString.slice(-1) === "*") {
		if (inputString.slice(0, -1) === undefined || inputString.slice(0, -1).includes("*")) {
			return new InsightError("SComparison: input contains asterisk");
		}
		filteredIsArr = getFilteredArray(datasetArr, skey, inputString.slice(0, -1), "startsWith");
	} else {
		if (inputString === undefined || inputString.includes("*")) {
			return new InsightError("SComparison: input contains asterisk");
		}
		filteredIsArr = getFilteredArray(datasetArr, skey, inputString, "equals");
	}
	return filteredIsArr;
}

export function mComparison(datasetArr: InsightResult[], mComparator: string, isObj: object):
InsightResult[] | InsightError {
	if (typeof Object.values(isObj)[0] !== "number") {
		return new InsightError("MComparison: input not a number");
	}
	const mkey: string = Object.keys(isObj)[0];
	const number: number = Object.values(isObj)[0];
	let filteredMComparisonArr: InsightResult[] = [];
	if (mComparator === "LT") {
		filteredMComparisonArr = getFilteredArray(datasetArr, mkey, number, "LT");
	} else if (mComparator === "GT") {
		filteredMComparisonArr = getFilteredArray(datasetArr, mkey, number, "GT");
	} else if (mComparator === "EQ") {
		filteredMComparisonArr = getFilteredArray(datasetArr, mkey, number, "EQ");
	}
	return filteredMComparisonArr;
}

export function getFilteredArray(datasetArr: InsightResult[], key: string, input: string | number, operation: string):
InsightResult[] {
	let filteredArr: InsightResult[] = [];
	if (typeof input === "string") {
		Array.from(datasetArr).forEach((section: any) => {
			if (compareStringInput(section[key as keyof object], operation, input)) {
				filteredArr.push(section);
			}
		});
	} else {
		Array.from(datasetArr).forEach((section: any) => {
			if (compareNumberInput(section[key as keyof object], operation, input)) {
				filteredArr.push(section);
			}
		});
	}
	return filteredArr;
}

export function compareStringInput(sectionValue: string, operation: string, input: string): boolean {
	if (operation === "includes") {
		return (sectionValue?.includes(input));
	} else if (operation === "startsWith") {
		return (sectionValue?.startsWith(input));
	} else if (operation === "endsWith") {
		return (sectionValue?.endsWith(input));
	} else {
		return (sectionValue === input);
	}
}

export function compareNumberInput(sectionValue: number, operation: string, input: number): boolean {
	if (operation === "LT") {
		return (sectionValue < input);
	} else if (operation === "GT") {
		return (sectionValue > input);
	} else {
		return (sectionValue === input);
	}
}

export function notFilter(whereValue: object, datasetArr: InsightResult[], id: string, datasetKind: InsightDatasetKind):
InsightResult[] | InsightError {
	if (Object.keys(whereValue).length === 0) {
		return new InsightError("Empty NOT query");
	}
	if (Object.keys(Object.keys(whereValue)).length !== 1) {
		return new InsightError("Invalid NOT Query: Excess keys");
	}
	let notFilterResult: InsightResult[];
	let filterResult: InsightResult[] | InsightError;
	filterResult = recurse(whereValue, datasetArr, id, datasetKind);
	if (filterResult instanceof InsightError) {
		return filterResult;
	}
	notFilterResult = datasetArr.filter((object) => !(filterResult as InsightResult[]).includes(object));
	return notFilterResult;
}

// Outputs query in the format provided by the OPTIONS
export function outputQuery(filterResult: InsightResult[], queryOptions: object):
Promise<InsightResult[]> {
	if (filterResult.length > 5000) {
		return Promise.reject(new ResultTooLargeError("Result too large"));
	}
	const queryColumns: string[] = queryOptions["COLUMNS" as keyof object];
	let queryOrder: string | object = "";

	if (Object.keys(queryOptions).includes("ORDER")) {
		queryOrder = queryOptions["ORDER" as keyof object];
	}
	let finalResult: InsightResult[] = [];
	Array.from(filterResult).forEach((object) => {
		let objAsArray = Object.entries(object);
		let filteredObj = objAsArray.filter(([key, value]) => queryColumns.includes(key));
		if (filteredObj.length !== 0) {
			finalResult.push(Object.fromEntries(filteredObj));
		}
	});

	if (queryOrder !== "") {
		if (typeof queryOrder === "string") {
			let queryOrderString = queryOrder;
			finalResult.sort((objA, objB) => objA[queryOrderString] > objB[queryOrderString] ? 1 : -1);
		} else {
			let orderDir: string = queryOrder["dir" as keyof object];
			let orderKeys: any = queryOrder["keys" as keyof object];
			let dir = orderDir === "UP" ? 1 : -1;


			finalResult.sort(function(a: any, b: any){
				let i = 0, result = 0;
				while(i < orderKeys.length && result === 0) {
				  result = dir * (a[orderKeys[i]] < b[orderKeys[i]] ? -1 : (a[orderKeys[i]] > b[orderKeys[i]] ? 1 : 0));
				  i++;
				}
				return result;
			});
		}
	}
	return Promise.resolve(finalResult);
}
