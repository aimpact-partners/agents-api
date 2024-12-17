import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Storage } from '@google-cloud/storage';
import * as dotenv from 'dotenv';
dotenv.config();

export async function getFile(fileName: string): Promise<fs.ReadStream> {
	const file = path.join(__dirname, './credentials.json');
	const specs: { keyFilename? } = {};
	specs.keyFilename = fs.existsSync(file) ? file : void 0;

	const storage = new Storage(specs);
	const bucket = storage.bucket(process.env.STORAGEBUCKET);

	const tempFilePath = path.join(os.tmpdir(), 'update.mp3');
	const bucketFile = bucket.file(fileName);
	await bucketFile.download({ destination: tempFilePath });

	const readStream = fs.createReadStream(tempFilePath);
	return readStream;
}
