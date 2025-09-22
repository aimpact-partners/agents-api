import { Agent } from '@aimpact/agents-api/business/agent/base';
import { Chat } from '@aimpact/agents-api/business/chats';
import type { IChatData } from '@aimpact/agents-api/data/interfaces';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { Response } from '@beyond-js/response/main';
import type { Application, Response as IResponse } from 'express';
import * as multer from 'multer';
import { transcribe } from '../../audios/transcribe';
import type { IError, IMetadata } from '../interfaces';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export class AudioMessagesRoutes {
	static setup(app: Application) {
		app.post('/chats/:id/messages/audio', upload.single('audio'), AudioMessagesRoutes.process);
	}

	static async process(req: IAuthenticatedRequest, res: IResponse) {
		const { test } = req.query;
		if (!!test) return res.json(new Response({ error: ErrorGenerator.testing() }));

		const chatId = req.params.id;
		if (!chatId) return res.status(400).json({ status: false, error: 'Parameter chatId is required' });

		let chat: IChatData;
		let content: string;
		try {
			const response = await Chat.get(chatId, false);
			if (response.error) return res.status(400).json({ status: false, error: response.error });
			chat = response.data;

			const { transcription, error } = await transcribe(req, chat);
			if (error) return res.status(400).json({ status: false, error });
			if (transcription.error) return res.status(400).json({ status: false, error: transcription.error });

			content = transcription.data?.text;
		} catch (exc) {
			return res.json({ status: false, error: exc.message });
		}

		res.setHeader('Content-Type', 'text/plain');
		res.setHeader('Transfer-Encoding', 'chunked');
		const done = (specs: { status: boolean; error?: IError; metadata?: IMetadata }) => {
			const { status, error, metadata } = specs;
			res.write(JSON.stringify({ status, error, metadata }));
			res.end();
		};

		let metadata: IMetadata;
		try {
			const action = { type: 'transcription', data: { transcription: content } };
			res.write('😸' + JSON.stringify(action) + '🖋️');

			const errorDebug = req.body.error;
			if (errorDebug) {
				if (errorDebug.metadata) {
					const lorem = `Lorem Ipsum is simply dummy text of the printing and typesetting industry.`;
					return setTimeout(() => {
						res.write(lorem);
						setTimeout(() => {
							res.write(lorem);
							done({ status: false, error: ErrorGenerator.testing() });
						}, 2000);
					}, 3000);
				}
				return done({ status: false, error: ErrorGenerator.testing() });
			}

			const { iterator, error } = await Agent.process(chatId, { content });
			if (error) return done({ status: false, error });

			for await (const part of iterator) {
				const { chunk } = part;
				chunk && res.write(chunk);
				if (part.metadata) {
					metadata = part.metadata;
					break;
				}
			}
		} catch (exc) {
			console.error(exc);
			return done({ status: false, error: ErrorGenerator.internalError('HRC101') });
		}

		if (metadata?.error) return done({ status: false, error: metadata.error });

		done({ status: true, metadata });
	}
}
