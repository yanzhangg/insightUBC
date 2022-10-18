export interface QueryObject{
	where: object;
	options: OptionsObject;
}

export interface OptionsObject {
	columns: string[];
	order?: string;
}

export interface WhereObject {
	filter?: FILTER;
}

export interface FILTER {
	logicComparison?: LOGICCOMPARISON;
	mComparison?: MCOMPARISON;
	sComparison?: SCOMPARISON;
	negation?: NEGATION;
}

export interface LOGICCOMPARISON {
	logic: LOGIC;
	filtersArr: FILTER[];
}

export interface MCOMPARISON {
	mComparator: MCOMPARATOR;
	mObject: {[key: string]: number};
}

export interface SCOMPARISON {
	sObject: {[key: string]: string};
}

export interface NEGATION {
	filter: FILTER;
}

export enum LOGIC {
	AND = "AND",
	OR = "OR"
}

export enum MCOMPARATOR {
	LT = "LT",
	GT = "GT",
	EQ = "EQ"
}
