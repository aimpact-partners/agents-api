import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { IUserBase as User } from '@aimpact/agents-api/data/interfaces';
import { appointments } from '@aimpact/agents-api/data/model';
import { v4 as uuid } from 'uuid';

export /*bundle*/ class Appointments {
	static async create(params, user: User) {
		try {
			const data = {
				id: uuid(),
				...params,
				user: { id: user.id, name: user.name, photoUrl: user.photoUrl }
			};

			const response = await appointments.set({ id: params.id, data });
			if (response.error) return new BusinessResponse({ error: response.error });

			return new BusinessResponse({ data: { ...response.data, id: data.id } });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async get(id: string, user: User) {
		try {
			const response = await appointments.data({ id });
			if (response.error) return new BusinessResponse({ error: response.error });

			return new BusinessResponse({ data: response.data.data });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async byUser(user: User) {
		try {
			if (!user) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['user']) });

			const docs = await appointments.col().where('user.id', '==', user.id).get();
			const items = [];
			docs.forEach(item => items.push(item.data()));

			return new BusinessResponse({ data: { items } });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}
}
