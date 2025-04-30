import type { User } from '@aimpact/agents-api/business/user';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
// import { ailearnUsers } from '@aimpact/agents-api/data/model';
import { users } from '@aimpact/agents-api/data/model';
import type { IProjectData, IPeopleBase, IPeopleData } from '@aimpact/agents-api/data/interfaces';
// import type { IAILearnUserData, ITeacherOrg } from '@aimpact/agents-api/data/interfaces';
import { db } from '@beyond-js/firestore-collection/db';
import * as dotenv from 'dotenv';
import type { Transaction } from 'firebase-admin/firestore';
import { Approve } from './actions/approve';
import { Invite } from './actions/invite';
import { Join } from './actions/join';
import type { IGroupApprove, IGroupBase, IGroupInvite, IGroupJoin, IGroupRemove } from './interfaces';

dotenv.config();

// Entities that requires a list of members associated (Organizations and Classrooms)
export /*bundle*/ abstract class Group {
	static async join(params: IGroupJoin, user: User) {
		return Join.process(params, user);
	}

	static async invite(params: IGroupInvite, user: User) {
		return Invite.process(params, user);
	}

	static async approve(params: IGroupApprove, user: User) {
		return Approve.process(params, user);
	}

	static async getPeople(
		params: IGroupBase,
		group: IProjectData,
		user: User
	): Promise<BusinessResponse<IPeopleData[] | IPeopleBase[]>> {
		const { entity, collection } = params;

		const parents: Record<string, string> = {};
		parents[entity.collectionName] = group.id;

		// 1. Validate permissions for return people
		let response;
		response = await collection.people.data({ id: user.uid, parents });
		if (response.error) return new BusinessResponse({ error: response.error });

		// User not exists on group
		if (!response.data.exists) {
			// check people collection by email, for users invited
			response = await collection.people.data({ id: user.email, parents });
			if (response.error) return new BusinessResponse({ error: response.error });
			if (!response.data.exists) {
				return new BusinessResponse({
					error: ErrorGenerator.userNotAuthorizedOnGroup({ entity: { name: group.name }, id: group.id })
				});
			}
		}

		if (response.data.data.invited) {
			return new BusinessResponse({
				error: ErrorGenerator.userInvitePendingOnGroup(user.uid, group.id)
			});
		}
		if (!response.data.data.authorized) {
			return new BusinessResponse({
				error: ErrorGenerator.userPendingRequestOnGroup(user.uid, group.id)
			});
		}

		// 2. Check user is a manager of the group
		if (response.data.data.role !== 'manager') return new BusinessResponse({ data: group.people });

		// 3. Read and return all the docs of the group's 'People' subcollection
		const entries = await collection.doc({ id: group.id }).collection('People').get();
		const people: IPeopleData[] = entries.docs.map(entry => <IPeopleData>entry.data());

		return new BusinessResponse({ data: people });
	}

	private static async getGroup(params: IGroupRemove, user: User, transaction: Transaction) {
		const { entity, collection, id } = params;
		const response = await collection.data({ id, transaction });
		if (response.error) return { error: response.error };
		if (!response.data.exists) return { error: response.data.error };
		const groupData = response.data.data;

		const parents: Record<string, string> = {};
		parents[entity.collectionName] = id;
		// Check user role on group
		const managerCheck = await collection.people.data({ id: user.uid, parents, transaction });
		if (managerCheck.error) return { error: managerCheck.error };
		if (!managerCheck.data.exists || managerCheck.data.data.role !== 'manager') {
			return { error: ErrorGenerator.userNotAuthorizedOnGroup(params) };
		}

		return { data: groupData };
	}

	static async removeMember(params: IGroupRemove, uid: string, user: User) {
		try {
			return await db.runTransaction(async (transaction: Transaction) => {
				const { entity, collection, id } = params;

				const groupResponse = await Group.getGroup(params, user, transaction);
				if (groupResponse.error) throw new BusinessResponse({ error: groupResponse.error });
				const groupData = groupResponse.data;

				// Avoid to remove the same member
				if (uid === user.uid) throw new BusinessResponse({ error: ErrorGenerator.userCantRemoveHimself() });

				const parents: Record<string, string> = {};
				parents[entity.collectionName] = id;
				// Check target user on group
				const userCheck = await collection.people.data({ id: uid, parents, transaction });
				if (userCheck.error) throw new BusinessResponse({ error: userCheck.error });
				if (!userCheck.data.exists) throw new BusinessResponse({ error: userCheck.data.error });

				// Update member removed data
				// let orgs: ITeacherOrg[] = [];
				// let userData: IAILearnUserData;
				// if (entity.collectionName === 'Organizations') {
				// 	const userResponse = await ailearnUsers.data({ id: uid, transaction });
				// 	if (userResponse.error) throw new BusinessResponse({ error: userResponse.error });
				// 	userData = userResponse.data.data;
				// 	orgs = userData?.teacher.orgs.filter(org => org.id !== groupData.id);
				// }

				const userDelete = await collection.people.delete({ id: uid, parents, transaction });
				if (userDelete.error) throw new BusinessResponse({ error: userDelete.error });

				const groupPeople: IPeopleBase[] = [];
				groupData.people.forEach(people => {
					if (people.uid === uid || people.id === uid) return;
					groupPeople.push(people);
				});
				const responseMerge = await collection.merge({ id, data: { people: groupPeople }, transaction });
				if (responseMerge.error) throw new BusinessResponse({ error: responseMerge.error });

				// if (entity.collectionName === 'Organizations') {
				// 	userData.teacher.orgs = orgs;
				// 	const response = await ailearnUsers.merge({
				// 		id: uid,
				// 		data: { teacher: userData.teacher },
				// 		transaction
				// 	});
				// 	if (response.error) throw new BusinessResponse({ error: response.error });
				// }

				const subcollection = 'projects';
				const subcollectionResponse = await users[subcollection].delete({
					id: groupData.id,
					transaction,
					parents: { Users: uid }
				});
				if (subcollectionResponse.error) throw new BusinessResponse({ error: subcollectionResponse.error });

				return new BusinessResponse({ data: userDelete.data });
			});
		} catch (exc) {
			const code = `B0066`;
			if (exc instanceof BusinessResponse) return exc;
			return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}

	static async revokeInvitation(params: IGroupRemove, email: string, user: User) {
		try {
			return await db.runTransaction(async (transaction: Transaction) => {
				const { entity, collection, id } = params;
				const groupResponse = await Group.getGroup(params, user, transaction);
				if (groupResponse.error) throw new BusinessResponse({ error: groupResponse.error });

				const parents: Record<string, string> = {};
				parents[entity.collectionName] = id;

				// Check target email on group
				const userCheck = await collection.people.data({ id: email, parents, transaction });
				if (userCheck.error) throw new BusinessResponse({ error: userCheck.error });
				if (!userCheck.data.exists) {
					throw new BusinessResponse({ error: ErrorGenerator.invitationNotValid(email, entity.name) });
				}

				const member = userCheck.data.data;
				if (!member.invited) {
					throw new BusinessResponse({ error: ErrorGenerator.invitationNotValid(email, entity.name) });
				}

				const memberDelete = await collection.people.delete({ id: email, parents, transaction });
				if (memberDelete.error) throw new BusinessResponse({ error: memberDelete.error });

				return new BusinessResponse({ data: memberDelete.data });
			});
		} catch (exc) {
			const code = `B0067`;
			if (exc instanceof BusinessResponse) return exc;
			return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}

	static async rejectRequest(params: IGroupRemove, uid: string, user: User) {
		try {
			return await db.runTransaction(async (transaction: Transaction) => {
				const { collection, entity, id } = params;

				const groupResponse = await Group.getGroup(params, user, transaction);
				if (groupResponse.error) throw new BusinessResponse({ error: groupResponse.error });

				const parents: Record<string, string> = {};
				parents[entity.collectionName] = id;

				// Check target uid on group
				const userCheck = await collection.people.data({ id: uid, parents, transaction });
				if (userCheck.error) throw new BusinessResponse({ error: userCheck.error });
				if (!userCheck.data.exists) throw new BusinessResponse({ error: ErrorGenerator.requestNotExist(uid) });

				const member = userCheck.data.data;
				if (member.authorized) {
					throw new BusinessResponse({ error: ErrorGenerator.requestNotExist(uid) });
				}

				const memberDelete = await collection.people.delete({ id: uid, parents, transaction });
				if (memberDelete.error) throw new BusinessResponse({ error: memberDelete.error });

				return new BusinessResponse({ data: memberDelete.data });
			});
		} catch (exc) {
			const code = `B0068`;
			if (exc instanceof BusinessResponse) return exc;
			return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}
}
