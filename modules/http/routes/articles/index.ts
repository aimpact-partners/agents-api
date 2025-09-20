import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { IAuthenticatedRequest as IAgentsAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler as userMiddleware } from '@aimpact/agents-api/http/middleware';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import { Articles, ArticlesKBObjects } from '@aimpact/agents-api/msp/business/articles';
import type { Application, Response as IResponse } from 'express';

export class ArticlesRoutes {
	static setup(app: Application) {
		app.get('/articles', userMiddleware.validate, this.list);
		app.get('/articles/archived', userMiddleware.validate, this.archived);

		app.get('/articles/:id', userMiddleware.validate, this.get);
		app.get('/articles/:id/kb', userMiddleware.validate, this.kb);
		app.get('/articles/:id/picture', this.picture);
		app.post('/articles/:id/assign', userMiddleware.validate, this.assign);
		app.post('/articles/:id/clone', userMiddleware.validate, this.clone);
		app.delete('/articles/:id', userMiddleware.validate, this.delete);

		// app.post(`/articles/image/resize`, userMiddleware.validate, this.modulesImageResize);
		// app.post(`/articles/activities/image/resize`, userMiddleware.validate, this.activitiesImageResize);
		// app.post('/articles/:id/archive', userMiddleware.validate, this.archive);
		// app.post('/articles/:id/restore', userMiddleware.validate, this.restore);
	}

	static async list(req: IAgentsAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const response = await Articles.byUser(user);

			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H180', exc) }));
		}
	}

	static async get(req: IAgentsAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const response = await Articles.get(id, user);

			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H181', exc) }));
		}
	}

	static async kb(req: IAgentsAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const response = await Articles.kb(id, user);

			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H181', exc) }));
		}
	}

	static async assign(req: IAgentsAuthenticatedRequest, res: IResponse) {
		const { sectionId } = req.body;
		if (!sectionId) return res.status(400).json({ status: false, error: 'sectionId is required.' });

		try {
			const { user } = req;
			const { id } = req.params;
			const response = await ArticlesKBObjects.assign(id, sectionId, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('HA001', exc) }));
		}
	}

	static async picture(req: IAgentsAuthenticatedRequest, res: IResponse) {
		const { id } = req.params;
		const size = <string>req.query.size;
		const SIZES = ['lg', 'md', 'sm', 'xs', 'original'];

		if ((size && !SIZES.includes(size)) || size === '') {
			return res.json(new Response({ error: ErrorGenerator.sizeNotValid() }));
		}

		const { data, error } = await ModulesImage.get(id, size);
		if (error) return res.json({ status: false, error });

		const { file, metadata } = data;
		res.set('Content-Type', metadata.contentType);

		file.createReadStream().pipe(res);
	}

	static async delete(req: IAgentsAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const response = await Articles.delete(id, user);

			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H180', exc) }));
		}
	}

	static async clone(req: IAgentsAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const { organizationId } = req.body;
			const response = await Articles.clone({ id, organizationId }, user);

			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H180', exc) }));
		}
	}

	static async archived(req: IAgentsAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const response = await Articles.byUser(user, true);
			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H200', exc) }));
		}
	}

	// static async archive(req: IAgentsAuthenticatedRequest, res: IResponse) {
	// 	try {
	// 		const { user } = req;
	// 		const { id } = req.params;
	// 		const response = await Articles.archive(id, user);
	// 		res.json(new Response(response));
	// 	} catch (exc) {
	// 		res.json(new Response({ error: ErrorGenerator.internalError('H201', exc) }));
	// 	}
	// }

	// static async restore(req: IAgentsAuthenticatedRequest, res: IResponse) {
	// 	try {
	// 		const { user } = req;
	// 		const { id } = req.params;
	// 		const response = await Articles.restore(id, user);
	// 		res.json(new Response(response));
	// 	} catch (exc) {
	// 		res.json(new Response({ error: ErrorGenerator.internalError('H202', exc) }));
	// 	}
	// }
}
