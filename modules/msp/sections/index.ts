import { ErrorCodes, ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { Group } from '@aimpact/agents-api/business/group';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { ISectionData, IUserBase as User } from '@aimpact/agents-api/data/interfaces';
import { UsersGroupAccess } from '@aimpact/agents-api/data/interfaces';
import { codes, organizations, sections, users } from '@aimpact/agents-api/data/model';
import { db } from '@beyond-js/firestore-collection/db';
import type { Transaction } from 'firebase-admin/firestore';
import type { ISectionParams } from './publish';
import { publish } from './publish';

export /*bundle*/ class Sections extends Group {
	static async publish(params: ISectionParams, user: User) {
		return publish(params, user);
	}

	static async get(id: string, user: User, endpoint = false): Promise<BusinessResponse<ISectionData>> {
		try {
			let section;
			const { data, error } = await sections.data({ id });
			if (error) return new BusinessResponse({ error: error });
			if (!data.exists) {
				id = id.toUpperCase();
				const entries = await sections.col().where('joinSpecs.code', '==', id).get();
				const items = entries.docs.map(doc => doc.data());
				if (!items.length) return new BusinessResponse({ error: data.error });

				section = items.pop();
			} else section = data.data;

			const name: 'section' = 'section';
			const collectionName: 'Sections' = 'Sections';
			const specs = { collection: sections, entity: { name, collectionName } };
			const sectionPeople = await this.getPeople(specs, section, user);

			if (endpoint && sectionPeople.error) {
				// Validate user permissions for request access
				const access = await (async () => {
					const { userPendingRequestOnGroup, userInvitePendingOnGroup } = ErrorCodes;
					if (sectionPeople.error?.code === userPendingRequestOnGroup) return UsersGroupAccess.Pending;
					if (sectionPeople.error?.code === userInvitePendingOnGroup) return UsersGroupAccess.Invited;
					if (sectionPeople.error) return UsersGroupAccess.NotMember;
					return UsersGroupAccess.Approved;
				})();
				delete section.people;
				delete section.owner;
				delete section.joinSpecs;
				delete section.kbObjects;
				return new BusinessResponse({ data: { ...section, access, picture: section.picture ?? '' } });
			}

			if (sectionPeople.error) return new BusinessResponse({ error: sectionPeople.error });

			return new BusinessResponse({ data: Object.assign({}, section, { people: sectionPeople.data }) });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async list(user: User) {
		try {
			const parents = { Users: user.uid };
			const sections = await users.sections.col({ parents }).get();
			const items = sections.docs.map(entry => entry.data());

			return new BusinessResponse({ data: { items } });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async request(id: string, user: User) {
		if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters([id]) });

		try {
			const roomResponse = await sections.data({ id });
			if (roomResponse.error) return new BusinessResponse({ error: roomResponse.error });
			if (!roomResponse.data.exists) return new BusinessResponse({ error: roomResponse.data.error });
			const room = roomResponse.data.data;

			const name: 'section' = 'section';
			const collectionName: 'Sections' = 'Sections';
			const specs = { code: room.joinSpecs.code, collection: sections, entity: { name, collectionName } };
			const response = await Sections.join(specs, user);
			if (response.error) return new BusinessResponse({ error: response.error });

			return new BusinessResponse({ data: response.data });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async delete(id: string, user: User) {
		if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

		try {
			// Section.get validate users permissions
			const response = await Sections.get(id, user);
			if (response.error) return new BusinessResponse({ error: response.error });
			const section = response.data;

			// Valite manager role
			const found = section.people.find(people => people.uid === user.uid || people.id === user.uid);
			if (!found || found.role !== 'manager') {
				return new BusinessResponse({ error: ErrorGenerator.insufficientPermissions() });
			}

			// Section have assignments
			if (section.kbObjects?.length) {
				return new BusinessResponse({
					error: ErrorGenerator.invalidToDelete('Section', id, ['Assignments'])
				});
			}

			return await db.runTransaction(async (transaction: Transaction) => {
				// const homeResponse = await homes.data({ id: user.uid, transaction });
				// if (homeResponse.error) throw new BusinessResponse({ error: homeResponse.error });
				// const homeClassroomsData = homeResponse.data.data?.sections ?? [];

				const deleted = await sections.delete({ id, transaction });
				if (deleted.error) throw new BusinessResponse({ error: deleted.error });

				const codeId = `section.${section.joinSpecs.code}`;
				const codeDeleted = await codes.delete({ id: codeId, transaction });
				if (codeDeleted.error) throw new BusinessResponse({ error: codeDeleted.error });

				// Section's people
				const classroomRef = sections.doc({ id });
				const peopleSubcollectionRef = classroomRef.collection('People');
				const peopleSnapshot = await peopleSubcollectionRef.get();
				peopleSnapshot.forEach(doc => transaction.delete(doc.ref));

				// Delete user's sections subcollection
				const promises: Promise<any>[] = [];
				peopleSnapshot.forEach(doc =>
					promises.push(users.sections.delete({ id, parents: { Users: doc.id }, transaction }))
				);
				await Promise.all(promises);

				// let found = false;
				// const homeClassrooms: IUserHomeSectionBase[] = [];
				// homeClassroomsData.forEach(m => {
				// 	if (m.id === id) {
				// 		found = true;
				// 		return;
				// 	}
				// 	homeClassrooms.push(m);
				// });
				// if (found) {
				// 	const response = await homes.merge({
				// 		id: user.uid,
				// 		data: { sections: homeClassrooms },
				// 		transaction
				// 	});
				// 	if (response.error) throw new BusinessResponse({ error: response.error });
				// }

				// Validate if the section belongs to an organization and delete it
				if (section.owner.organization) {
					const { organization } = section.owner;
					const parents = { Organizations: organization.id };
					const { error } = await organizations.sections.delete({ id, parents, transaction });
					if (error) throw new BusinessResponse({ error });
				}

				return new BusinessResponse({ data: deleted.data });
			});
		} catch (exc) {
			const code = `B0003`;
			if (exc instanceof BusinessResponse) return exc;
			return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}

	static async byOwner(user: User, ownerId?: string) {
		try {
			const filter = ownerId ?? user.uid;

			const parents = { Users: user.uid };
			const entries = await users.sections.col({ parents }).where('owner.id', '==', filter).get();
			const items = entries.docs.map(doc => doc.data());

			return new BusinessResponse({ data: { items } });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	// static async bulk(items: ISectionParams[], user: User) {
	// 	const error = items.find(item => !item.id || !item.name || !item.description);
	// 	if (error) {
	// 		return new BusinessResponse({
	// 			error: ErrorGenerator.invalidParameters(['id', 'name', 'description'])
	// 		});
	// 	}

	// 	try {
	// 		const promises: Promise<any>[] = [];
	// 		items.forEach(async item => {
	// 			let owner;
	// 			if (item.organizationId) {
	// 				const { organizationId } = item;
	// 				const response = await Organizations.get(organizationId, user);
	// 				if (response.error) {
	// 					return new BusinessResponse({
	// 						error: ErrorGenerator.documentNotFound('Organizations', organizationId)
	// 					});
	// 				}
	// 				const organization = response.data;
	// 				owner = {
	// 					organization: {
	// 						id: organization.id,
	// 						name: organization.name,
	// 						picture: organization.picture ?? ''
	// 					}
	// 				};
	// 			} else owner = { teacher: { uid: user.uid, name: user.displayName, photoUrl: user.photoUrl } };

	// 			const { code, error } = await Codes.generateCode('section');
	// 			if (error) return new BusinessResponse({ error });

	// 			const data: ISectionData = {
	// 				id: item.id,
	// 				name: item.name,
	// 				description: item.description,
	// 				owner,
	// 				joinSpecs: { code },
	// 				people: [{ uid: user.uid, name: user.displayName, photoUrl: user.photoUrl }]
	// 			};
	// 			promises.push(sections.set({ data }));
	// 		});
	// 		let results = await Promise.all(promises);
	// 		let errors = results.find(result => !!result.error);
	// 		if (errors) return new BusinessResponse({ error: errors.error });

	// 		promises.length = 0;
	// 		results.forEach(result => {
	// 			const codeData: ICodeData = {
	// 				id: `section.${result.code}`,
	// 				code: result.code,
	// 				entity: { name: 'section', id: result.id }
	// 			};
	// 			promises.push(codes.set({ data: codeData }));
	// 		});
	// 		results = await Promise.all(promises);
	// 		errors = results.find(result => !!result.error);
	// 		if (errors) return new BusinessResponse({ error: errors.error });

	// 		return new BusinessResponse({ data: { stored: true } });
	// 	} catch (exc) {
	// 		return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
	// 	}
	// }
}
