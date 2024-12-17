import type { IUserData } from '@aimpact/agents-api/data/interfaces';
import type { Request, Response as IResponse, Application } from 'express';
import type { IUser } from '@aimpact/agents-api/business/user';
import type { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import { User } from '@aimpact/agents-api/business/user';
import { Response } from '@beyond-js/response/main';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';

export class UsersRoutes {
	static setup(app: Application) {
		app.post('/auth/login', UsersRoutes.login);
		app.post('/auth/register', UsersRoutes.register);
		app.post('/integrations/tokens/verify', UsersRoutes.verify);
	}

	static async login(req: Request, res: IResponse) {
		const { id, firebaseToken } = req.body;
		const errors = [];
		!id && errors.push('id');
		!firebaseToken && errors.push('firebaseToken');
		if (errors.length) return res.json(new Response({ error: ErrorGenerator.invalidParameters(errors) }));

		try {
			const specs = <IUserData>{
				id: req.body.id,
				displayName: req.body.displayName,
				email: req.body.email,
				firebaseToken: req.body.firebaseToken,
				token: req.body.token,
				photoURL: req.body.photoURL,
				phoneNumber: req.body.phoneNumber
			};

			const user = new User(specs.id);
			const { data, error } = await user.login(specs);

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async register(req: Request, res: IResponse) {
		const { id, firebaseToken } = req.body;

		const errors = [];
		!id && errors.push('id');
		!firebaseToken && errors.push('firebaseToken');
		if (errors.length) return res.json(new Response({ error: ErrorGenerator.invalidParameters(errors) }));

		try {
			const specs = <IUserData>{
				id: req.body.id,
				displayName: req.body.name,
				email: req.body.email,
				firebaseToken: req.body.firebaseToken,
				token: req.body.token,
				photoURL: req.body.photoURL ?? '',
				phoneNumber: req.body.phoneNumber ?? null
			};

			const user = new User(specs.id);
			const { data, error } = await user.register(specs);

			res.json(new Response({ data, error }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}

	static async verify(req: Request, res: IResponse) {
		try {
			const token = req.headers.authorization.split(' ')[1];
			jwt.verify(token, process.env.SECRET_KEY, async (err, decoded: JwtPayload) => {
				if (err) return res.json(new Response({ error: ErrorGenerator.invalidToken() }));

				const user = new User(decoded.uid);
				const response = await user.load();
				if (response.error) return res.json(new Response({ error: response.error }));
				if (!user.valid) return res.json(new Response({ error: ErrorGenerator.userNotValid() }));

				const data: IUser = {
					uid: response.data.id,
					id: response.data.id,
					name: response.data.displayName,
					displayName: response.data.displayName,
					email: response.data.email,
					photoURL: response.data.photoURL,
					phoneNumber: response.data.phoneNumber
				};

				res.json(new Response({ data }));
			});
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError(exc) }));
		}
	}
}
