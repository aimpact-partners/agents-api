import * as fs from 'fs';
import { join } from 'path';
import { Storage } from '@google-cloud/storage';

const file = join(process.cwd(), './credentials/gcloud.json');
const options = fs.existsSync(file) ? { keyFilename: file } : void 0;

export /*bundle*/ const storage = new Storage(options);
