import { UserMiddlewareHandler } from '@aimpact/agents-api/http/middleware';
import type { Application } from 'express';
import { audio } from './audio';
import { v2 } from './v2';

export interface IMetadata {
	summary?: string;
	objectives?: [];
	credits?: { total: number; consumed: number };
	error?: IError;
}
export interface IError {
	code: number;
	text: string;
}

export class ChatMessagesRoutes {
	static setup(app: Application) {
		app.post('/chats/:id/messages/audio', UserMiddlewareHandler.validate, audio);
		app.post('/chats/:id/messages', UserMiddlewareHandler.validate, v2);

		// v1 -- app.post('/chats/:id/messages', UserMiddlewareHandler.validate, ChatMessagesRoutes.sendMessage);
	}

	// static async sendMessage(req: IAuthenticatedRequest, res: IResponse) {
	// 	const { test } = req.query;
	// 	if (!!test) {
	// 		return res.status(400).json(new Response({ error: ErrorGenerator.testingError() }));
	// 	}

	// 	const chatId = req.params.id;
	// 	if (!chatId) return res.status(400).json({ status: false, error: 'Parameter chatId is required' });

	// 	let chat: IChatData;
	// 	try {
	// 		const response = await Chat.get(chatId, 'false');
	// 		if (response.error) return res.status(400).json({ status: false, error: response.error });
	// 		chat = response.data;
	// 	} catch (exc) {
	// 		res.json({ status: false, error: exc.message });
	// 	}

	// 	const done = (specs: { status: boolean; error?: IError }) => {
	// 		const { status, error } = specs;
	// 		res.write('ÿ');
	// 		res.write(JSON.stringify({ status, error }));
	// 		res.end();
	// 	};
	// 	res.setHeader('Content-Type', 'text/plain');
	// 	res.setHeader('Transfer-Encoding', 'chunked');

	// 	const { user } = req;
	// 	let metadata: IMetadata;
	// 	try {
	// 		const { iterator, error } = await Agent.sendMessage(chatId, req.body, user.uid);
	// 		if (error) return done({ status: false, error });

	// 		for await (const part of iterator) {
	// 			const { chunk } = part;
	// 			chunk && res.write(chunk);
	// 			if (part.metadata) {
	// 				metadata = part.metadata;
	// 				break;
	// 			}
	// 		}
	// 	} catch (exc) {
	// 		console.error(exc);
	// 		return done({ status: false, error: ErrorGenerator.internalError('HRC100') });
	// 	}

	// 	if (metadata?.error) return done({ status: false, error: metadata.error });

	// 	done({ status: true });
	// }
}
