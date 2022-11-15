import {
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import * as fs from "fs-extra";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";

use(chaiAsPromised);

describe("InsightFacade", function () {
	let insightFacade: InsightFacade;

	const persistDirectory = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		sections: "./test/resources/archives/pair.zip",
		emptyDataset: "./test/resources/archives/empty.zip",
		textFile: "./test/resources/archives/test.txt",
		incorrectFolder: "./test/resources/archives/incorrect-folder-name.zip",
		notJSON: "./test/resources/archives/notJSON.zip",
		noValidSections: "./test/resources/archives/no-valid-sections.zip",
		oneJSON: "./test/resources/archives/valid-one-notJSON.zip",
		small: "./test/resources/archives/small.zip",
		oneCourse: "./test/resources/archives/one-course-test.zip",
		twoCourses: "./test/resources/archives/two-courses-test.zip",
		rooms: "./test/resources/archives/rooms.zip",
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

		it("addDataset test dataset", function () {
			const id: string = "twoCourses";
			const content: string = datasetContents.get("twoCourses") ?? "";
			const expected: string[] = [id];
			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then(() => {
					return insightFacade.removeDataset(id);
				})
				.then(
					expect(fs.existsSync(path.resolve(__dirname, "../../data/twoCourses.json"))).to.deep.equal(false));
					// expect(result).to.be.an.instanceof(InsightError);
		});

		it("rooms addDataset test", function () {
			const id: string = "rooms";
			const content: string = datasetContents.get("rooms") ?? "";
			const expected: string[] = [id];
			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Rooms)
				.then((result: string[]) => expect(result).to.deep.equal(expected));
		});

		it("Should add both rooms and sections datasets", function () {
			const id: string = "sections";
			const id2: string = "rooms";
			const content: string = datasetContents.get("sections") ?? "";
			const content2: string = datasetContents.get("rooms") ?? "";
			const expected: string[] = [id];
			const expected2: string[] = [id, id2];
			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then((result: string[]) => expect(result).to.deep.equal(expected))
				.then(() => {
					return insightFacade.addDataset(id2, content2, InsightDatasetKind.Rooms);
				})
				.then((result: string[]) => expect(result).to.deep.equal(expected2));
		});

		it("Should throw an InsightError for a empty dataset", function () {
			const id: string = "emptyDataset";
			const content: string = datasetContents.get("emptyDataset") ?? "";

			const result = insightFacade.addDataset(id, content, InsightDatasetKind.Sections);

			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		it("Should throw an InsightError for a non-zip dataset", function () {
			const id: string = "textFile";
			const content: string = datasetContents.get("textFile") ?? "";

			const result = insightFacade.addDataset(id, content, InsightDatasetKind.Sections);

			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		it("Should add multiple datasets", function () {
			const id: string = "sections";
			const id2: string = "sections-2";
			const content: string = datasetContents.get("sections") ?? "";

			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then(() => {
					return insightFacade.addDataset(id2, content, InsightDatasetKind.Sections);
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.deep.equal(["sections", "sections-2"]);
					expect(insightDatasets).to.be.length(2);
					expect(insightDatasets).to.include("sections");
					expect(insightDatasets).to.include("sections-2");
				})
				.catch((err) => {
					console.log(err);
					expect.fail("Should not fail");
				});
		});

		it("Should throw an InsightError if the same dataset id is added", function () {
			const id: string = "sections";
			const content: string = datasetContents.get("sections") ?? "";

			const result = insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then(() => insightFacade.addDataset(id, content, InsightDatasetKind.Sections));

			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		it("Should throw an InsightError if the same dataset id is added (sections then rooms kind)", function () {
			const id: string = "sections";
			const content: string = datasetContents.get("sections") ?? "";

			const result = insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then(() => insightFacade.addDataset(id, content, InsightDatasetKind.Rooms));

			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});


		it("Should throw an InsightError if a dataset with an invalid id is added (underscore)", function () {
			const content: string = datasetContents.get("sections") ?? "";

			const result = insightFacade.addDataset("sections_", content, InsightDatasetKind.Sections);

			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		it("Should throw an InsightError if a dataset with an invalid id is added (whitespace)", function () {
			const content: string = datasetContents.get("rooms") ?? "";

			const result = insightFacade.addDataset("  ", content, InsightDatasetKind.Rooms);

			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		it("Should add dataset with whitespace in id string", function () {
			const content: string = datasetContents.get("sections") ?? "";
			return insightFacade
				.addDataset("sections ", content, InsightDatasetKind.Sections)
				.then((result: string[]) => expect(result).to.deep.equal(["sections "]));
		});

		it("Should throw an InsightError if a dataset with an invalid id is added (empty id)", function () {
			const content: string = datasetContents.get("rooms") ?? "";

			const result = insightFacade.addDataset("", content, InsightDatasetKind.Rooms);

			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		// Invalid dataset - zip file does not contain folder called courses/
		it("should not add dataset with folder not named courses", function () {
			const content: string = datasetContents.get("incorrectFolder") ?? "";
			const result = insightFacade.addDataset("incorrectFolder", content, InsightDatasetKind.Sections);
			expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		// Invalid dataset - sections not in JSON format
		it("should not add dataset where sections not in JSON", function () {
			const content: string = datasetContents.get("notJSON") ?? "";
			const result = insightFacade.addDataset("notJSON", content, InsightDatasetKind.Sections);
			expect(result).eventually.to.be.rejectedWith(InsightError);
			// expect(readDisk()).to.have.length(0);
		});

		// Invalid dataset - no valid course sections in dataset
		it("should not add dataset with no valid sections", function () {
			const content: string = datasetContents.get("noValidSections") ?? "";
			const result = insightFacade.addDataset("noValidSections", content, InsightDatasetKind.Sections);
			expect(result).eventually.to.be.rejectedWith(InsightError);
			expect(fs.existsSync(path.resolve(__dirname, "../../data/noValidSections.json"))).to.deep.equal(false);
		});

		// Valid dataset - one valid course, one invalid (not in JSON)
		it("should add dataset with at least one valid course", function () {
			const content: string = datasetContents.get("oneJSON") ?? "";
			return insightFacade
				.addDataset("oneJSON", content, InsightDatasetKind.Sections)
				.then((result) => {
					expect(result).to.be.an.instanceof(Array);
					expect(result).to.have.length(1);
					expect(result).to.deep.equal(["oneJSON"]);
					// expect(readDisk()).to.have.length(1);
				})
				.catch(() => expect.fail("should not have caught error"));
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

		it("Should list one dataset (sections)", function () {
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

		it("Should list one dataset (rooms)", function () {
			const id: string = "rooms";
			const content: string = datasetContents.get("rooms") ?? "";
			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Rooms)
				.then(() => insightFacade.listDatasets())
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([
						{
							id: "rooms",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						},
					]);
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.be.length(1);

					const [insightDataset] = insightDatasets;
					expect(insightDataset).to.have.property("id");
					expect(insightDataset.id).to.equal("rooms");
				})
				.catch(() => {
					expect.fail("Should not fail");
				});
		});

		it("should list the correct dataset information for twoCourses dataset", function () {
			const id: string = "twoCourses";
			const content: string = datasetContents.get("twoCourses") ?? "";
			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then(() => insightFacade.listDatasets())
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([
						{
							id: "twoCourses",
							kind: InsightDatasetKind.Sections,
							numRows: 6,
						},
					]);
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

		it("Should add one dataset then remove the dataset", function () {
			const id: string = "sections";
			const content: string = datasetContents.get("sections") ?? "";

			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then(() => {
					return insightFacade.removeDataset(id);
				})
				.then(() => {
					return insightFacade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(0);
				})
				.catch(() => {
					expect.fail("Should not fail");
				});
		});

		it("Should add one dataset then remove then add dataset", function () {
			const id: string = "sections";
			const content: string = datasetContents.get("sections") ?? "";

			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then(() => {
					return insightFacade.removeDataset(id);
				})
				.then(
					expect(fs.existsSync(path.resolve(__dirname, "../../data/sections.json"))).to.deep.equal(false)
				)
				.then(() => insightFacade.addDataset(id, content, InsightDatasetKind.Sections))
				.then(() => {
					return insightFacade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(1);
					expect(fs.existsSync(path.resolve(__dirname, "../../data/sections.json"))).to.deep.equal(true);
				})
				.catch(() => {
					expect.fail("Should not fail");
				});
		});

		it("Should add one dataset then remove the same dataset twice", function () {
			const id: string = "sections";
			const content: string = datasetContents.get("sections") ?? "";

			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Sections)
				.then(() => {
					return insightFacade.removeDataset(id);
				})
				.then(() => {
					return insightFacade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(0);
					expect(fs.existsSync(path.resolve(__dirname, "../../data/sections.json"))).to.deep.equal(false);
				})
				.then(() => {
					const result = insightFacade.removeDataset(id);
					return expect(result).eventually.to.be.rejectedWith(NotFoundError);
				});
		});

		it("Should throw a NotFoundError when removing a non-existent dataset id", function () {
			const result = insightFacade.removeDataset("sections-2");
			return expect(result).eventually.to.be.rejectedWith(NotFoundError);
		});

		it("Should throw an InsightError when removing a non-valid dataset id (underscore)", function () {
			const result = insightFacade.removeDataset("sections_");
			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		it("Should throw an InsightError when removing a non-valid dataset id (whitespace)", function () {
			const result = insightFacade.removeDataset(" ");
			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		it("Should throw an InsightError when removing a non-valid dataset id (empty string)", function () {
			const result = insightFacade.removeDataset("");
			return expect(result).eventually.to.be.rejectedWith(InsightError);
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
				insightFacade.addDataset(
					"sections2",
					datasetContents.get("sections") ?? "",
					InsightDatasetKind.Sections
				),
				insightFacade.addDataset(
					"small",
					datasetContents.get("small") ?? "",
					InsightDatasetKind.Sections
				),
				insightFacade.addDataset(
					"twoCourses ",
					datasetContents.get("twoCourses") ?? "",
					InsightDatasetKind.Sections
				),
				insightFacade.addDataset(
					"rooms",
					datasetContents.get("rooms") ?? "",
					InsightDatasetKind.Rooms)
			];
			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDirectory);
		});

		// it ("sections test query", function () {
		// 	insightFacade = new InsightFacade();

		// 	return insightFacade.addDataset(
		// 		"twoCourses",
		// 		datasetContents.get("twoCourses") ?? "",
		// 		InsightDatasetKind.Sections
		// 	)
		// 		.then(() =>
		// 			expect(fs.existsSync(path.resolve(__dirname, "../../data/twoCourses.json"))).to.deep.equal(true));
		// });

		// it ("test query", function () {
		// 	insightFacade = new InsightFacade();
		// 	let expected = [{rooms_shortname: "HEBB",rooms_seats: 375},{rooms_shortname: "LSC", rooms_seats: 350},
		// 		{rooms_shortname: "LSC",rooms_seats: 350},{rooms_shortname: "OSBO",rooms_seats: 442}];
		// 	// let expected = [{rooms_shortname: "CIRS", rooms_seats:426},
		// 	// 	{rooms_shortname: "OSBO", rooms_seats: 442},
		// 	// 	{rooms_shortname: "WOOD", rooms_seats: 503}];

		// 	return insightFacade.addDataset(
		// 		"rooms",
		// 		datasetContents.get("rooms") ?? "",
		// 		InsightDatasetKind.Rooms
		// 	)
		// 		// .then(() =>
		// 		// 	expect(fs.existsSync(path.resolve(__dirname, "../../data/room.json"))).to.deep.equal(true));
		// 	// ).then((result: string[]) => console.log(result));
		// 		.then(() => {
		// 			const result = insightFacade.performQuery(
		// 				{
		// 					// WHERE: {
		// 					// 	GT: {
		// 					// 		rooms_seats: 400
		// 					// 	}
		// 					// },
		// 					WHERE: {
		// 						AND: [{
		// 					   IS: {
		// 						   rooms_furniture: "*Tables*"
		// 							}
		// 						}, {
		// 							GT: {
		// 						  rooms_seats: 300
		// 						 }
		// 				   }]
		// 				 },
		// 				 OPTIONS: {
		// 					 COLUMNS: [
		// 						 "rooms_shortname",
		// 						 "rooms_seats"

		// 					 ]
		// 					}
		// 				}
		// 			);
		// 			return result;
		// 		// console.log(result);
		// 		}).then((result) => {
		// 			expect(result).to.deep.equal(expected);
		// 	// }).catch((error) => {
		// 	// 	console.log(error);
		// 	// 	expect(error).to.be.an.instanceOf(InsightError);
		// 		});
		// });


		/* Dynamic Tests */
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
