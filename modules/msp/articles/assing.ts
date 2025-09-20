import type { IUserBase as User } from '@aimpact/agents-api/data/interfaces';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { Sections } from '@aimpact/agents-api/msp/business/sections';
import type {
	IArticleData,
	IKBObjectArticleData,
	IKBObjectData,
	IKBObjectUserData
} from '@aimpact/agents-api/data/interfaces';
import { articles, kbOjects, sections, users } from '@aimpact/agents-api/data/model';
import { db } from '@beyond-js/firestore-collection/db';
import type { Transaction } from 'firebase-admin/firestore';
import { v4 as uuid } from 'uuid';

export /*bundle*/ class ArticlesKBObjects {
	static async assign(articleId: string, sectionId: string, user: User) {
		const errors = [];
		!articleId && errors.push('articleId');
		!sectionId && errors.push('sectionId');
		if (errors.length) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(errors) });

		try {
			return await db.runTransaction(async (transaction: Transaction) => {
				// Check if the article exists and if the user has permissions over it
				const articleResponse = await articles.data({ id: articleId, transaction });
				if (articleResponse.error) throw new BusinessResponse({ error: articleResponse.error });
				if (!articleResponse.data.exists) throw new BusinessResponse({ error: articleResponse.data.error });

				// Check if the article was already assigned to the current section
				const article: IArticleData = articleResponse.data.data;
				if (article.kbObjects?.find(({ section }) => section.id === sectionId)) {
					return new BusinessResponse({
						error: ErrorGenerator.articleAlreadyAssignedToSection(articleId, sectionId)
					});
				}
				const room = await Sections.get(sectionId, user);
				if (room.error) throw new BusinessResponse({ error: room.error });
				const section = room.data;

				// const homeResponse = await homes.data({ id: user.uid, transaction });
				// if (homeResponse.error) throw new BusinessResponse({ error: homeResponse.error });
				// const homeData = homeResponse.data;
				// const action = homeData.exists ? 'merge' : 'set';

				// Store the kbobject
				const articleData: IKBObjectArticleData = {
					id: article.id,
					creator: article.creator,
					owner: article.owner ?? article.creator,
					language: article.language,
					title: article.title,
					description: article.description,
					picture: article.picture,
					timeCreated: article.timeCreated,
					timeUpdated: article.timeUpdated,
					publicationDate: article.publicationDate
				};
				const sectionData = { id: section.id, name: section.name, picture: section.picture ?? '' };

				const data: IKBObjectData = {
					id: uuid(),
					section: sectionData,
					article: articleData
				};
				const kbResponse = await kbOjects.set({ data, transaction });
				if (kbResponse.error) {
					throw new BusinessResponse({ error: ErrorGenerator.documentNotSaved(kbResponse.error) });
				}

				const sectionKBObjects = section?.kbObjects ?? [];
				sectionKBObjects.unshift({ id: data.id, article: articleData });

				// Store the kbObject in the Sections collection
				const sectionResponse = await sections.merge({
					id: section.id,
					transaction,
					data: { kbObjects: sectionKBObjects }
				});
				if (sectionResponse.error) {
					throw new BusinessResponse({ error: ErrorGenerator.documentNotSaved(sectionResponse.error) });
				}

				const parents = { Sections: section.id };
				const sectionKBObjectResponse = await sections.kbObjects.set({
					parents,
					data: { id: data.id, article: articleData },
					transaction
				});
				if (sectionKBObjectResponse.error) {
					throw new BusinessResponse({
						error: ErrorGenerator.documentNotSaved(sectionKBObjectResponse.error)
					});
				}

				// Set the assignment on the article
				const articleKBObjects = article.kbObjects ? article.kbObjects : [];
				articleKBObjects.push({ id: data.id, section: sectionData });
				const moduleResponseMerge = await articles.merge({
					id: articleId,
					data: { kbObjects: articleKBObjects },
					transaction
				});
				if (moduleResponseMerge.error) {
					throw new BusinessResponse({ error: ErrorGenerator.documentNotSaved(moduleResponseMerge.error) });
				}

				// Update users.kbObjects, users.modules and users homes subcollection
				let error;
				({ error } = await (async () => {
					const parents = { Users: user.uid, Articles: articleId };
					const response = await users.articles.merge({
						id: articleId,
						data: { kbObjects: articleKBObjects },
						parents,
						transaction
					});
					if (response.error) return { error: response.error };

					const kbObject = { id: data.id, section: sectionData, article: articleData };
					// homeData.data.articles?.forEach(m => {
					// 	if (m.id !== article.id) return;
					// 	m.kbObjects = m.kbObjects ?? [];
					// 	m.kbObjects.unshift({ id: data.id, section: sectionData });
					// });

					const userKBObject: IKBObjectUserData = {
						id: kbObject.id,
						section: kbObject.section,
						article: articleData
					};
					const userAssginmentResponse = await users.kbOjects.set({
						data: userKBObject,
						parents,
						transaction
					});
					return { error: userAssginmentResponse.error ?? void 0 };

					// const userHomeData: IUserHomeData = {
					// 	id: user.uid,
					// 	user: { id: user.uid, uid: user.uid, name: user.name, photoUrl: user.photoUrl },
					// 	articles: homeData.data.articles ?? []
					// };
					// const homeResponse = await homes[action]({ data: userHomeData, transaction });

					// return { error: homeResponse.error ?? void 0 };
				})());
				if (error) throw new BusinessResponse({ error });

				return new BusinessResponse({ data });
			});
		} catch (exc) {
			const code = `B0016`;
			if (exc instanceof BusinessResponse) return exc;
			return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}
}
