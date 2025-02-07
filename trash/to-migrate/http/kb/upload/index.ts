import * as os from 'os';
import * as fs from 'fs';
import { join } from 'path';
import * as Busboy from 'busboy';
import * as stream from 'stream';
import type { Request, Response } from 'express';
import config from '@aimpact/chat-api/config';
import { CloudTasksClient } from '@google-cloud/tasks';
import { BucketFile } from './bucket/file';
import { storeKnowledgeBox } from './knowledge-box';
import { getExtension } from './utils/get-extension';
import { generateCustomName } from './utils/generate-name';
import * as dotenv from 'dotenv';
dotenv.config();

interface IFileSpecs {
	project?: string;
	type?: string;
	container?: string;
	userId?: string;
	kbId?: string;
}

/**
 * Task call to set vector
 *
 * @param id string
 * @param path string
 * @param container string
 *
 */
const callTask = (id: string, path: string, container: string) => {
	// Initialize Cloud Tasks clients
	const { GCLOUD_PROJECTID, GCLOUD_LOCATION, GCLOUD_QUEUENAME } = process.env;
	const tasksClient = new CloudTasksClient();
	const parent = tasksClient.queuePath(GCLOUD_PROJECTID, GCLOUD_LOCATION, GCLOUD_QUEUENAME);

	const specs = { id, path, metadata: { container }, token: process.env.GCLOUD_INVOKER };
	const task = {
		httpRequest: {
			httpMethod: 1,
			url: `${config.params.EMBEDDING_API}/${id}`,
			headers: { 'Content-Type': 'application/json' },
			body: Buffer.from(JSON.stringify(specs)).toString('base64')
		}
	};
	tasksClient.createTask({ parent, task });
};

/**
 *
 * @param req
 * @param res
 * @returns
 */
export /*bundle*/ const uploader = async function (req: Request, res: Response) {
	const files = [];
	const fields: IFileSpecs = {};
	const bucketFile = new BucketFile();

	const onFile = (nameV, file, info) => {
		const { filename, mimeType } = info;

		// TODO: @ftovar8 solve size

		const pass = new stream.PassThrough();
		file.pipe(pass);
		files.push({ file: pass, filename, mimeType, size: 10 });
	};

	const onFinish = () => {
		const { project, userId, kbId } = fields;
		if (!project || !userId) {
			return res.json({
				status: false,
				error: `Error uploading files: All fields (project, userId) are required`
			});
		}

		const container = fields.container ?? 'public';

		const bucketName = join(project, userId, 'kb', container);
		let tempPath: string = join(os.tmpdir(), bucketName); // store on temporal directory
		tempPath = tempPath.replace(/\\/g, '/');
		fs.mkdirSync(tempPath, { recursive: true });

		const docs = [];
		files.map(({ file, filename, mimeType, size }) => {
			let path = join(bucketName, filename);
			path = path.replace(/\\/g, '/');

			// write on bucket
			const bucketWriteStream = bucketFile.get(path).createWriteStream();
			file.pipe(bucketWriteStream);

			// write on local/temporal
			const name = `${generateCustomName(filename)}${getExtension(mimeType)}`;
			const stream = fs.createWriteStream(join(tempPath, name));
			file.pipe(stream);

			const createdAt: number = new Date().getTime();
			docs.push({ name, originalname: filename, path, size, mimeType, createdAt });
		});

		// Publish KnowledgeBox on firestore
		storeKnowledgeBox({ container, userId, kbId, docs }).then(id => {
			callTask(id, tempPath, container);
			//aqui hay que llamar a read directory
			return res.json({
				status: true,
				data: { kbId: id, message: 'File(s) uploaded successfully' }
			});
		});
	};

	try {
		const bb = Busboy({ headers: req.headers });
		bb.on('file', onFile);
		bb.on('field', (name, val, info) => (fields[name] = val));
		bb.on('finish', onFinish);

		req.pipe(bb);
	} catch (error) {
		res.json({
			status: false,
			error: `Error uploading file(s): ${error.message}`
		});
	}
};
