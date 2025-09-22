import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { IUserBase as User } from '@aimpact/agents-api/data/interfaces';
import { appointments } from '@aimpact/agents-api/data/model';
import { v4 as uuid } from 'uuid';

export /*bundle*/ class Appointments {
	static async create(params, user: User) {
		const data = {
			id: uuid(),
			...params,
			user: { id: user.id, name: user.name, photoUrl: user.photoUrl }
		};

		const response = await appointments.set({ id: params.id, data });
		if (response.error) return new BusinessResponse({ error: response.error });

		return new BusinessResponse({ data: { ...response.data, id: data.id } });
	}

	static async get(id: string, user: User) {
		const response = await appointments.data({ id });
		if (response.error) return new BusinessResponse({ error: response.error });

		return new BusinessResponse({ data: response.data.data });
	}

	static async byUser(user: User) {
		// const response = await appointments.data({ id });
		// if (response.error) return new BusinessResponse({ error: response.error });
		// return new BusinessResponse({ data: response.data.data });
	}
}
