import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { Response } from '@beyond-js/response/main';
import type { Application, Response as IResponse } from 'express';
import * as multer from 'multer';
import { transcribe } from './transcribe';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export class AudiosRoutes {
	static setup(app: Application) {
		app.post('/audios/transcribe', upload.single('file'), AudiosRoutes.process);
	}

	static async process(req: IAuthenticatedRequest, res: IResponse) {
		const { test } = req.query;
		if (!!test) return res.json(new Response({ error: ErrorGenerator.testing() }));

		try {
			req.body = { transcribe: true };
			const { transcription, error } = await transcribe(req);
			if (error) return res.json(new Response({ error }));

			res.json(new Response({ data: { text: transcription.data?.text } }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}
}
