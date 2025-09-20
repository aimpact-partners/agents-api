import { Codes } from '@aimpact/agents-api/business/codes';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
// import { Organizations } from '@aimpact/agents-api/business/organizations';
import { Projects } from '@aimpact/agents-api/business/projects';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type {
	ICodeData,
	IPeopleData,
	ISectionData,
	ISectionItemBase,
	ISectionUserData,
	IUserBase as User
} from '@aimpact/agents-api/data/interfaces';
import { RoleType } from '@aimpact/agents-api/data/interfaces';
import { codes, projects, organizations, sections, users } from '@aimpact/agents-api/data/model';
import { db } from '@beyond-js/firestore-collection/db';
import * as dotenv from 'dotenv';
import type { Transaction } from 'firebase-admin/firestore';
import { v4 as uuid } from 'uuid';

dotenv.config();
const { HOME_RECENT_ITEMS } = process.env;
const homeItems = parseInt(HOME_RECENT_ITEMS);

export interface ISectionParams {
	id?: string;
	name: string;
	description: string;
	organizationId?: string;
}

const update = async (section: ISectionData, params: ISectionParams) => {
	if (!params.name && !params.description) {
		const errors = [];
		!params.name && errors.push('name');
		!params.description && errors.push('description');
		return new BusinessResponse({ error: ErrorGenerator.invalidParameters(errors) });
	}

	return await db.runTransaction(async (transaction: Transaction) => {
		const data: { id: string; name?: string; description?: string } = { id: section.id };
		params.name && (data.name = params.name);
		params.description && (data.description = params.description);

		const responseSet = await sections.merge({ data, transaction });
		if (responseSet.error) throw new BusinessResponse({ error: responseSet.error });

		// Update user's sections subcollections
		const records = section.people.map(people => ({ id: people.uid ?? people.id }));
		const promises: Promise<any>[] = [];
		records.forEach(record => {
			const data = { name: params.name };
			const parents = { Users: record.id };
			promises.push(users.sections.merge({ id: section.id, data, parents, transaction }));
		});
		const promisesResponse = await Promise.all(promises);
		if (promisesResponse.some(response => response.error))
			throw new BusinessResponse({ error: promisesResponse.find(response => response.error) });

		if (section.owner.organization) {
			const parents = { Project: section.owner.organization.id };
			const response = await projects.sections.merge({ data, parents, transaction });
			if (response.error) throw new BusinessResponse({ error: response.error });
		}

		return new BusinessResponse({ data: section });
	});
};

export const publish = async (params: ISectionParams, user: User) => {
	const errors = [];
	!params.name && errors.push('name');
	if (errors.length) {
		return new BusinessResponse({ error: ErrorGenerator.invalidParameters(errors) });
	}

	if (params.id) {
		try {
			const response = await sections.data({ id: params.id });
			if (response.error) return new BusinessResponse({ error: response.error });

			// Update Section Document
			if (response.data.exists) return update(response.data.data, params);
		} catch (exc) {
			const code = `B0002`;
			if (exc instanceof BusinessResponse) return exc;
			return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}

	try {
		return await db.runTransaction(async (transaction: Transaction) => {
			let owner;
			let organization;
			if (params.organizationId) {
				const { organizationId } = params;
				const response = await Projects.get(organizationId, user);
				if (response.error) {
					throw new BusinessResponse({
						error: ErrorGenerator.documentNotFound('Projects', organizationId)
					});
				}
				organization = response.data;
				owner = {
					organization: {
						id: organization.id,
						name: organization.name,
						picture: organization.picture ?? ''
					}
				};
			} else owner = { teacher: { uid: user.uid, name: user.displayName, photoUrl: user.photoUrl } };

			const id = params.id ?? uuid();
			const { code, error } = await Codes.generateCode('section');
			if (error) throw new BusinessResponse({ error });

			// const homeResponse = await homes.data({ id: user.uid });
			// if (homeResponse.error) throw new BusinessResponse({ error: homeResponse.error });

			const data: ISectionData = {
				id,
				name: params.name,
				description: params.description ?? '',
				owner,
				joinSpecs: { code },
				people: [{ uid: user.uid, name: user.displayName, photoUrl: user.photoUrl, role: 'manager' }]
			};

			const response = await sections.set({ data, transaction });
			if (response.error) throw new BusinessResponse({ error: response.error });

			const codeData: ICodeData = {
				id: `section.${code}`,
				code,
				entity: { name: 'section', id: data.id }
			};
			const responseCode = await codes.set({ data: codeData, transaction });
			if (responseCode.error) throw new BusinessResponse({ error: responseCode.error });

			const parents = { Sections: id };
			const managerData: IPeopleData = {
				id: user.uid,
				uid: user.uid,
				email: user.email,
				name: user.displayName,
				photoUrl: user.photoUrl,
				role: <RoleType>'manager',
				authorized: true,
				notifications: true
			};
			const responsePeople = await sections.people.set({ data: managerData, parents, transaction });
			if (responsePeople.error) throw new BusinessResponse({ error: responsePeople.error });

			const now = Date.now();
			if (params.organizationId) {
				let organizationsError;
				({ organizationsError } = await (async () => {
					const parents = { Projects: params.organizationId };
					const data: ISectionItemBase = {
						id,
						name: params.name,
						code,
						timeCreated: now,
						timeUpdated: now
					};

					const response = await projects.sections.set({ data, parents, transaction });
					return { organizationsError: response.error ?? void 0 };
				})());
				if (organizationsError) throw new BusinessResponse({ error: organizationsError });
			}

			const sectionOwner = owner.organization
				? {
						id: organization.id,
						name: organization.name,
						photoUrl: organization.picture ?? ''
				  }
				: { id: user.id, name: user.name, photoUrl: user.photoUrl };

			const userSection: ISectionUserData = {
				id: data.id,
				code: data.joinSpecs.code,
				name: data.name,
				timeCreated: now,
				timeUpdated: now,
				owner: sectionOwner
			};
			data.picture && (userSection.picture = data.picture);

			const userSections = await users.sections.set({
				data: userSection,
				parents: { Users: user.uid },
				transaction
			});
			if (userSections.error) throw new BusinessResponse({ error: userSections.error });

			// let homeSections = homeResponse.data.data?.sections ?? [];
			// const homeSection: IUserHomeSectionBase = {
			// 	id: data.id,
			// 	code: data.joinSpecs.code,
			// 	name: data.name,
			// 	picture: data.picture ?? '',
			// 	role: <RoleType>'manager',
			// 	timeCreated: now,
			// 	timeUpdated: now,
			// 	owner: sectionOwner
			// };
			// homeSections = homeSections.filter(item => item.id !== homeSection.id);
			// homeSections.unshift(homeSection);

			// const action = homeResponse.data.exists ? 'merge' : 'set';
			// const homeData: IUserHomeData = {
			// 	id: user.uid,
			// 	user: { id: user.uid, uid: user.uid, name: user.name, photoUrl: user.photoUrl },
			// 	sections: homeSections.slice(0, homeItems)
			// };
			// const usersHome = await homes[action]({ data: homeData, transaction });
			// if (usersHome.error) throw new BusinessResponse({ error: usersHome.error });

			return new BusinessResponse({ data });
		});
	} catch (exc) {
		const code = `B0011`;
		if (exc instanceof BusinessResponse) return exc;
		return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
	}
};
