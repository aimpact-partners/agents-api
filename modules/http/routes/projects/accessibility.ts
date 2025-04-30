import { Projects } from '@aimpact/agents-api/business/projects';
import { projects } from '@aimpact/agents-api/data/model';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler as UserMiddleware, rateLimit, windows } from '@aimpact/agents-api/http/middleware';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import { ErrorGenerator } from '@beyond-js/firestore-collection/errors';
import type { Application, Response as IResponse } from 'express';

export class ProjectsAccessibilityRoutes {
	static setup(app: Application) {
		app.post('/projects/:id/approve', UserMiddleware.validate, this.approve);
		app.delete('/projects/:id/user/:uid', UserMiddleware.validate, this.remove);

		app.delete('/projects/:id/join/user/:uid', UserMiddleware.validate, this.reject);
		app.post(
			'/projects/join',
			UserMiddleware.validate,
			rateLimit(windows.perMinute, 3),
			rateLimit(windows.daily, 200),
			this.join
		);

		app.delete('/projects/:id/invite/user/:email', UserMiddleware.validate, this.revoke);
		app.post(
			'/projects/:id/invite',
			UserMiddleware.validate,
			rateLimit(windows.perMinute, 3),
			rateLimit(windows.daily, 200),
			this.invite
		);
	}

	static async join(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { code } = req.body;

			const errors = [];
			!code && errors.push('code');
			if (errors.length) {
				return res.json(new Response({ error: ErrorGenerator.invalidParameters(errors) }));
			}
			if (typeof code !== 'string') {
				return res.json(new Response({ error: ErrorGenerator.invalidParameter('code', 'string') }));
			}
			const name: 'project' = 'project';
			const collectionName: 'Projects' = 'Projects';
			const specs = { code, collection: projects, entity: { name, collectionName } };

			const response = await Projects.join(specs, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H194', exc) }));
		}
	}
	static async invite(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const { email, role } = req.body;

			const errors = [];
			!email && errors.push('email');
			!req.body.name && errors.push('name');
			!role && errors.push('role');
			if (errors.length) {
				return res.json(new Response({ error: ErrorGenerator.invalidParameters(errors) }));
			}
			if (role !== 'manager' && role !== 'member') {
				return res.json(new Response({ error: ErrorGenerator.roleNotValid() }));
			}

			const name: 'project' = 'project';
			const collectionName: 'Projects' = 'Projects';
			const specs = {
				id,
				email,
				name: req.body.name,
				role,
				collection: projects,
				entity: { name, collectionName }
			};
			const response = await Projects.invite(specs, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H195', exc) }));
		}
	}
	static async approve(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const { uid, role } = req.body;

			const errors = [];
			!id && errors.push('id');
			!uid && errors.push('uid');
			!role && errors.push('role');
			if (errors.length) {
				return res.json(new Response({ error: ErrorGenerator.invalidParameters(errors) }));
			}
			if (role !== 'manager' && role !== 'member') {
				return res.json(new Response({ error: ErrorGenerator.roleNotValid() }));
			}

			const name: 'project' = 'project';
			const collectionName: 'Projects' = 'Projects';
			const specs = {
				id,
				role,
				uid,
				collection: projects,
				entity: { name, collectionName }
			};
			const response = await Projects.approve(specs, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H196', exc) }));
		}
	}
	static async remove(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id, uid } = req.params;

			const errors = [];
			!id && errors.push('id');
			!uid && errors.push('uid');
			if (errors.length) return res.json(new Response({ error: ErrorGenerator.invalidParameters(errors) }));

			const name: 'project' = 'project';
			const collectionName: 'Projects' = 'Projects';
			const specs = { id, collection: projects, entity: { name, collectionName } };
			const { data, error } = await Projects.removeMember(specs, uid, user);

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H115', exc) }));
		}
	}
	static async revoke(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id, email } = req.params;

			const errors = [];
			!id && errors.push('id');
			!email && errors.push('email');
			if (errors.length) return res.json(new Response({ error: ErrorGenerator.invalidParameters(errors) }));

			const name: 'project' = 'project';
			const collectionName: 'Projects' = 'Projects';
			const specs = { id, collection: projects, entity: { name, collectionName } };
			const { data, error } = await Projects.revokeInvitation(specs, email, user);

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H115', exc) }));
		}
	}
	static async reject(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id, uid } = req.params;

			const errors = [];
			!id && errors.push('id');
			!uid && errors.push('uid');
			if (errors.length) return res.json(new Response({ error: ErrorGenerator.invalidParameters(errors) }));

			const name: 'project' = 'project';
			const collectionName: 'Projects' = 'Projects';
			const specs = { id, collection: projects, entity: { name, collectionName } };
			const { data, error } = await Projects.rejectRequest(specs, uid, user);

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H115', exc) }));
		}
	}
}
