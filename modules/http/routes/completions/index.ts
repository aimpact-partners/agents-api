// import { Comind } from '@aimpact/platform-server/comind'; // platform
// import { OpenAIBackend } from '@aimpact/platform-server/openai/model'; // platform
import { Comind } from '@aimpact/agents-api/comind';
import { OpenAIBackend } from '@aimpact/agents-api/openai-backend';
import { Application, Response as IResponse, Request } from 'express';
import OpenAI from 'openai';
import { MODELS } from './models';

interface ICompletionsSpecs {
	prompt: string;
	text: string;
	model?: string;
	temperature?: number;
	format?: 'text' | 'json' | 'json_schema';
	schema?: Record<string, any>;
	interactions?: { role: 'assistant' | 'user'; content: string }[];
}

export class CompletionsRoutes {
	static setup(app: Application) {
		app.get('/models', this.models);
		app.post('/completions', this.completions);
		app.get('/dummy', this.dummy);
	}

	static async models(req: Request, res: IResponse) {
		try {
			const models = MODELS.openai.concat(MODELS.comind);
			res.status(200).json({ data: models });
		} catch (error) {
			res.status(500).json({ status: false, error: error.message });
		}
	}

	static async completions(req: Request, res: IResponse) {
		const { prompt, text, model, temperature, format, schema, interactions } = <ICompletionsSpecs>req.body;

		if (!prompt) return res.status(400).json({ error: { code: 100, text: `Missing required parameter: prompt` } });
		if (!text) return res.status(400).json({ error: { code: 100, text: `Missing required parameter: text` } });
		if (!model) return res.status(400).json({ error: { code: 100, text: `Missing required parameter: model` } });

		try {
			let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
			messages = messages
				.concat([{ role: 'system', content: prompt }])
				.concat(interactions ?? [])
				.concat({ role: 'user', content: text });

			const specs = {
				model,
				temperature,
				format: format ?? 'text',
				schema: schema ?? undefined,
				messages
			};

			if (MODELS.comind.includes(model)) {
				const { data, error } = await Comind.fecth(specs);
				return res.status(data ? 200 : 500).json({ data, error });
			}
			if (!MODELS.openai.includes(model)) {
				return res.status(400).json({ error: { code: 100, text: 'Model not supported' } });
			}

			const openAIBackend = new OpenAIBackend();
			const result = await openAIBackend.completions(specs);
			res.status(200).json(result);
		} catch (error) {
			res.status(500).json({ status: false, error: error.message });
		}
	}

	static async dummy(req: Request, res: IResponse) {
		res.status(200).json({ data: { message: 'This is a dummy endpoint.' } });
	}
}
