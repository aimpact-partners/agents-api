import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { Pinecone } from '@aimpact/agents-api/business/kb';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { IArticleData, IArticleDraftData, IUserBase as User } from '@aimpact/agents-api/data/interfaces';
import { articles, drafts, users } from '@aimpact/agents-api/data/model';
import { db } from '@beyond-js/firestore-collection/db';
import * as dotenv from 'dotenv';
import type { Transaction } from 'firebase-admin/firestore';
import { prepare } from './prepare';

dotenv.config();
const { HOME_RECENT_ITEMS } = process.env;
const homeItems = parseInt(HOME_RECENT_ITEMS);

type ModulesResponse = Promise<BusinessResponse<IArticleData>>;

export const publish = async (draft: IArticleDraftData, user: User): ModulesResponse => {
	if (!draft) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['draft']) });

	const draftId = draft.id;
	try {
		return await db.runTransaction(async (transaction: Transaction): ModulesResponse => {
			if (user.uid !== draft.creator.id) {
				throw new BusinessResponse({ error: ErrorGenerator.userNotAuthorized() });
			}

			const { errors, item } = prepare(<IArticleDraftData>draft);
			if (errors) throw new BusinessResponse({ error: errors });

			const data: IArticleData = { ...item };

			// Set module on userHome
			const now = Date.now();
			const articleItem = {
				id: item.id,
				owner: item.owner ?? item.creator,
				type: <'article'>item.type,
				title: item.title,
				description: item.description,
				picture: item.picture ?? '',
				language: item.language,
				ai: item.ai ?? false,
				timeCreated: item.timeCreated ?? now,
				timeUpdated: now
			};

			let error;
			//  haveHome, homeDrafts, homeArticles;
			// // Get homeDrafts
			// ({ haveHome, homeDrafts, homeArticles, error } = await (async draftItem => {
			// const doc = await homes.data({ id: user.uid, transaction });
			// if (doc.error) return { error: doc.error };
			// const home = doc.data.data ?? <IUserHomeData>{ id: user.uid };
			// const articles = doc.data.exists ? home?.articles ?? [] : [];

			// Set module on userHome
			// const exists = articles.findIndex(item => item.id === draftItem.id);
			// exists !== -1 ? (articles[exists] = articleItem) : articles.unshift(articleItem);

			// Check if draft is in userHome collection
			// const drafts: IUserHomeDraftBase[] = [];
			// home.drafts.forEach(draft => {
			// 	if (draft.id === draftId) return;
			// 	drafts.unshift(draft);
			// });

			// return { haveHome: doc.data.exists, homeDrafts: drafts, homeArticles: articles };
			// })(item));
			// if (error) throw new BusinessResponse({ error });

			// Publish article
			const response = await articles.set({ data: item, transaction });
			if (response.error) throw new BusinessResponse({ error: response.error });

			// Update Users subcollection
			({ error } = await (async () => {
				// Set module user.articles subcollection
				const parents = { Users: user.uid };
				const response = await users.articles.set({ data: articleItem, parents, transaction });
				if (response.error) return { error: response.error };

				// Delete draft user.drafts subcollection
				const userDraftDelete = await users.drafts.delete({ id: draftId, parents, transaction });
				return { error: userDraftDelete.error ?? void 0 };
			})());
			if (error) throw new BusinessResponse({ error });

			// Update UsersHomes collection
			// ({ error } = await (async () => {
			// 	const action = haveHome ? 'merge' : 'set';
			// 	const homeData: IUserHomeData = {
			// 		id: user.uid,
			// 		user: { id: user.uid, name: user.name, photoUrl: user.photoUrl },
			// 		drafts: homeDrafts.slice(0, homeItems),
			// 		articles: homeArticles.slice(0, homeItems)
			// 	};
			// 	const response = await homes[action]({ data: homeData, transaction });
			// 	return { error: response.error ?? void 0 };
			// })());
			// if (error) throw new BusinessResponse({ error });

			// Delete draft
			({ error } = await (async moduleData => {
				const draftDelete = await drafts.delete({ id: draftId, transaction });
				return { error: draftDelete.error ?? void 0 };
			})(data));
			if (error) throw new BusinessResponse({ error });

			// Store on KB
			const specs = {
				namespace: '_default_',
				metadata: {
					organizationId: articleItem.owner.id, // the owner can be the user or a organization
					articleId: articleItem.id,
					creator: item.creator.name,
					owner: articleItem.owner.name,
					title: item.title,
					publicationDate: item.publicationDate,
					tags: JSON.stringify(item.tags) ?? undefined
				},
				id: item.id,
				text: item.content,
				language: item.language
			};
			const resUpsert = await Pinecone.upsert(
				specs.namespace,
				specs.metadata,
				specs.id,
				specs.text,
				specs.language,
				'prompt'
			);
			if (resUpsert.error) throw new BusinessResponse({ error });
			resUpsert.data.vectors.forEach(v => (v.tags = v.tags ?? []));

			const kbData = { id: `${item.id}.kb`, prompt: resUpsert.data.prompt, vectors: resUpsert.data.vectors };
			const parents = { Articles: item.id };
			const rKB = await articles.kb.set({ parents, data: kbData });
			if (rKB.error) throw new BusinessResponse({ error: rKB.error });

			return new BusinessResponse({ data });
		});
	} catch (exc) {
		const code = `B0001`;
		if (exc instanceof BusinessResponse) return exc;
		return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
	}
};
