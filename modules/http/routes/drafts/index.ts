import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler as userMiddleware } from '@aimpact/agents-api/http/middleware';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import { Drafts } from '@aimpact/agents-api/msp/business/drafts';
import type { Application, Response as IResponse } from 'express';

export class DraftsRoutes {
	static setup(app: Application) {
		app.get('/drafts/type/:type', userMiddleware.validate, this.list);
		app.post('/drafts', userMiddleware.validate, this.save);
		app.get('/drafts/:id', userMiddleware.validate, this.get);
		app.post('/drafts/:id/publish', userMiddleware.validate, this.publish);
		app.delete('/drafts/:id', userMiddleware.validate, this.delete);
	}

	static async list(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { type } = req.params;
			if (!type || (type !== 'draft' && type !== 'article')) {
				return res.json(new Response({ error: ErrorGenerator.typeNotValid(type) }));
			}

			const response = await Drafts.byUser(user, type);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H161', exc) }));
		}
	}

	static async save(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const specs = {
				id: req.body.id,
				creator: { id: user.uid, name: user.displayName },
				owner: req.body.owner,
				objective: req.body.objective,
				title: req.body.title,
				description: req.body.description,
				specs: req.body.specs,
				language: req.body.language,
				picture: req.body.picture,
				pictureSuggestions: req.body.pictureSuggestions,
				audience: req.body.audience,
				duration: req.body.duration,
				totalActivities: req.body.totalActivities,
				activities: req.body.activities,
				type: req.body.type,
				state: req.body.state
			};

			const response = await Drafts.save(req.body, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H162', exc) }));
		}
	}

	static async get(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const response = await Drafts.get(id, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H160', exc) }));
		}
	}

	static async publish(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;

			const response = await Drafts.publish(id, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H169', exc) }));
		}
	}

	static async delete(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const response = await Drafts.delete(id, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H165', exc) }));
		}
	}
}
