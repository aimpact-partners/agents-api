import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import { Schemas } from '@aimpact/agents-api/business/schemas';
import type { Application, Response as IResponse, Request } from 'express';

export class SchemasRoutes {
	static setup(app: Application) {
		app.get('/schemas/:id', this.data);
		app.post('/schemas', this.publish);
	}

	static async data(req: Request, res: IResponse) {
		try {
			const { id } = req.params;
			const { language } = req.query;
			const errors = [];
			!language && errors.push('language');
			if (errors.length) return res.json(new Response({ error: ErrorGenerator.invalidParameters(errors) }));

			const response = await Schemas.get(id, language);
			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async publish(req: Request, res: IResponse) {
		try {
			const { id, language, schema } = req.body;
			const errors = [];
			!id && errors.push('id');
			!language && errors.push('language');
			!schema && errors.push('schema');
			if (errors.length) return res.json(new Response({ error: ErrorGenerator.invalidParameters(errors) }));

			const response = await Schemas.set({ id, language, schema });
			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}
}
