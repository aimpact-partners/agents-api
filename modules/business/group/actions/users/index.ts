import type { IProjectData } from '@aimpact/agents-api/data/interfaces';
import { users } from '@aimpact/agents-api/data/model';
import type { Transaction } from 'firebase-admin/firestore';

export class Users {
	static async projects(specs: { group: IProjectData; uid: string; transaction: Transaction }) {
		const { group, uid, transaction } = specs;
		const now = Date.now();
		const data = {
			id: group.id,
			name: group.name,
			timeCreated: now,
			timeUpdated: now
		};

		const { error } = await users.projects.set({ data, parents: { Users: uid }, transaction });
		return { error: error ?? void 0 };
	}
}
