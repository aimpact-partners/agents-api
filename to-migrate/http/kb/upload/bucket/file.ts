import { join } from 'path';
import * as dotenv from 'dotenv';
import { Storage } from '@google-cloud/storage';
dotenv.config();

export class BucketFile {
	private storage: Storage;
	#storageBucket = process.env.STORAGEBUCKET;

	constructor() {
		const credentials = join(__dirname, './credentials.json');
		this.storage = new Storage({ keyFilename: credentials });
	}

	get(destination: string) {
		const bucketName = this.#storageBucket;
		return this.storage.bucket(bucketName).file(destination);
	}

	async upload(uploaded, path: string, destination: string): Promise<string> {
		const bucketName = this.#storageBucket;
		const file = this.storage.bucket(bucketName).file(destination);
		//await this.storage.bucket(bucketName).upload(path, { destination });

		return new Promise((resolve, reject) => {
			const stream = file.createWriteStream({
				metadata: { contentType: uploaded.mimetype },
			});
			stream.on('error', err => {
				console.error(err);
				reject(err);
			});
			stream.on('finish', () => {
				resolve(destination);
			});
			stream.end(uploaded.buffer);
		});
	}

	async filterFiles(prefix: string | undefined) {
		try {
			const bucketName = this.#storageBucket;
			const bucket = this.storage.bucket(bucketName);
			const specs = prefix ? { prefix } : {};
			let [files] = await bucket.getFiles(specs);

			return files;
		} catch (e) {
			return { status: false, error: e.message };
		}
	}

	async deleteFiles(prefix: string | undefined) {
		try {
			const files = await this.filterFiles(prefix);

			await Promise.all(files.map(file => file.delete()));
			return true;
		} catch (e) {
			return { status: false, error: e.message };
		}
	}
}
