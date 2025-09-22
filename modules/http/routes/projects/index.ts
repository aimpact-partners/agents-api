import { Chats } from '@aimpact/agents-api/business/chats';
import { Projects, ProjectsAgents } from '@aimpact/agents-api/business/projects';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler as userMiddleware } from '@aimpact/agents-api/http/middleware';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import { ErrorGenerator } from '@beyond-js/firestore-collection/errors';
import type { Application, Response as IResponse, Request } from 'express';
import { ProjectAgentsRoutes } from './agents';
export class ProjectsRoutes {
	static setup(app: Application) {
		ProjectAgentsRoutes.setup(app);

		app.get('/projects/', userMiddleware.validate, this.list);
		app.get('/projects/:id', userMiddleware.validate, this.get);
		app.post('/projects/', userMiddleware.validate, this.publish);
		app.put('/projects/:id', userMiddleware.validate, this.update);
		// app.delete('/projects/:id', userMiddleware.validate, this.delete);

		app.post('/projects/:id/agents', userMiddleware.validate, this.agent);
		app.get('/projects/:id/agents', userMiddleware.validate, this.all);
		app.get('/projects/agents/activities', userMiddleware.validate, this.agentsActivities);
	}

	static async list(req: Request, res: IResponse) {
		try {
			const response = await Projects.list();
			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async get(req: Request, res: IResponse) {
		try {
			const { id } = req.params;
			const response = await Projects.data(id);

			if (response.error) return res.json(new Response(response));
			if (!response.data.exists) return res.json(new Response({ error: response.data.error }));

			res.json(new Response({ data: response.data.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async publish(req: Request, res: IResponse) {
		try {
			const { id, name, description, agent } = req.body;
			const response = await Projects.save({ id, name, description, agent });

			if (response.error) return res.json(new Response(response));
			if (!response.data.exists) return res.json(new Response({ error: response.data.error }));

			res.json(new Response({ data: response.data.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async update(req: Request, res: IResponse) {
		try {
			const { id } = req.params;
			const { name, description, agent } = req.body;
			const response = await Projects.update({ id, name, description, agent });

			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async delete(req: Request, res: IResponse) {
		try {
			const { id } = req.params;

			const response = await Projects.delete(id);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async agent(req: Request, res: IResponse) {
		try {
			const { id } = req.params;
			const { name, literals, prompt, temperature, ipe } = req.body;
			const { data, error } = await ProjectsAgents.set(id, { name, literals, prompt, temperature, ipe });

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async all(req: Request, res: IResponse) {
		try {
			const { id } = req.params;
			const { data, error } = await ProjectsAgents.all(id);

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async agentsActivities(req: Request, res: IResponse) {
		try {
			const { data, error } = await ProjectsAgents.activityCGI();

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	// static async agentsActivities(req: Request, res: IResponse) {
	// 	try {
	// 		const { data, error } = await ProjectsAgents.activities();

	// 		res.json(new Response({ data, error }));
	// 	} catch (exc) {
	// 		res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
	// 	}
	// }

	static async chats(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { agent } = req.params;
			const { ownerId } = req.body;

			if (!ownerId) return res.json(new Response({ error: ErrorGenerator.invalidParameters(['ownerId']) }));

			// TODO validate user's permissions
			// const projectResponse = await Projects.data(ownerId, user);
			// if (projectResponse.error) return res.json(new Response({ error: projectResponse.error }));
			// const project = projectResponse.data.data;

			const { data, error } = await Chats.byAgent(user.uid, ownerId, agent);
			if (error) return res.json(new Response({ error }));

			res.json(new Response({ data: { items: data.items } }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}
}
