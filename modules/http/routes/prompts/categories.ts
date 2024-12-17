import { PromptCategories } from '@aimpact/agents-api/business/prompts';
import { ErrorGenerator } from '@beyond-js/firestore-collection/errors';
import { Response as HttpResponse } from '@beyond-js/response/main';
import * as dotenv from 'dotenv';
import type { Application, Request, Response } from 'express';

dotenv.config();

export class PromptsCategoriesRoutes {
	static setup(app: Application) {
		app.post('/prompts/categories', this.publish);
		app.get('/prompts/categories/:id', this.get);
		app.put('/prompts/categories/:id', this.update);
		app.delete('/prompts/categories/:id', this.delete);
		app.get('/prompts/categories/project/:id', this.list);

		// app.get('/prompts/categories', UserMiddlewareHandler.validate, this.list);
	}

	static async get(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const response = await PromptCategories.data(id);

			if (response.error) {
				res.json(new HttpResponse(response));
				return;
			}
			if (!response.data.exists) {
				res.json(new HttpResponse({ error: response.data.error }));
				return;
			}
			res.json(new HttpResponse({ data: response.data.data }));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async publish(req: Request, res: Response) {
		try {
			const response = await PromptCategories.save(req.body);

			if (response.error) {
				res.json(new HttpResponse(response));
				return;
			}
			if (response.data.error) {
				res.json(new HttpResponse({ error: response.data.error }));
				return;
			}

			res.json(new HttpResponse({ data: response.data.data }));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async update(req: Request, res: Response) {
		try {
			let response;
			res.json(new HttpResponse(response));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async delete(req: Request, res: Response) {
		try {
			let response;
			res.json(new HttpResponse(response));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async list(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const response = await PromptCategories.byProject(id);
			res.json(new HttpResponse(response));
		} catch (exc) {
			res.json(new HttpResponse({ error: ErrorGenerator.internalError(exc) }));
		}
	}
}
