import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler as userMiddleware } from '@aimpact/agents-api/http/middleware';
import { Sections } from '@aimpact/agents-api/msp/business/sections';
import { sections } from '@aimpact/agents-api/data/model';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import { rateLimit, windows } from '@aimpact/agents-api/http/middleware';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import type { Application, Response as IResponse } from 'express';

export class SectionsRoutes {
	static setup(app: Application) {
		app.post('/sections', userMiddleware.validate, this.publish);
		app.get('/sections', userMiddleware.validate, this.list);
		app.get('/sections/:id', userMiddleware.validate, this.get);
		app.delete('/sections/:id', userMiddleware.validate, this.delete);

		app.post('/sections/:id/request', userMiddleware.validate, this.request);
		// app.post('/sections/bulk', userMiddleware.validate, this.bulk);

		app.post('/sections/:id/approve', userMiddleware.validate, this.approve);
		app.delete('/sections/:id/user/:uid', userMiddleware.validate, this.remove);

		app.delete('/sections/:id/join/user/:uid', userMiddleware.validate, this.reject);
		app.post(
			'/sections/join',
			userMiddleware.validate,
			rateLimit(windows.perMinute, 3),
			rateLimit(windows.daily, 200),
			this.join
		);

		app.delete('/sections/:id/invite/user/:email', userMiddleware.validate, this.revoke);
		app.post(
			'/sections/:id/invite',
			userMiddleware.validate,
			rateLimit(windows.perMinute, 3),
			rateLimit(windows.daily, 200),
			this.invite
		);
	}

	static async get(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { id } = req.params;
			const { user } = req;
			const response = await Sections.get(id, user, true);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H110', exc) }));
		}
	}

	static async delete(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const response = await Sections.delete(id, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H111', exc) }));
		}
	}

	static async publish(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id, name, description, organizationId } = req.body;
			const response = await Sections.publish({ id, name, description, organizationId }, user);
			if (response.error) {
				return res.json(new Response({ error: response.error }));
			}

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H112', exc) }));
		}
	}

	static async list(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const ownerId = <string>req.query.ownerId;
			if (ownerId) {
				const { data, error } = await Sections.byOwner(user, ownerId);
				return res.json(new Response({ data, error }));
			}

			const response = await Sections.list(user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H114', exc) }));
		}
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

			const name: 'section' = 'section';
			const collectionName: 'Sections' = 'Sections';
			const specs = { code, collection: sections, entity: { name, collectionName } };
			const response = await Sections.join(specs, user);
			if (response.error) return res.json(new Response({ error: response.error }));

			res.json(new Response({ data: response.data }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H115', exc) }));
		}
	}

	static async invite(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const { email, name, role } = req.body;

			const errors = [];
			!email && errors.push('email');
			!name && errors.push('name');
			!role && errors.push('role');
			if (errors.length) {
				return res.json(new Response({ error: ErrorGenerator.invalidParameters(errors) }));
			}
			if (role !== 'manager' && role !== 'member') {
				return res.json(new Response({ error: ErrorGenerator.roleNotValid() }));
			}

			const entityName: 'section' = 'section';
			const collectionName: 'Sections' = 'Sections';
			const specs = {
				id,
				email,
				name,
				role,
				collection: sections,
				entity: { name: entityName, collectionName }
			};
			const { data, error } = await Sections.invite(specs, user);

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H116', exc) }));
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

			const name: 'section' = 'section';
			const collectionName: 'Sections' = 'Sections';
			const specs = {
				id,
				role,
				uid,
				collection: sections,
				entity: { name, collectionName }
			};
			const { data, error } = await Sections.approve(specs, user);

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H117', exc) }));
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

			const name: 'section' = 'section';
			const collectionName: 'Sections' = 'Sections';
			const specs = { id, collection: sections, entity: { name, collectionName } };
			const { data, error } = await Sections.removeMember(specs, uid, user);

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

			const name: 'section' = 'section';
			const collectionName: 'Sections' = 'Sections';
			const specs = { id, collection: sections, entity: { name, collectionName } };
			const { data, error } = await Sections.revokeInvitation(specs, email, user);

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

			const name: 'section' = 'section';
			const collectionName: 'Sections' = 'Sections';
			const specs = { id, collection: sections, entity: { name, collectionName } };
			const { data, error } = await Sections.rejectRequest(specs, uid, user);

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H115', exc) }));
		}
	}

	static async request(req: IAuthenticatedRequest, res: IResponse) {
		const { user } = req;
		const { id } = req.params;

		try {
			const { data, error } = await Sections.request(id, user);
			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('HA011', exc) }));
		}
	}
}
