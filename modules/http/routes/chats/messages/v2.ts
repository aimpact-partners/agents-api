import { Agent } from '@aimpact/agents-api/business/agent-v2';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { Response } from '@aimpact/agents-api/http/response';
import type { Response as IResponse } from 'express';

export interface IMetadata {
	answer: string;
	summary?: string;
	progress?: string;
	error?: IError;
}
export interface IError {
	code: number;
	text: string;
}

export const v2 = async (req: IAuthenticatedRequest, res: IResponse) => {
	if (!req.body.content) return res.json(new Response({ error: ErrorGenerator.invalidParameters(['content']) }));

	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Transfer-Encoding', 'chunked');
	const done = (specs: { status: boolean; error?: IError }) => {
		const { status, error } = specs;
		res.write('ÿ');
		res.write(JSON.stringify({ status, error }));
		res.end();
	};

	const { user } = req;
	const { id } = req.params;
	const specs = { content: req.body.content, id: req.body.id, systemId: req.body.systemId };
	let metadata: IMetadata;
	try {
		const { iterator, error } = await Agent.sendMessage(id, specs, user);
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
		return done({ status: false, error: ErrorGenerator.internalError('HRC100') });
	}

	if (metadata?.error) return done({ status: false, error: metadata.error });

	done({ status: true });
};
