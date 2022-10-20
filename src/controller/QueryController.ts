
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

// Performs query based on filters in the body of given query
export function filterQuery(whereObject: object, id: string): Promise<InsightResult[]> {
	if (!fs.existsSync(path.resolve(__dirname, `../../data/${id}.json`))) {
		return Promise.reject(new InsightError("Dataset does not exist"));
	}

	const rawDataset = fs.readFileSync(`data/${id}.json`);
	const dataset = JSON.parse(rawDataset.toString());
	const datasetOnly: object[][] = dataset.slice(0, -1);

	if (Object.keys(whereObject).length === 0) {
		return Promise.resolve(getAllData(datasetOnly));
	}

	return recurse(whereObject, datasetOnly);
}

export function recurse(obj: object, datasetArr: object[][]): Promise<InsightResult[]> {
	const key = Object.keys(obj)[0];

	if (key === "IS") {
		if (!checkType(obj[key as keyof object])) {
			return Promise.reject(new InsightError("Invalid key value type"));
		}
		return sComparison(datasetArr, obj[key as keyof object]);
	} else if (key === "LT" || key === "GT" || key === "EQ") {
		if (!checkType(obj[key as keyof object])) {
			return Promise.reject(new InsightError("Invalid key value type"));
		}
		return mComparison(datasetArr, key, obj[key as keyof object]);
	} else {
		return Promise.reject(new InsightError("Invalid query filter"));
	}
	// } else if (key === "NOT") {
	// 	// recurse()
	// } else if (key === "AND" || key === "OR") {
}

export function checkType(queryObj: object): boolean {
	const key: string = Object.keys(queryObj)[0];
	const value: number | string = Object.values(queryObj)[0];

	let field: string = key.split("_")[1];
	const stringKeys: string[] = ["dept", "id", "title", "instructor", "uuid"];
	const numKeys: string[] = ["avg", "pass", "fail", "audit", "year"];
	if (stringKeys.includes(field)) {
		return typeof value === "string";
	} else if (numKeys.includes(field)) {
		return typeof value === "number";
	}
	return false;
}

export function sComparison(datasetArr: object[][], isObj: object): Promise<InsightResult[]> {
	const skey: string = Object.keys(isObj)[0];
	// Check that inputString is valid (inside columns)
	if (typeof Object.values(isObj)[0] !== "string") {
		return Promise.reject(new InsightError("SComparison: input not a string"));
	}
	const inputString: string = Object.values(isObj)[0];
	let filteredIsArr: InsightResult[] = [];
    // Check for wildcards
	if (inputString.slice(0, 1) === "*" && inputString.slice(-1) === "*") {
		if (inputString.slice(1, -1) === undefined || inputString.slice(1, -1).includes("*")) {
			return Promise.reject(new InsightError("SComparison: input contains asterisk"));
		}
		filteredIsArr = getFilteredArray(datasetArr, skey, inputString.slice(1, -1), "includes");
	} else if (inputString.slice(0, 1) === "*") {
		if (inputString.slice(1) === undefined || inputString.slice(1).includes("*")) {
			return Promise.reject(new InsightError("SComparison: input contains asterisk"));
		}
		filteredIsArr = getFilteredArray(datasetArr, skey, inputString.slice(1), "endsWith");
	} else if (inputString.slice(-1) === "*") {
		if (inputString.slice(0, -1) === undefined || inputString.slice(0, -1).includes("*")) {
			return Promise.reject(new InsightError("SComparison: input contains asterisk"));
		}
		filteredIsArr = getFilteredArray(datasetArr, skey, inputString.slice(0, -1), "startsWith");
	} else {
		if (inputString === undefined || inputString.includes("*")) {
			return Promise.reject(new InsightError("SComparison: input contains asterisk"));
		}
		filteredIsArr = getFilteredArray(datasetArr, skey, inputString, "equals");
	}
	return Promise.resolve(filteredIsArr);
}

export function mComparison(datasetArr: object[][], mComparator: string, isObj: object): Promise<InsightResult[]> {
	if (typeof Object.values(isObj)[0] !== "number") {
		return Promise.reject(new InsightError("MComparison: input not a number"));
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
	return Promise.resolve(filteredMComparisonArr);
}

export function getFilteredArray(datasetArr: object[][], key: string, input: string | number, operation: string):
InsightResult[] {
	let filteredArr: InsightResult[] = [];
	if (typeof input === "string") {
		datasetArr.forEach((course: object[]) => {
			Array.from(course).forEach((section: any) => {
				if (compareStringInput(section[key as keyof object], operation, input)) {
					filteredArr.push(section);
				}
			});
		});
	} else {
		datasetArr.forEach((course: object[]) => {
			Array.from(course).forEach((section: any) => {
				if (compareNumberInput(section[key as keyof object], operation, input)) {
					filteredArr.push(section);
				}
			});
		});
	}
	return filteredArr;
}

export function getAllData(datasetArr: object[][]): InsightResult[] {
	let filteredArr: InsightResult[] = [];
	datasetArr.forEach((course: object[]) => {
		Array.from(course).forEach((section: any) => {
			filteredArr.push(section);
		});
	});
	return filteredArr;
}

export function compareStringInput(sectionValue: string, operation: string, input: string): boolean {
	if (operation === "includes") {
		return (sectionValue?.includes(input));
	} else if (operation === "startsWith") {
		return (sectionValue.startsWith(input));
	} else if (operation === "endsWith") {
		return (sectionValue.endsWith(input));
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

// Outputs query in the format provided by the OPTIONS
export function outputQuery(filterResult: InsightResult[], queryOptions: object):
Promise<InsightResult[]> {

	if (filterResult.length > 5000) {
		return Promise.reject(new ResultTooLargeError("Result too large"));
	}

	const queryColumns: string[] = queryOptions["COLUMNS" as keyof object];
	let queryOrder: string = "";

	if (Object.keys(queryOptions).includes("ORDER")) {
		queryOrder = queryOptions["ORDER" as keyof object];
	}

	let finalResult: InsightResult[] = [];

	Array.from(filterResult).forEach((object) => {
		let objAsArray = Object.entries(object);
		let filteredObj = objAsArray.filter(([key, value]) => queryColumns.includes(key));
		finalResult.push(Object.fromEntries(filteredObj));
	});

	if (queryOrder !== "") {
		finalResult.sort((objA, objB) => objA[queryOrder] > objB[queryOrder] ? 1 : -1);
	}

	return Promise.resolve(finalResult);
}
