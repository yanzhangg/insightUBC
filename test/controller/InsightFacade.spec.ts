import {
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import * as fs from "fs-extra";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect} from "chai";

describe("InsightFacade", function () {
	let insightFacade: InsightFacade;

	const persistDirectory = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		sections: "./test/resources/archives/pair.zip",
	};

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run of the test suite
		fs.removeSync(persistDirectory);
	});

	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			insightFacade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			fs.removeSync(persistDirectory);
		});

		// This is a unit test. You should create more like this!
		it("Should add a valid dataset", function () {
			const id: string = "sections";
			const content: string = datasetContents.get("sections") ?? "";
			const expected: string[] = [id];
			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then((result: string[]) => expect(result).to.deep.equal(expected));
		});

		it("Should list no datasets", function () {
			return insightFacade
				.listDatasets()
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(0);
				})
				.catch(() => {
					expect.fail("Should not fail");
				});
		});

		it("Should list one dataset", function () {
			const id: string = "sections";
			const content: string = datasetContents.get("sections") ?? "";
			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then(() => insightFacade.listDatasets())
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([
						{
							id: "sections",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					]);
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.be.length(1);

					const [insightDataset] = insightDatasets;
					expect(insightDataset).to.have.property("id");
					expect(insightDataset.id).to.equal("sections");
				})
				.catch(() => {
					expect.fail("Should not fail");
				});
		});

		it("Should list multiple datasets", function () {
			const id: string = "sections";
			const content: string = datasetContents.get("sections") ?? "";
			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then(() => {
					return insightFacade.addDataset("sections-2", content, InsightDatasetKind.Sections);
				})
				.then(() => {
					return insightFacade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(2);

					const insightDatasetSections = insightDatasets.find((dataset) => dataset.id === "sections");
					expect(insightDatasetSections).to.exist;
					expect(insightDatasetSections).to.deep.equal({
						id: "sections",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					});

					const insightDatasetSections2 = insightDatasets.find((dataset) => dataset.id === "sections-2");
					expect(insightDatasetSections2).to.exist;
					expect(insightDatasetSections2).to.deep.equal({
						id: "sections-2",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					});
				})
				.catch(() => {
					expect.fail("Should not fail");
				});
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			insightFacade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				insightFacade.addDataset(
					"sections",
					datasetContents.get("sections") ?? "",
					InsightDatasetKind.Sections
				),
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDirectory);
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => insightFacade.performQuery(input),
			"./test/resources/queries",
			{
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});
});
