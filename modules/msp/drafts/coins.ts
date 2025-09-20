// import type { IModuleDraftData, IArticleDraftData } from '@aimpact/ailearn-api/data/interfaces';
// import type { User } from '@aimpact/ailearn-api/http/middleware';
// import type { ErrorManager } from '@beyond-js/response/main';
// import { BusinessResponse } from '@aimpact/ailearn-api/business/response';
// import { ErrorGenerator } from '@aimpact/ailearn-api/business/errors';
// import { Coins } from '@aimpact/ailearn-api/business/coins';
// import { drafts } from '@aimpact/ailearn-api/data/model';

// type DraftCoinsumptionResponse = Promise<BusinessResponse<{ credits: { total: number; consumed: number } }>>;

// export /*bundle*/ class DraftCoins {
// 	static async consume(draftId: string, user: User): DraftCoinsumptionResponse {
// 		let error: ErrorManager;

// 		// Read the draft document
// 		let draft: IModuleDraftData | IArticleDraftData;
// 		({ draft, error } = await (async () => {
// 			const response = await drafts.data({ id: draftId });
// 			if (response.error) return { error: response.error };
// 			if (!response.data.exists) return { error: response.data.error };

// 			return { draft: response.data.data };
// 		})());
// 		if (error) return new BusinessResponse({ error });

// 		const { creator, owner } = draft;

// 		// Check if the user requesting to consume a credit is the creator of the draft
// 		if (creator.id !== user.uid) {
// 			return new BusinessResponse({ error: ErrorGenerator.teacherIsNotDraftCreator() });
// 		}

// 		// Check if the user is enlisted in the organization
// 		const is = draft.owner.id !== draft.creator.id ? 'organization' : 'teacher';
// 		if (is === 'organization' && !user.teacher?.orgs?.find(({ id }) => id === owner.id)) {
// 			return new BusinessResponse({ error: ErrorGenerator.teacherNotInOrganization() });
// 		}

// 		return await Coins.consume({
// 			user,
// 			payer: { is, id: is === 'organization' ? owner.id : creator.id },
// 			usage: 'module',
// 			allocation: { draftId }
// 		});
// 	}
// }
