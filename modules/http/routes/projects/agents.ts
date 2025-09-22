import { Chat, Chats } from '@aimpact/agents-api/business/chats';
import { Projects } from '@aimpact/agents-api/business/projects';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler as userMiddleware } from '@aimpact/agents-api/http/middleware';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import { ErrorGenerator } from '@beyond-js/firestore-collection/errors';
import type { Application, Response as IResponse } from 'express';

export class ProjectAgentsRoutes {
	static setup(app: Application) {
		app.post('/projects/:projectId/agents/:agentId/chats', ProjectAgentsRoutes.createChat);
		app.get('/projects/:projectId/agents/:agentId/chats', userMiddleware.validate, this.chats);
	}

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
			res.json(new Response({ error: ErrorGenerator.internalError('H252', exc) }));
		}
	}

	static async createChat(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { ownerId, language, title } = req.body;
			const { projectId, agentId } = req.params;

			if (!projectId) return res.json(new Response({ error: ErrorGenerator.invalidParameters(['projectId']) }));
			if (!agentId) return res.json(new Response({ error: ErrorGenerator.invalidParameters(['agentId']) }));

			// TODO validate user´s permissions
			const projectResponse = await Projects.data(projectId, user);
			if (projectResponse.error) return res.json(new Response({ error: projectResponse.error }));
			const project = projectResponse.data.data;

			const { data, error } = await Chats.byAgent(user.uid, agentId);
			if (error) return res.json(new Response({ error }));

			const params = {
				projectId: project.id,
				name: title ?? `${user.name} chat with ${agentId}`,
				language: { default: language },
				metadata: { user: user.name, project: { id: project.id, name: project.name } },
				agent: agentId,
				user: {
					id: user.uid,
					uid: user.uid,
					name: user.name,
					email: user.email,
					photoUrl: user.photoUrl
				}
			};
			const chatResponse = await Chat.save(params);

			if (chatResponse.error) return res.json(new Response({ error: chatResponse.error }));

			res.json(new Response({ data: chatResponse.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H252', exc) }));
		}
	}
}
