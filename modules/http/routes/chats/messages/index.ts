import { Agent } from '@aimpact/agents-api/business/agent-v2';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler } from '@aimpact/agents-api/http/middleware';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import type { Application, Response as IResponse } from 'express';
import { AudioMessagesRoutes } from './audio';

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
		AudioMessagesRoutes.setup(app);
		app.post('/chats/:id/messages', UserMiddlewareHandler.validate, ChatMessagesRoutes.process);
	}

	static async process(req: IAuthenticatedRequest, res: IResponse) {
		if (!req.body.content) return res.json(new Response({ error: ErrorGenerator.invalidParameters(['content']) }));

		res.setHeader('Content-Type', 'text/plain');
		res.setHeader('Transfer-Encoding', 'chunked');
		const done = (specs: { status: boolean; error?: IError; metadata?: IMetadata }) => {
			const { status, error, metadata } = specs;
			res.write(JSON.stringify({ status, error, metadata }));
			res.end();
		};

		const { user } = req;
		const { id } = req.params;
		const specs = { content: req.body.content, id: req.body.id, systemId: req.body.systemId };
		let metadata: IMetadata;
		try {
			const errorDebug = req.body.error;
			if (errorDebug) {
				if (errorDebug.metadata) {
					res.write(`Lorem Ipsum is simply dummy text of the printing and typesetting industry.`);
					res.write(
						`Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.`
					);
				}
				return done({ status: false, error: ErrorGenerator.testing() });
			}

			const { iterator, error } = await Agent.processIncremental(id, specs, user);
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
			return done({ status: false, error: ErrorGenerator.internalError('HRC100') });
		}

		if (metadata?.error) return done({ status: false, error: metadata.error });

		done({ status: true, metadata });
	}
}
