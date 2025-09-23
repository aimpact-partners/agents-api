import { Chat, Chats } from '@aimpact/agents-api/business/chats';
import { KB, Pinecone } from '@aimpact/agents-api/business/kb';
import { Projects } from '@aimpact/agents-api/business/projects';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler as middleware } from '@aimpact/agents-api/http/middleware';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import type { Application, Response as IResponse } from 'express';
import { v4 as uuid } from 'uuid';

export class KBRoutes {
	static setup(app: Application) {
		app.post('/kb/upsert', middleware.validate, KBRoutes.upsert);
		app.post('/kb/search', middleware.validate, KBRoutes.search);
		app.post('/kb/chat', middleware.validate, KBRoutes.chat);
	}

	static async upsert(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { text, projectId, language } = req.body;

			if (!text) return res.json(new Response({ error: ErrorGenerator.invalidParameters(['text']) }));
			if (!language) return res.json(new Response({ error: ErrorGenerator.invalidParameters(['language']) }));

			// Store on KB
			const specs = {
				namespace: '_default_',
				metadata: { projectId },
				id: uuid(),
				text: JSON.stringify(text),
				language
			};
			const resUpsert = await Pinecone.upsert(
				specs.namespace,
				specs.metadata,
				specs.id,
				specs.text,
				specs.language
			);
			if (resUpsert.error) throw new Response({ error: resUpsert.error });

			const data = { prompt: resUpsert.data.prompt, vectors: resUpsert.data.vectors };
			res.json(new Response({ data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H252', exc) }));
		}
	}

	static async search(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { text, projectId } = req.body;

			if (!text) return res.json(new Response({ error: ErrorGenerator.invalidParameters(['text']) }));
			if (!projectId) {
				return res.json(new Response({ error: ErrorGenerator.invalidParameters(['projectId']) }));
			}

			const response = await KB.search(text, { projectId }, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H252', exc) }));
		}
	}

	/**
	 * @deprecar
	 * migrar a /projects/:projectId/agents/:agentId/chats
	 *
	 */
	static async chat(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { ownerId, language, title } = req.body;
			const { type } = req.query;

			if (!ownerId) return res.json(new Response({ error: ErrorGenerator.invalidParameters(['ownerId']) }));

			const projectResponse = await Projects.data(ownerId, user);
			if (projectResponse.error) return res.json(new Response({ error: projectResponse.error }));
			const project = projectResponse.data.data;

			const agentName = type ?? `kb-appointment`;
			const { data, error } = await Chats.byAgent(user.uid, agentName);
			if (error) return res.json(new Response({ error }));

			// const found = data.items.find(item => item.metadata.project.id === ownerId);
			// if (found) return res.json(new Response({ data: found }));

			const params = {
				projectId: project.id,
				name: title ?? `${user.name} chat with ${agentName}`,
				language: { default: 'en' },
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
