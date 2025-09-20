import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { IUserBase as User } from '@aimpact/agents-api/data/interfaces';
import { DraftTypes, type IArticleDraftData, type IArticleDraftUserData } from '@aimpact/agents-api/data/interfaces';
import { drafts, projects, users } from '@aimpact/agents-api/data/model';
import { db } from '@beyond-js/firestore-collection/db';
import type { Transaction } from 'firebase-admin/firestore';
import { v4 as uuid } from 'uuid';
import { DraftsBase } from './base';

type DraftsResponse = Promise<BusinessResponse<IArticleDraftData>>;
const draftBaseInterface = [
	'id',
	'language',
	'title',
	'description',
	'objective',
	'specs',
	'picture',
	'pictureSuggestions',
	'audience',
	'activities',
	'type',
	'state',
	'content',
	'slug',
	'categories',
	'tags'
];

const draftsSupported = ['draft', 'article', 'module'];

export const save = async (params: IArticleDraftData, user: User, clone: boolean = false) => {
	try {
		if (!draftsSupported.includes(params.type)) {
			throw new BusinessResponse({ error: ErrorGenerator.typeNotValid(params.type, 'Drafts') });
		}

		let exists = false;
		if (params.id) {
			const draftData = await drafts.data({ id: params.id });
			if (draftData.error) throw new BusinessResponse({ error: draftData.error });
			exists = draftData.data.exists;
			if (exists && user.uid !== draftData.data.data.creator.id) {
				throw new BusinessResponse({ error: ErrorGenerator.userNotAuthorized() });
			}
		}

		const userData = { id: user.uid, name: user.displayName, photoUrl: user.photoUrl };
		params = { ...params, creator: userData };

		const response = await db.runTransaction(async (transaction: Transaction): DraftsResponse => {
			const data = ((parameters: Record<string, any>, objectInterface) => {
				const common: Record<string, any> = {};
				for (const key in parameters) {
					if (objectInterface.includes(key)) parameters[key] && (common[key] = parameters[key]);
				}

				if (parameters.type === DraftTypes.Article) return common as IArticleDraftData;
			})(params, draftBaseInterface);

			data.creator = userData;
			data.timeUpdated = Date.now();
			if (!exists) {
				data.id = uuid();
				data.timeCreated = Date.now();

				// set Administrator
				if (params.owner && params.owner.id !== params.creator.id) {
					const response = await projects.data({ id: params.owner.id, transaction });
					if (response.error) throw new BusinessResponse({ error: response.error });
					if (!response.data.exists) throw new BusinessResponse({ error: response.data.error });
					const project = response.data.data;
					data.owner = { id: project.id, name: project.name, photoUrl: project.picture ?? '' };
				} else data.owner = userData;
			}

			let error;
			// Save draft to user home collection & save draft to user subcollection
			({ error } = await (async draft => {
				const parents = { Users: user.uid };
				const usersDrafts = await users.drafts.data({ id: draft.id, parents, transaction });
				if (usersDrafts.error) return { error: usersDrafts.error };

				const now = Date.now();
				const { exists } = usersDrafts.data;

				const data: IArticleDraftUserData = {
					id: draft.id,
					type: DraftTypes.Article,
					owner: draft.owner ?? draft.creator,
					language: draft.language,
					timeCreated: now,
					timeUpdated: now
				};
				if (draft.title) data.title = draft.title;
				if (draft.description) data.description = draft.description;
				if (draft.picture) data.picture = draft.picture;
				const { error } = await users.drafts[exists ? 'merge' : 'set']({ data, parents, transaction });
				return { error: error ?? void 0 };
			})(data));
			if (error) throw new BusinessResponse({ error });

			// Save draft to collection
			const response = await drafts[exists ? 'merge' : 'set']({ data, transaction });
			if (response.error) throw new BusinessResponse({ error: response.error });

			return new BusinessResponse({ data });
		});

		if (response.error) return response.error;
		return await DraftsBase.get(response.data.id, user);
	} catch (exc) {
		const code = `B0115`;
		if (exc instanceof BusinessResponse) return exc;
		return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
	}
};
