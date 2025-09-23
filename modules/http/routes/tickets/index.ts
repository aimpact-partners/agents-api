import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { IAuthenticatedRequest as IAgentsAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler as userMiddleware } from '@aimpact/agents-api/http/middleware';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import { Tickets } from '@aimpact/agents-api/msp/business/tickets';
import type { Application, Response as IResponse } from 'express';

export class TicketsRoutes {
	static setup(app: Application) {
		app.post('/tickets', userMiddleware.validate, this.create);
		app.get('/tickets', userMiddleware.validate, this.list);
		app.get('/tickets/:id', userMiddleware.validate, this.get);
	}

	static async list(req: IAgentsAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const flag = req.query.user;
			const response = flag ? await Tickets.all(user) : await Tickets.byUser(user);

			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H180', exc) }));
		}
	}

	static async get(req: IAgentsAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const response = await Tickets.get(id, user);

			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H181', exc) }));
		}
	}

	static async create(req: IAgentsAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { title, description, participants, startTime, endTime, idempotencyKey } = req.body;
			const specs = { title, description, participants, startTime, endTime, idempotencyKey };
			const response = await Tickets.create(specs, user);

			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H181', exc) }));
		}
	}
}
