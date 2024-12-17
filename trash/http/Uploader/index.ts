import { join } from 'path';
import * as stream from 'stream';
import * as Busboy from 'busboy';
import { FilestoreFile } from '../../bucket/file';
import { getExtension } from '../../utils/get-extension';
import { generateCustomName } from '../../utils/generate-name';
import { PendingPromise } from '@beyond-js/kernel/core';
import { Agents } from '@aimpact/chat-api/agents';
import { OpenAIBackend } from '@aimpact/chat-api/backend-openai';
import * as dotenv from 'dotenv';
dotenv.config();

const oaiBackend = new OpenAIBackend();

interface IFileSpecs {
	project?: string;
	type?: string;
	container?: string;
	userId?: string;
	knowledgeBoxId?: string;
}

function isReadableStream(obj) {
	return obj instanceof stream.Readable;
}

function processRequest(req, res): Promise<any> {
	const promise = new PendingPromise();
	const fields: IFileSpecs = {};
	const bb = Busboy({ headers: req.headers });
	const files = [];

	let transcription = new PendingPromise();
	bb.on('field', (name, val) => (fields[name] = val));
	bb.on('file', (nameV, file, info) => {
		let size = 0;
		file.on('data', data => (size += data.length));
		const pass = new stream.PassThrough();
		file.pipe(pass);
		files.push({ file: pass, info });
		oaiBackend.transcriptionStream(file, 'es').then(response => transcription.resolve(response));
	});
	bb.on('finish', async () => {
		const [item] = files;
		const {
			file,
			info: { filename, mimeType }
		} = item;

		const { project, container, userId } = fields;
		const name = `${generateCustomName(filename)}${getExtension(mimeType)}`;
		let dest = join(project, userId, container, name);
		dest = dest.replace(/\\/g, '/');
		const response = await transcription;

		const fileManager = new FilestoreFile();
		const bucketFile = fileManager.getFile(dest);
		const write = bucketFile.createWriteStream();
		file.pipe(write);

		promise.resolve({ transcription: response, fields, file: { name, dest, mimeType } });
	});

	// TODO @ftovar8 @jircdev validar el funcionamiento de estos metodos
	process.env?.CLOUD_FUNCTION ? bb.end(req.rawBody) : req.pipe(bb);

	return promise;
}

export /*bundle*/ const uploader = async function (req, res) {
	try {
		const { transcription, fields, file } = await processRequest(req, res);
		if (!transcription.status) {
			return res.json({
				status: false,
				error: `Error transcribing audio: ${transcription.error}`
			});
		}

		/**
		 * Pendientes
		 * Agregar guardado en mensaje desde el backend
		 * remover el guardado desde el cliente
		 * agregar captura de la respuesta de manera incremental en el cliente
		 */
		const { conversationId } = fields;
		const { iterator, error } = await Agents.sendMessage(conversationId, transcription.data?.text);
		if (error) {
			return res.status(500).json({ status: false, error });
		}

		let answer = '';
		let stage: { synthesis: string };
		for await (const part of iterator) {
			const { chunk } = part;
			answer += chunk ? chunk : '';
			if (part.stage) {
				stage = part.stage;
				break;
			}
		}

		return res.json({
			status: true,
			data: {
				file: file.dest,
				transcription: transcription.data.text,
				output: answer,
				message: 'File uploaded successfully'
			}
		});
	} catch (error) {
		console.error(error);
		res.json({
			status: false,
			error: error.message
		});
	}
};
