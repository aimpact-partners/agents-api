import {
	PromptsTemplate,
	PromptTemplateLanguages,
	PromptTemplateProcessor
} from '@aimpact/agents-api/business/prompts';
import { ErrorGenerator } from '@beyond-js/firestore-collection/errors';
import { Response as HttpResponse } from '@beyond-js/response/main';
import * as dotenv from 'dotenv';
import type { Application, Request, Response } from 'express';
import { PromptsCategoriesRoutes } from './categories';

dotenv.config();

export class PromptsRoutes {
	static setup(app: Application) {
		PromptsCategoriesRoutes.setup(app);

		app.get('/prompts/templates/project/:projectId', this.list);
		app.get('/prompts/templates/:id', this.get);
		app.get('/prompts/templates/identifier/:id', this.identifier);
		app.get('/prompts/templates/:id/data', this.data);
		app.post('/prompts/templates', this.publish);
		app.put('/prompts/templates/:id', this.update);
		app.delete('/prompts/templates/:id', this.delete);

		app.post('/prompts/templates/:id/translate', this.translate);

		app.post('/prompts/templates/:id/languages/update', this.updateLanguage);

		app.post('/prompts/templates/:id/process', this.process);
		app.post('/prompts/templates/:id/process-literal', this.processLiteral);
	}

	static async list(req: Request, res: Response) {
		try {
			const { projectId } = req.params;
			const filter = req.query.is;
			const response = await PromptsTemplate.list(projectId, filter);
			if (response.error) return res.json(new HttpResponse({ error: response.error }));

			res.json(new HttpResponse({ data: response.data }));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async get(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { language } = req.query;
			const response = await PromptsTemplate.data(id, language);
			if (response.error) return res.json(new HttpResponse(response));

			res.json(new HttpResponse({ data: response.data }));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async identifier(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { language } = req.query;
			const response = await PromptsTemplate.identifier(id, language);
			if (response.error) return res.json(new HttpResponse(response));

			res.json(new HttpResponse({ data: response.data }));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async data(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { language, option } = req.query;
			const response = await PromptsTemplate.data(id, language, option);
			if (response.error) return res.json(new HttpResponse(response));
			if (!response.data.exists) return res.json(new HttpResponse({ error: response.data.error }));

			res.json(new HttpResponse({ data: response.data.data }));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async update(req: Request, res: Response) {
		try {
			const specs = req.body;
			const { data, error } = await PromptsTemplate.update(specs);

			res.json(new HttpResponse({ data, error }));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async delete(req: Request, res: Response) {
		try {
			// const { user } = req;
			const { id } = req.params;

			const response = await PromptsTemplate.delete(id);
			if (response.error) {
				return res.json(new HttpResponse({ error: response.error }));
			}

			res.json(new HttpResponse({ data: response.data }));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async publish(req: Request, res: Response) {
		try {
			const specs = req.body;
			const { data, error } = await PromptsTemplate.save(specs);

			res.json(new HttpResponse({ data, error }));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async translate(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { language, text } = req.body;

			const response = await PromptTemplateLanguages.set(id, { language, text });
			res.json(new HttpResponse(response));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async updateLanguage(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { language } = req.body;

			const response = await PromptTemplateLanguages.update(id, language);
			res.json(new HttpResponse(response));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async processLiteral(req: Request, res: Response) {
		try {
			const { prompt, model, temperature } = req.body;
			const response = await PromptsTemplate.process(prompt, model, temperature);
			if (response.error) {
				res.json(new HttpResponse(response));
				return;
			}
			if (response.data.error) {
				res.json(new HttpResponse({ error: response.data.error }));
				return;
			}

			res.json(new HttpResponse({ data: response.data }));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async process(req: Request, res: Response) {
		try {
			const params = req.body;
			const promptTemplate = new PromptTemplateProcessor(params);
			await promptTemplate.process();

			if (promptTemplate.error) {
				res.json(new HttpResponse({ error: promptTemplate.error }));
				return;
			}

			const value = promptTemplate.processedValue;
			res.json(new HttpResponse({ data: { value } }));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}
}
