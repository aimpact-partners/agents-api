import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { IArticleDraftData, IUserBase as User } from '@aimpact/agents-api/data/interfaces';
import { users } from '@aimpact/agents-api/data/model';
import { DraftsBase } from './base';
import { publish } from './publish';
import { save } from './save';

export /*bundle*/ class Drafts extends DraftsBase {
	static async save(params: IArticleDraftData, user: User, clone: boolean = false) {
		return save(params, user, clone);
	}

	static async publish(id: string, user: User) {
		return publish(id, user);
	}

	static async byUser(user: User, type: 'draft' | 'article' = 'draft') {
		if (!user) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['user']) });

		try {
			const parents = { Users: user.uid, Drafts: 'Drafts' };
			const query = users.drafts.col({ parents }).where('type', '==', type);

			const drafts = await query.get();
			const items = drafts.docs.map(entry => entry.data());

			// support without timeUpdated property
			items.sort((a, b) => {
				if (a.timeUpdated && b.timeUpdated) return b.timeUpdated - a.timeUpdated;
				else if (a.timeUpdated) return -1;
				else if (b.timeUpdated) return 1;
				else return 0;
			});

			return new BusinessResponse({ data: { items } });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}
}
