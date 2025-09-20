import { Chat, Chats } from '@aimpact/agents-api/business/chats';
import { KB } from '@aimpact/agents-api/business/kb';
import { Projects } from '@aimpact/agents-api/business/projects';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler as middleware } from '@aimpact/agents-api/http/middleware';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import type { Application, Response as IResponse } from 'express';

export class KBRoutes {
	static setup(app: Application) {
		app.post('/kb/search', middleware.validate, KBRoutes.search);
		app.post('/kb/chat', middleware.validate, KBRoutes.chat);
	}

	static async search(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { text, organizationId } = req.body;

			if (!text) return res.json(new Response({ error: ErrorGenerator.invalidParameters(['text']) }));
			if (!organizationId) {
				return res.json(new Response({ error: ErrorGenerator.invalidParameters(['organizationId']) }));
			}

			const response = await KB.search(text, { organizationId }, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H252', exc) }));
		}
	}

	static async chat(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { ownerId, language, title } = req.body;
			const { type } = req.query;

			if (!ownerId) {
				return res.json(new Response({ error: ErrorGenerator.invalidParameters(['ownerId']) }));
			}

			const projectResponse = await Projects.data(ownerId, user);
			if (projectResponse.error) return res.json(new Response({ error: projectResponse.error }));
			const project = projectResponse.data.data;

			const agentName = type ?? `kb-cgi`;
			const { data, error } = await Chats.byAgent(user.uid, agentName);
			if (error) return res.json(new Response({ error }));

			const found = data.items.find(item => item.metadata.project.id === ownerId);
			if (found) return res.json(new Response({ data: found }));

			const params = {
				projectId: project.id,
				name: title ?? `${user.name} chat with ${agentName}`,
				language: { default: language },
				metadata: { user: user.name, project: { id: project.id, name: project.name } },
				agent: agentName,
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
