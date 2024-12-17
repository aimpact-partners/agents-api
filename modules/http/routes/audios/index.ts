import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import type { Application, Response as IResponse } from 'express';
import { UserMiddlewareHandler } from '@aimpact/agents-api/http/middleware';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import { Response } from '@beyond-js/response/main';
import { transcribe } from './transcribe';

export class AudiosRoutes {
	static setup(app: Application) {
		app.post('/audios/transcribe', UserMiddlewareHandler.validate, AudiosRoutes.process);
	}

	static async process(req: IAuthenticatedRequest, res: IResponse) {
		const { test } = req.query;
		if (!!test) return res.json(new Response({ error: ErrorGenerator.testingError() }));

		try {
			const { transcription, error } = await transcribe(req);
			if (error) return { error };
			if (transcription.error) return { error: transcription.error };

			res.json(new Response({ data: { text: transcription.data?.text } }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}
}
