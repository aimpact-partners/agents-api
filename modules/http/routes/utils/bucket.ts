import * as fs from 'fs';
import { join } from 'path';
import { Storage } from '@google-cloud/storage';
import * as dotenv from 'dotenv';
dotenv.config();

export class FilestoreFile {
	private storage;
	#storageBucket = process.env.STORAGEBUCKET;

	constructor() {
		const file = join(__dirname, './credentials/gcloud.json');
		const specs: { keyFilename?: string } = {};
		specs.keyFilename = fs.existsSync(file) ? file : void 0;
		this.storage = new Storage(specs);
	}

	getFile(destination: string) {
		const file = this.storage.bucket(this.#storageBucket).file(destination);
		return file;
	}

	async upload(path: string, destination: string): Promise<string> {
		await this.storage.bucket(this.#storageBucket).upload(path, { destination });
		return destination;
	}
}
