import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import {roomKeys, sectionKeys, queryApplyTokens, numKeys} from "./AddDatasetUtils";
import Decimal from "decimal.js";
export function transformQuery(queryTransform: object, queryResult: any, optionsColumns: []):
InsightResult[] | InsightError {
	const transformGroup: any = queryTransform["GROUP" as keyof object]; // array of groupings ["sections_title"]
	const transformApply: any = queryTransform["APPLY" as keyof object];
	let groupedObj: object = groupBy(queryResult, transformGroup);
	let allGroupedArrays: any[] = [];
	let groupedArr: any = iterateThroughObj(groupedObj, allGroupedArrays);

	let applyKeys = applyTransformation(groupedArr, transformApply);

	let error = checkValidColumns(applyKeys, transformGroup, optionsColumns);
	if (error !== "") {
		return new InsightError(error);
	}
	let finalGroupArr: any[] = [];
	groupedArr.forEach((groupArr: object[]) => {
		finalGroupArr.push(groupArr[0]);
	});
	return finalGroupArr;
}

function groupBy(queryResult: InsightResult[], keys: string[]): object {
	let grouped: object = {};
	queryResult.forEach((resultObj: any) => {
		keys.reduce(function (obj: any, key: string, i: number) {
			obj[resultObj[key]] = obj[resultObj[key]] || (i + 1 === keys.length ? [] : {});
			return obj[resultObj[key]];
		}, grouped).push(resultObj);
	});
	return grouped;
}

export function iterateThroughObj(obj: any, arr: any[]): any[] {
	if (Array.isArray(obj)) {
		arr.push(obj);
	} else {
		Object.keys(obj).forEach((key) => {
			arr = iterateThroughObj(obj[key], arr);
		});
	}
	return arr;
}

export function applyTransformation(groupedArr: object[][], transformApply: any): any[] {
	let applyKeys: any[] = [];
	transformApply.forEach((applyRule: any) => {
		let applyKey = Object.keys(applyRule)[0];
		let applyRuleObj: any = (Object.values(applyRule)[0]);
		let ruleKey: any = Object.keys(applyRuleObj)[0];
		let ruleField: any = Object.values(applyRuleObj)[0];

		applyKeys.push(applyKey);

		if (ruleKey === "MAX") {
			getMax(groupedArr, ruleField, applyKey);
		} else if (ruleKey === "MIN") {
			getMin(groupedArr, ruleField, applyKey);
		} else if (ruleKey === "AVG") {
			getAvg(groupedArr, ruleField, applyKey);
		} else if (ruleKey === "SUM") {
			getSum(groupedArr, ruleField, applyKey);
		} else {
			getCount(groupedArr, applyKey);
		}
	});

	return applyKeys;
}

export function getMax(groupedArr: object[][], ruleField: string, applyKey: string) {
	let max = {};
	groupedArr.forEach((groupArray: any) => {
		let maxValue = 0;
		groupArray.forEach((obj: any) => {
			if (obj[`${ruleField}`] > maxValue) {
				maxValue = obj[`${ruleField}`];
			}
		});
		max = {
			[applyKey]: maxValue,
		};
		let firstObj: object = groupArray[0];
		Object.assign(firstObj, max);
	});
}

export function getMin(groupedArr: object[][], ruleField: string, applyKey: string) {
	let min = {};
	groupedArr.forEach((groupArray: any) => {
		let minValue = Number.MAX_VALUE;
		groupArray.forEach((obj: any) => {
			if (obj[`${ruleField}`] < minValue) {
				minValue = obj[`${ruleField}`];
			}
		});
		min = {
			[applyKey]: minValue,
		};
		let firstObj: object = groupArray[0];
		Object.assign(firstObj, min);
	});
}

export function getAvg(groupedArr: object[][], ruleField: string, applyKey: string) {
	let avgValue = {};
	groupedArr.forEach((groupArray: any) => {
		let total: Decimal = new Decimal(0);
		let count: number = 0;
		groupArray.forEach((obj: any) => {
			let num: number = obj[`${ruleField}`];
			let numDec: Decimal = new Decimal(num);
			total = Decimal.add(total, numDec);
			count++;
		});
		let avg = total.toNumber() / count;
		avgValue = {
			[applyKey]: Number(avg.toFixed(2)),
		};
		let firstObj: object = groupArray[0];
		Object.assign(firstObj, avgValue);
	});
}

export function getSum(groupedArr: object[][], ruleField: string, applyKey: string) {
	let sum = {};
	groupedArr.forEach((groupArray: any) => {
		let sumValue = 0;
		groupArray.forEach((obj: any) => {
			sumValue += obj[`${ruleField}`];
		});
		sum = {
			[applyKey]: Number(sumValue.toFixed(2)),
		};
		let firstObj: object = groupArray[0];
		Object.assign(firstObj, sum);
	});
}

export function getCount(groupedArr: object[][], applyKey: string) {
	let count = {};
	groupedArr.forEach((groupArray: any) => {
		let countValue = groupArray.length;
		count = {
			[applyKey]: countValue,
		};
		let firstObj: object = groupArray[0];
		Object.assign(firstObj, count);
	});
}

function checkValidColumns(applyKeys: string[], groupKeys: string[], optionsColumns: string[]): string {
	let error = "";
	let groupAndApplyKeys: string[] = groupKeys.concat(applyKeys);
	if (!optionsColumns.every((columnKey) => groupAndApplyKeys.includes(columnKey))) {
		error = "Columns key not in Group or Apply";
	}
	return error;
}

export function isQueryTransformationValid(queryTransform: object): boolean {
	if (queryTransform === undefined || queryTransform === null || Object.keys(queryTransform).length === 0 ||
    !Object.keys(queryTransform).includes("GROUP") || !Object.keys(queryTransform).includes("APPLY") ||
    Object.keys(queryTransform).length > 2) {
		return false;
	}
	const transformKeys: string[] = Object.keys(queryTransform).filter((key) => key !== "GROUP")
		.filter((key) => key !== "APPLY");
	if (transformKeys.length > 0) {
		return false;
	}
	const transformGroup: string[] = queryTransform["GROUP" as keyof object];
	if (transformGroup === undefined || transformGroup === null || transformGroup.length === 0) {
		return false;
	}
	let groupKeys: string[] = [];
	for (const groupKey of transformGroup) {
		if (typeof groupKey !== "string") {
			return false;
		}
		groupKeys.push(groupKey.split("_")[1]);
	}
	if (!groupKeys.every((key) => sectionKeys.includes(key)) &&
		!groupKeys.every((key) => roomKeys.includes(key))) {
		return false;
	}
	const transformApply: object[] = queryTransform["APPLY" as keyof object];
	if (transformApply === undefined || transformApply === null || transformApply.length === 0) {
		return false;
	}
	for (const applyObj of transformApply) {
		const applyObjVal: object = Object.values(applyObj)[0];
		if (Object.keys(applyObj).length === 0 || Object.keys(applyObj).includes("_") ||
			Object.values(applyObj).length === 0 || typeof applyObjVal !== "object") {
			return false;
		}
		const applyToken: string = Object.keys(applyObjVal)[0];
		const applyRuleKey: string = Object.values(applyObjVal)[0].split("_")[1];
		if (Object.keys(applyObjVal).length !== 1 || Object.values(applyObjVal).length !== 1 ||
            !queryApplyTokens.includes(applyToken) ||
            (!sectionKeys.includes(applyRuleKey) &&
             !roomKeys.includes(applyRuleKey))) {
			return false;
		}
		if (applyToken !== "COUNT" && !numKeys.includes(applyRuleKey)) {
			return false;
		}
	}
	return true;
}
