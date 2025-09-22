import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { IAuthenticatedRequest as IAgentsAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler as userMiddleware } from '@aimpact/agents-api/http/middleware';
import { HTTPResponse as Response } from '@aimpact/agents-api/http/response';
import { Appointments } from '@aimpact/agents-api/msp/business/appointments';
import type { Application, Response as IResponse } from 'express';

export class AppointmentsRoutes {
	static setup(app: Application) {
		app.post('/appointments', userMiddleware.validate, this.create);
		app.get('/appointments', userMiddleware.validate, this.list);
		app.get('/appointments/:id', userMiddleware.validate, this.get);
	}

	static async list(req: IAgentsAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const response = await Appointments.byUser(user);

			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H180', exc) }));
		}
	}

	static async get(req: IAgentsAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const { id } = req.params;
			const response = await Appointments.get(id, user);

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
			const response = await Appointments.create(specs, user);

			res.json(new Response(response));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H181', exc) }));
		}
	}
}
