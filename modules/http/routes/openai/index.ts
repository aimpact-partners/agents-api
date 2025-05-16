import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import { OpenAIBackend } from '@aimpact/agents-api/openai-backend';
import * as dotenv from 'dotenv';
import { Express, Response as IResponse, Request } from 'express';
import { _comind } from './comind';
import { PROMPT } from './prompt';

dotenv.config();
const { GPT_MODEL } = process.env;

export class OpenAIRoutes {
	static setup(app: Express) {
		app.post('/completions', this.completions);
		app.get('/dummy', this.dummy);
	}

	static async completions(req: Request, res: IResponse) {
		const { prompt, text, comind } = req.body;

		const specs = {
			model: GPT_MODEL,
			messages: [
				{ role: 'system', content: prompt },
				{ role: 'user', content: text }
			]
		};

		try {
			if (comind) {
				const { data, error } = await _comind(specs);
				return res.status(data ? 200 : 500).json(new Response({ data, error }));
			}

			const openAIBackend = new OpenAIBackend();
			const result = await openAIBackend.completions(specs);
			res.status(200).json(new Response(result));
		} catch (error) {
			res.status(500).json({ status: false, error: error.message });
		}
	}

	static async dummy(req: Request, res: IResponse) {
		res.status(200).json(new Response({ data: { message: 'This is a dummy endpoint.' } }));
	}
}
