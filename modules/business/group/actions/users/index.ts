import type { User } from '@aimpact/agents-api/business/user';
import type { IProjectData } from '@aimpact/agents-api/data/interfaces';
import { users } from '@aimpact/agents-api/data/model';
import type { Transaction } from 'firebase-admin/firestore';

export class Users {
	static async projects(specs: { group: IProjectData; user: User; transaction: Transaction }) {
		const { group, user, transaction } = specs;
		const now = Date.now();
		const data = {
			id: group.id,
			name: group.name,
			email: user.email,
			timeCreated: now,
			timeUpdated: now
		};

		const { error } = await users.projects.set({ data, parents: { Users: user.uid }, transaction });
		return { error: error ?? void 0 };
	}
}
