import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import chai, {expect, use} from "chai";
import chaiHttp from "chai-http";
import * as fs from "fs-extra";

describe("Server", function () {

	const SERVER_URL = "http://localhost:4321";

	let facade: InsightFacade;
	let server: Server;

	use(chaiHttp);

	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		server.start().then(() => {
			console.log("Server started");
		}).catch((err) => {
			console.log("Error starting server");
			expect.fail(err);
		});
	});

	after(function () {
		// TODO: stop server here once!
		server.stop();
		console.log("Server stopped");
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what"s going on
		console.info(`BeforeTest: ${this.currentTest?.title}`);
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what"s going on
		console.info(`AfterTest: ${this.currentTest?.title}`);
	});

	// PUT requests

	it("PUT test for courses dataset (200)", function () {
		let ZIP_FILE_DATA: Buffer = fs.readFileSync("test/resources/archives/pair.zip");

		try {
			return chai.request(SERVER_URL)
				.put("/dataset/sections/sections")
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					console.log("PUT response: ", res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					console.log("PUT request error: ", err);
					expect.fail(err);
				});
		} catch (err) {
			// and some more logging here!
			console.error("PUT error: ", err);
		}
	});

	it("PUT test for courses dataset (200)", function () {
		let ZIP_FILE_DATA: Buffer = fs.readFileSync("test/resources/archives/small.zip");

		try {
			return chai.request(SERVER_URL)
				.put("/dataset/small/sections")
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					console.log("PUT response: ", res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					console.log("PUT request error: ", err);
					expect.fail(err);
				});
		} catch (err) {
			// and some more logging here!
			console.error("PUT error: ", err);
		}
	});

	it("PUT test for rooms dataset (200)", function () {
		let ZIP_FILE_DATA: Buffer = fs.readFileSync("test/resources/archives/rooms.zip");

		try {
			return chai.request(SERVER_URL)
				.put("/dataset/rooms/rooms")
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					console.log("PUT response: ", res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log("PUT request error: ", err);
					expect.fail(err);
				});
		} catch (err) {
			console.error("PUT error: ", err);
		}
	});

	it("PUT test for incorrect kind courses dataset (400)", function () {
		let ZIP_FILE_DATA: Buffer = fs.readFileSync("test/resources/archives/pair.zip");

		try {
			return chai.request(SERVER_URL)
				.put("/dataset/sections/test")
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					console.log("Response: 400", res.body);
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					expect.fail(err);
				});
		} catch (err) {
			console.error("PUT error: ", err);
		}
	});

	it("PUT test for empty courses dataset (400)", function () {
		let ZIP_FILE_DATA: Buffer = fs.readFileSync("test/resources/archives/empty.zip");

		try {
			return chai.request(SERVER_URL)
				.put("/dataset/empty/sections")
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					console.log("Response: 400", res.body);
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					expect.fail(err);
				});
		} catch (err) {
			console.error("PUT error: ", err);
		}
	});

	it("PUT test for incorrect folder name courses dataset (400)", function () {
		let ZIP_FILE_DATA: Buffer = fs.readFileSync("test/resources/archives/incorrect-folder-name.zip");

		try {
			return chai.request(SERVER_URL)
				.put("/dataset/incorrect-folder-name/sections")
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					console.log("Response: 400", res.body);
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					expect.fail(err);
				});
		} catch (err) {
			console.error("PUT error: ", err);
		}
	});

	it("PUT test for courses dataset underscore in id(400)", function () {
		let ZIP_FILE_DATA: Buffer = fs.readFileSync("test/resources/archives/pair.zip");

		try {
			return chai.request(SERVER_URL)
				.put("/dataset/p_air/sections")
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					console.log("Response: 400", res.body);
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					expect.fail(err);
				});
		} catch (err) {
			console.error("PUT error: ", err);
		}
	});

	it("2 PUT same tests for rooms dataset (200)", function () {
		let ZIP_FILE_DATA: Buffer = fs.readFileSync("test/resources/archives/rooms.zip");

		try {
			return chai.request(SERVER_URL)
				.put("/dataset/rooms/rooms")
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					console.log("PUT response: ", res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log("PUT request error: ", err);
					expect.fail(err);
				})
				.then(() => {
					chai.request(SERVER_URL)
						.put("/dataset/rooms/rooms")
						.send(ZIP_FILE_DATA)
						.set("Content-Type", "application/x-zip-compressed")
						.then(function (res: ChaiHttp.Response) {
							console.log("PUT response: ", res.body);
							expect(res.status).to.be.equal(200);
						})
						.catch(function (err) {
							console.log("PUT request error: ", err);
							expect.fail(err);
						});
				});
		} catch (err) {
			console.error("PUT error: ", err);
		}
	});

	// // POST requests

	it("POST test for querying courses dataset (200)", function () {
		let query: object = {
			WHERE: {
				IS: {
					sections_dept: "*lc*"
				}
			},
			OPTIONS: {
				COLUMNS: [
					"sections_dept"
				],
				ORDER: "sections_dept"
			}
		};

		try {
			return chai.request(SERVER_URL)
				.post("/query")
				.set("Content-Type", "application/json")
				.send(query)
				.then(function (res: ChaiHttp.Response) {
					expect(res.status).to.be.equal(200);
					console.log(res.body);
				})
				.catch(function (err) {
					console.log("POST response error: ", err);
					expect.fail(err);
				});
		} catch (err) {
			console.error("POST error: ", err);
		}
	});


	it("POST test for sections dataset (400)", function () {
		let query: object = {
			WHERE: {
			},
			OPTIONS: {
				COLUMNS: [
					"sections_instructor"
				],
				ORDER: "sections_instructor"
			}
		};

		try {
			return chai.request(SERVER_URL)
				.post("/query")
				.set("Content-Type", "application/json")
				.send(query)
				.then((res: ChaiHttp.Response) => {
					console.log("POST response: ", res.body);
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					console.log("POST response error: ", err);
					expect.fail(err);
				});
		} catch (err) {
			console.error("POST error: ", err);
		}
	});

	it("POST test for rooms dataset (200)", function () {
		let query: object = {
			WHERE: {
				IS: {
					rooms_name: "C*"
				}
			},
			OPTIONS: {
				COLUMNS: [
					"rooms_name",
					"rooms_lat",
					"rooms_lon"
				],
				ORDER: "rooms_name"
			}
		};

		try {
			return chai.request(SERVER_URL)
				.post("/query")
				.set("Content-Type", "application/json")
				.send(query)
				.then((res: ChaiHttp.Response) => {
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log("POST response error: ", err);
					expect.fail(err);
				});
		} catch (err) {
			console.error("POST error: ", err);
		}
	});

	// GET requests

	it("GET test for list datasets", function () {
		try {
			return chai.request(SERVER_URL)
				.get("/datasets")
				.then(function (res: ChaiHttp.Response) {
					console.log("GET response: ", res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err: any) {
					expect.fail(err.message);
				});
		} catch (err: any) {
			console.error("GET error: ", err.message);
		}
	});


	// DELETE requests

	it("DELETE test for courses dataset invalid id (400)", function () {
		try {
			return chai.request(SERVER_URL)
				.delete("/dataset/small_")
				.then(function (res: ChaiHttp.Response) {
					console.log("DELETE response: ", res.body);
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					expect.fail(err);
				});
		} catch (err) {
			console.error("DELETE error: ", err);
		}
	});

	it("DELETE test for courses dataset not found (404)", function () {
		try {
			return chai.request(SERVER_URL)
				.delete("/dataset/notfound")
				.then(function (res: ChaiHttp.Response) {
					console.log("DELETE response: ", res.body);
					expect(res.status).to.be.equal(404);
				})
				.catch(function (err) {
					expect.fail(err);
				});
		} catch (err) {
			console.error("DELETE error: ", err);
		}
	});

	it("DELETE test for small courses dataset (200)", function () {
		try {
			return chai.request(SERVER_URL)
				.delete("/dataset/small")
				.then(function (res: ChaiHttp.Response) {
					console.log("DELETE response: ", res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					expect.fail(err);
				});
		} catch (err) {
			console.error("DELETE error: ", err);
		}
	});

	it("DELETE test for rooms dataset (200)", function () {
		try {
			return chai.request(SERVER_URL)
				.delete("/dataset/rooms")
				.then(function (res: ChaiHttp.Response) {
					console.log("DELETE response: ", res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					expect.fail(err);
				});
		} catch (err) {
			console.error("DELETE error: ", err);
		}
	});
});
