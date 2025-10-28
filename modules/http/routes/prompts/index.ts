import {
	PromptsTemplate,
	PromptTemplateLanguages,
	PromptTemplateProcessor
} from '@aimpact/agents-api/business/prompts';
import { ErrorGenerator } from '@beyond-js/firestore-collection/errors';
import { Response } from '@beyond-js/response/main';
import * as dotenv from 'dotenv';
import type { Application, Response as IResponse, Request } from 'express';
import { PromptsCategoriesRoutes } from './categories';

dotenv.config();

export class PromptsRoutes {
	static setup(app: Application) {
		PromptsCategoriesRoutes.setup(app);

		app.get('/prompts/templates/identifier/:id', this.identifier);
		app.get('/prompts/templates/:id/data', this.data);
		app.get('/prompts/templates/projects/:projectId', this.list);
		app.get('/prompts/templates/project/:projectId', this.list);

		app.get('/prompts/templates/:id', this.get);
		app.delete('/prompts/templates/:id', this.delete);
		app.put('/prompts/templates/:id', this.update);

		app.post('/prompts/templates/:id/translate', this.translate);
		app.post('/prompts/templates/:id/languages/update', this.updateLanguage);
		app.post('/prompts/templates/:id/process', this.process);

		app.post('/prompts/templates/process/completion', this.processLiteral);
		app.post('/prompts/templates', this.publish);

		app.get('/prompts/templates', this.items);
	}

	static async list(req: Request, res: IResponse) {
		try {
			const { projectId } = req.params;
			const filter = req.query.is;
			const response = await PromptsTemplate.list(projectId, filter);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async get(req: Request, res: IResponse) {
		try {
			const { id } = req.params;
			const { language } = req.query;
			const response = await PromptsTemplate.data(id, language);
			if (response.error) return res.json(new Response(response));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async identifier(req: Request, res: IResponse) {
		try {
			const { id } = req.params;
			const { language } = req.query;
			const response = await PromptsTemplate.identifier(id, language);
			if (response.error) return res.json(new Response(response));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async data(req: Request, res: IResponse) {
		try {
			const { id } = req.params;
			const { language, option } = req.query;
			const response = await PromptsTemplate.data(id, language, option);
			if (response.error) return res.json(new Response(response));
			if (!response.data.exists) return res.json(new Response({ error: response.data.error }));

			res.json(new Response({ data: response.data.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async update(req: Request, res: IResponse) {
		try {
			const specs = req.body;
			const { id } = req.params;
			const { data, error } = await PromptsTemplate.update({ ...specs, id });
			if (error) {
				return res.status(error.code === 404 ? 404 : 500).json(new Response({ error }));
			}

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async delete(req: Request, res: IResponse) {
		try {
			// const { user } = req;
			const { id } = req.params;

			const response = await PromptsTemplate.delete(id);
			if (response.error) {
				return res
					.status(response.error.code === 404 ? 404 : 500)
					.json(new Response({ error: response.error }));
			}

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async publish(req: Request, res: IResponse) {
		try {
			const specs = req.body;
			const { data, error } = await PromptsTemplate.save(specs);
			if (error) {
				return res.status(error.code === 404 ? 404 : 500).json(new Response({ error }));
			}
			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async translate(req: Request, res: IResponse) {
		try {
			const { id } = req.params;
			const { language, text } = req.body;

			const { data, error } = await PromptTemplateLanguages.set(id, { language, text });
			if (error) {
				return res.status(error.code === 404 ? 404 : 500).json(new Response({ error }));
			}

			res.json(new Response(data));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async updateLanguage(req: Request, res: IResponse) {
		try {
			const { id } = req.params;
			const { language } = req.body;

			const response = await PromptTemplateLanguages.update(id, language);
			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async processLiteral(req: Request, res: IResponse) {
		try {
			const { prompt, model, temperature } = req.body;
			const response = await PromptsTemplate.process(prompt, model, temperature);
			if (response.error) {
				res.json(new Response(response));
				return;
			}
			if (response.data.error) {
				res.json(new Response({ error: response.data.error }));
				return;
			}

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async process(req: Request, res: IResponse) {
		try {
			const params = req.body;
			const promptTemplate = new PromptTemplateProcessor(params);
			await promptTemplate.process();

			if (promptTemplate.error) {
				return res
					.status(promptTemplate.error.code === 404 ? 404 : 500)
					.json(new Response({ error: promptTemplate.error }));
			}

			const value = promptTemplate.processedValue;
			const { format, schema } = promptTemplate;

			res.json(new Response({ data: { value, format, schema } }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async items(req: Request, res: IResponse) {
		try {
			const { language } = req.query;
			if (!language || typeof language !== 'string') {
				return res.status(400).json(new Response({ error: ErrorGenerator.invalidParameters(['language']) }));
			}

			const ids = req.query.ids;
			if (!ids || typeof ids !== 'string') {
				return res.status(400).json(new Response({ error: ErrorGenerator.invalidParameters(['ids']) }));
			}

			const tags = ids
				.split(',')
				.map(tag => tag.trim())
				.filter(Boolean);
			if (tags.length === 0) {
				return res.status(400).json(new Response({ error: ErrorGenerator.invalidParameters(['ids']) }));
			}

			const response = await PromptsTemplate.items(tags, language);
			if (response.error) {
				return res
					.status(response.error.code === 404 ? 404 : 500)
					.json(new Response({ error: response.error }));
			}

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.status(500).json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}
}
