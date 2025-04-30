import type { IUser } from '@aimpact/agents-api/business/user';
import { User } from '@aimpact/agents-api/business/user';
import type { IUserData } from '@aimpact/agents-api/data/interfaces';
import { ErrorGenerator } from '@aimpact/agents-api/http/errors';
import type { IAuthenticatedRequest } from '@aimpact/agents-api/http/middleware';
import { UserMiddlewareHandler } from '@aimpact/agents-api/http/middleware';
import { Response } from '@beyond-js/response/main';
import type { Application, Response as IResponse, Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';

export class UsersRoutes {
	static setup(app: Application) {
		app.post('/auth/login', UsersRoutes.login);
		app.post('/auth/register', UsersRoutes.register);
		app.post('/integrations/tokens/verify', UsersRoutes.verify);
		app.post('/users/me', UserMiddlewareHandler.validate, UsersRoutes.me);
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

	static async me(req: IAuthenticatedRequest, res: IResponse) {
		try {
			const { user } = req;
			const users = ['felix@beyondjs.com', 'julio@beyondjs.com', 'boxenrique@gmail.com'];

			if (!users.includes(user.email)) return res.json(new Response({ error: ErrorGenerator.userNotValid() }));

			res.json(new Response({ data: user }));
		} catch (exc) {
			res.json(new Response({ error: ErrorGenerator.internalError('H210', exc) }));
		}
	}
}
