import type { Readable } from 'stream';
import type { IChatData } from '@aimpact/agents-api/data/interfaces';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { join } from 'path';
import { FilestoreFile } from '../utils/bucket';
import { getExtension } from '../utils/get-extension';
import { generateCustomName } from '../utils/generate-name';
import { PendingPromise } from '@beyond-js/kernel/core';
import { OpenAIBackend } from '@aimpact/agents-api/backend-openai';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import * as stream from 'stream';
import * as Busboy from 'busboy';
import * as dotenv from 'dotenv';

dotenv.config();
const oaiBackend = new OpenAIBackend();

interface IAudioSpecs {
	transcription?: { status: boolean; data?: { text: string }; error?: string };
	fields?: { id: string; systemId: string; timestamp: number };
	file?: { name: string; dest: string; mimeType: string };
	error?: string;
}

interface IFileSpecs {
	type?: string;
	userId?: string;
	project?: string;
	container?: string;
	knowledgeBoxId?: string;
}

function processAudio(req: IAuthenticatedRequest, chat?: IChatData): Promise<IAudioSpecs> {
	const { user } = req;

	const promise = new PendingPromise();
	const bb = Busboy({ headers: req.headers });
	const transcription = new PendingPromise();

	const files: { file: any; info: { filename: string; mimeType: string } }[] = [];
	const fields: Record<string, IFileSpecs> = {};

	bb.on('field', (name: string, val: any) => (fields[name] = val));
	bb.on('file', (name: string, file: Readable, info: { filename: string; mimeType: string }) => {
		let size = 0;
		file.on('data', data => (size += data.length));
		const pass = new stream.PassThrough();
		file.pipe(pass);
		files.push({ file: pass, info });
		oaiBackend.transcriptionStream(file).then(response => transcription.resolve(response));
	});
	bb.on('finish', async () => {
		if (!files.length) {
			promise.resolve({ error: ErrorGenerator.invalidParameters(['file']) });
			return;
		}

		const [item] = files;
		const { file, info } = item;
		const { filename, mimeType } = info;

		let fileSpecs = {};
		if (chat) {
			const name = `${generateCustomName(filename)}${getExtension(mimeType)}`;
			const identifier = chat?.project.identifier ?? 'undefined-project';
			let dest = join(identifier, user.uid, 'audio', name);
			dest = dest.replace(/\\/g, '/');

			// TODO validar guardado
			// const fileManager = new FilestoreFile();
			// const bucketFile = fileManager.getFile(dest);
			// const write = bucketFile.createWriteStream();
			// file.pipe(write);
			fileSpecs = { name, dest, mimeType };
		}

		const response = await transcription;
		promise.resolve({ transcription: response, fields, file: fileSpecs });
	});

	req.pipe(bb);

	return promise;
}

export const transcribe = async function (req: IAuthenticatedRequest, chat?: IChatData): Promise<IAudioSpecs> {
	const { transcription, fields, file, error } = await processAudio(req, chat);

	if (error) return { error };
	if (transcription.error) return { error: `Error transcribing audio: ${transcription.error}` };

	return { transcription, fields, file };
};
