/* TestUtils file adapted from Mutant Killing Tutorial */

import * as fs from "fs-extra";

export const persistDir = "./data";

export function getContentFromArchives(name: string) {
	return fs.readFileSync(`test/resources/archives/${name}`).toString("base64");
}

export function clearDisk(): void {
	fs.removeSync(persistDir);
}

export function readDisk(): string[] {
	return fs.readdirSync("./data");
}

export function checkFileExists(name: string): boolean {
	return fs.existsSync(name);
}
