import { Agent } from '@aimpact/agents-api/business/agent';
import { Chat } from '@aimpact/agents-api/business/chats';
import type { IChatData } from '@aimpact/agents-api/data/interfaces';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { Response } from '@beyond-js/response/main';
import type { Response as IResponse } from 'express';
import { transcribe } from '../../audios/transcribe';
import type { IError, IMetadata } from './index';

interface IData {
	id?: string;
	content: string;
	systemId?: string;
}

export const audio = async (req: IAuthenticatedRequest, res: IResponse) => {
	const { test } = req.query;
	if (!!test) return res.json(new Response({ error: ErrorGenerator.testingError() }));

	const chatId = req.params.id;
	if (!chatId) return res.status(400).json({ status: false, error: 'Parameter chatId is required' });

	let data: IData;
	let chat: IChatData;
	try {
		const response = await Chat.get(chatId, 'false');
		if (response.error) return res.status(400).json({ status: false, error: response.error });
		chat = response.data;

		const { transcription, fields, error } = await transcribe(req, chat);
		if (error) return res.status(400).json({ status: false, error });
		if (transcription.error) return res.status(400).json({ status: false, error: transcription.error });

		data = { id: fields.id, content: transcription.data?.text, systemId: fields.systemId };
	} catch (exc) {
		return res.json({ status: false, error: exc.message });
	}

	const done = (specs: { status: boolean; error?: IError }) => {
		const { status, error } = specs;
		res.write('ÿ');
		res.write(JSON.stringify({ status, error }));
		res.end();
	};
	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Transfer-Encoding', 'chunked');

	const { user } = req;
	const { content } = data;

	let metadata: IMetadata;
	try {
		const action = { type: 'transcription', data: { transcription: content } };
		res.write('😸' + JSON.stringify(action) + '🖋️');

		const { iterator, error } = await Agent.sendMessage(chatId, data, user.uid);
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

	if (metadata.error) return done({ status: false, error: metadata.error });

	done({ status: true });
};
