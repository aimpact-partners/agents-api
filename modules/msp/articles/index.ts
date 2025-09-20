import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { IArticleDraftData, IArticleUserData, IUserBase as User } from '@aimpact/agents-api/data/interfaces';
import { articles, users } from '@aimpact/agents-api/data/model';
import { db } from '@beyond-js/firestore-collection/db';
import type { Transaction } from 'firebase-admin/firestore';
import { publish } from './publish';

type DeleteResponse = Promise<BusinessResponse<{ deleted: boolean }>>;
type ArchivedResponse = Promise<BusinessResponse<{ archived: boolean }>>;
type RestoreResponse = Promise<BusinessResponse<{ restored: boolean }>>;

export /*bundle*/ class Articles {
	static async publish(draft: IArticleDraftData, user: User) {
		return publish(draft, user);
	}

	static async get(id: string, user: User) {
		if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

		try {
			const { data, error } = await articles.data({ id });
			if (error) return new BusinessResponse({ error });
			if (!data.exists) return new BusinessResponse({ error: data.error });
			const article = data.data;

			if (article.creator.id !== user.uid) {
				return new BusinessResponse({ error: ErrorGenerator.userNotAuthorized() });
			}

			return new BusinessResponse({ data: article });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalServerError(exc) });
		}
	}

	static async kb(id: string, user: User) {
		if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

		try {
			const { data, error } = await articles.data({ id });
			if (error) return new BusinessResponse({ error });
			if (!data.exists) return new BusinessResponse({ error: data.error });
			const article = data.data;

			if (article.creator.id !== user.uid) {
				return new BusinessResponse({ error: ErrorGenerator.userNotAuthorized() });
			}

			const parents = { Articles: id };
			const response = await articles.kb.data({ parents, id: `${id}.kb` });
			if (response.error) return new BusinessResponse({ error: response.error });
			if (!response.data.exists) return new BusinessResponse({ error: response.data.error });

			return new BusinessResponse({ data: response.data.data });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalServerError(exc) });
		}
	}

	static async byUser(user: User, archived = false) {
		if (!user) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['user']) });

		try {
			const parents = { Users: user.uid, Articles: 'Articles' };
			const articles = await users.articles.col({ parents }).get();
			const items: IArticleUserData[] = [];
			articles.docs.forEach(entry => {
				const article = entry.data();
				if (archived === !!article.archived) items.push(article);
			});

			// support without timeCreated property
			items.sort((a, b) => {
				if (a.timeCreated && b.timeCreated) return b.timeCreated - a.timeCreated;
				else if (a.timeCreated) return -1;
				else if (b.timeCreated) return 1;
				else return 0;
			});

			return new BusinessResponse({ data: { items } });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalServerError(exc) });
		}
	}

	static async clone(params: { id: string; organizationId?: string }, user: User) {
		const { id, organizationId } = params;

		const { data, error } = await articles.data({ id });
		if (error) return new BusinessResponse({ error });
		if (!data.exists) return new BusinessResponse({ error: data.error });
		// const { communityModule } = data.data;

		// const response = await CommunityModules.clone({ id: communityModule.id, organizationId }, user);
		// if (response.error) return new BusinessResponse({ error: response.error });

		return new BusinessResponse({ data: data.data });
	}

	static async delete(id: string, user: User) {
		if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

		try {
			return await db.runTransaction(async (transaction: Transaction): DeleteResponse => {
				const { data, error } = await articles.data({ id, transaction });
				if (error) throw new BusinessResponse({ error });
				if (!data.exists) throw new BusinessResponse({ error: data.error });
				const article = data.data;

				// Validate users permissions
				if (article.creator.id !== user.uid) {
					throw new BusinessResponse({ error: ErrorGenerator.userNotAuthorizedForDelete('article') });
				}

				// Article have kbObject
				if (article.kbObjects?.length) {
					throw new BusinessResponse({ error: ErrorGenerator.invalidToDelete('Article', id, ['KBObject']) });
				}

				// const homeData = await homes.data({ id: user.uid, transaction });
				// if (homeData.error) throw new BusinessResponse({ error: homeData.error });

				const response = await articles.delete({ id, transaction });
				if (response.error) throw new BusinessResponse({ error: response.error });

				// Delete article on Users subcollection
				const parents = { Users: user.uid };
				const responseUsers = await users.articles.delete({ id, parents, transaction });
				if (responseUsers.error) throw new BusinessResponse({ error: responseUsers.error });

				// Check if the article is in the recent user home
				// let found = false;
				// const homeArticles: IUserHomeArticleBase[] = [];
				// homeData.data.data.articles?.forEach(m => {
				// 	if (m.id === id) {
				// 		found = true;
				// 		return;
				// 	}
				// 	homeArticles.push(m);
				// });
				// if (found) {
				// 	const response = await homes.merge({ id: user.uid, data: { articles: homeArticles }, transaction });
				// 	if (response.error) throw new BusinessResponse({ error: response.error });
				// }

				return new BusinessResponse({ data: response.data });
			});
		} catch (exc) {
			const code = `B0050`;
			if (exc instanceof BusinessResponse) return exc;
			return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}

	// static async archive(id: string, user: User) {
	// 	if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

	// 	try {
	// 		return await db.runTransaction(async (transaction: Transaction): ArchivedResponse => {
	// 			let response;

	// 			response = await modules.data({ id, transaction });
	// 			if (response.error) throw new BusinessResponse({ error: response.error });
	// 			if (!response.data.exists) throw new BusinessResponse({ error: response.data.error });
	// 			const article = response.data.data;

	// 			// Validate users permissions
	// 			if (module.creator.id !== user.uid) {
	// 				throw new BusinessResponse({ error: ErrorGenerator.userNotAuthorizedForDelete('module') });
	// 			}
	// 			if (module.archived) {
	// 				throw new BusinessResponse({ error: ErrorGenerator.itemAlreadyArchived('Module') });
	// 			}

	// 			response = await homes.data({ id: user.uid, transaction });
	// 			if (response.error) throw new BusinessResponse({ error: response.error });
	// 			const home = response.data.data;

	// 			const data = { archived: true };
	// 			response = await modules.merge({ id, data, transaction });
	// 			if (response.error) throw new BusinessResponse({ error: response.error });

	// 			const parents = { Users: user.uid };
	// 			response = await users.modules.merge({ id, data, parents, transaction });
	// 			if (response.error) throw new BusinessResponse({ error: response.error });

	// 			const homeModules = home.modules.filter(module => module.id !== id);
	// 			response = await homes.merge({ id: user.uid, data: { modules: homeModules }, transaction });
	// 			if (response.error) throw new BusinessResponse({ error: response.error });

	// 			return new BusinessResponse({ data });
	// 		});
	// 	} catch (exc) {
	// 		const code = `B0050`;
	// 		if (exc instanceof BusinessResponse) return exc;
	// 		return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
	// 	}
	// }

	// static async restore(id: string, user: User) {
	// 	if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

	// 	try {
	// 		return await db.runTransaction(async (transaction: Transaction): RestoreResponse => {
	// 			const responseModule = await modules.data({ id, transaction });
	// 			if (responseModule.error) throw new BusinessResponse({ error: responseModule.error });
	// 			if (!responseModule.data.exists) throw new BusinessResponse({ error: responseModule.data.error });
	// 			const module = responseModule.data.data;

	// 			// Validate users permissions
	// 			if (module.creator.id !== user.uid) {
	// 				throw new BusinessResponse({ error: ErrorGenerator.userNotAuthorizedForDelete('module') });
	// 			}

	// 			// Module not archived, nothing to do
	// 			if (!module.archived) {
	// 				throw new BusinessResponse({ error: ErrorGenerator.itemAlreadyRestored('Module') });
	// 			}

	// 			const data = { archived: false };
	// 			const response = await modules.merge({ id, data, transaction });
	// 			if (response.error) throw new BusinessResponse({ error: response.error });

	// 			const parents = { Users: user.uid };
	// 			const responseUsers = await users.modules.merge({ id, data, parents, transaction });
	// 			if (responseUsers.error) throw new BusinessResponse({ error: responseUsers.error });

	// 			return new BusinessResponse({ data: { restored: true } });
	// 		});
	// 	} catch (exc) {
	// 		const code = `B0050`;
	// 		if (exc instanceof BusinessResponse) return exc;
	// 		return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
	// 	}
	// }
}
