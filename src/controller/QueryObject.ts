export interface Filter {
	filter?: LogicComparison | MComparison | SComparison | Negation | undefined;
}

export interface LogicComparison {
	logic: "AND" | "OR";
	filtersArr: Filter[];
}

export interface MComparison {
	mComparator: "LT" | "GT" | "EQ";
	mObject: {[key: string]: number};
}

export interface SComparison {
	sObject: {[key: string]: string};
}

export interface Negation {
	filter: Filter;
}
