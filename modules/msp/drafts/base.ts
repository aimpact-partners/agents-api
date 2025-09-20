import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { IUserBase as User } from '@aimpact/agents-api/data/interfaces';
import { IArticleDraftData } from '@aimpact/agents-api/data/interfaces';
import { drafts, users } from '@aimpact/agents-api/data/model';
import { db } from '@beyond-js/firestore-collection/db';
import type { Transaction } from 'firebase-admin/firestore';

type DeleteResponse = Promise<BusinessResponse<{ deleted: boolean }>>;

export class DraftsBase {
	static async get(id: string, user: User): Promise<BusinessResponse<IArticleDraftData>> {
		if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

		try {
			const response = await drafts.data({ id });
			if (response.error) return new BusinessResponse({ error: response.error });
			if (!response.data.exists) return new BusinessResponse({ error: response.data.error });

			return new BusinessResponse({ data: response.data.data as IArticleDraftData });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async delete(id: string, user: User): DeleteResponse {
		if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

		try {
			return await db.runTransaction(async (transaction: Transaction): DeleteResponse => {
				const response = await drafts.delete({ id, transaction });
				if (response.error) throw new BusinessResponse({ error: response.error });

				const parents = { Users: user.uid };
				const userDraftDelete = await users.drafts.delete({ id, parents, transaction });
				if (userDraftDelete.error) throw new BusinessResponse({ error: userDraftDelete.error });

				return new BusinessResponse({ data: response.data });
			});
		} catch (exc) {
			const code = `B0018`;
			if (exc instanceof BusinessResponse) return exc;
			return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}
}
