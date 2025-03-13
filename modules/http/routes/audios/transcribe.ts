import { OpenAIBackend } from '@aimpact/agents-api/backend-openai';
import type { IChatData } from '@aimpact/agents-api/data/interfaces';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { Request } from 'express';
import { join } from 'path';
import { FilestoreFile } from '../utils/bucket';
import { generateCustomName } from '../utils/generate-name';
import { getExtension } from '../utils/get-extension';

const oaiBackend = new OpenAIBackend();

// Controlador para manejar la transcripción
export const transcribe = async function (req: Request, chat?: IChatData) {
	if (!req.file) return { error: ErrorGenerator.invalidParameters(['file']) };

	try {
		const { buffer, mimetype, originalname } = req.file;

		const name = `${generateCustomName(originalname)}${getExtension(mimetype)}`;
		let fileSpecs = {};
		if (chat) {
			const identifier = chat?.project.identifier ?? 'default-project';
			let dest = join(identifier, chat.user.id ?? chat.user.uid, 'audio', name);
			dest = dest.replace(/\\/g, '/');

			const fileManager = new FilestoreFile();
			const bucketFile = fileManager.getFile(dest);
			const writeStream = bucketFile.createWriteStream({ resumable: false });
			writeStream.end(buffer);

			fileSpecs = { name, dest, mimetype };
		}
		const transcription = await oaiBackend.transcriptionStream(buffer, mimetype);
		if (transcription.error) return { error: ErrorGenerator.transcribe(transcription.error) };

		return { transcription, file: fileSpecs };
	} catch (exc) {
		return { error: ErrorGenerator.internalError(exc) };
	}
};
