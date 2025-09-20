import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { User } from '@aimpact/agents-api/business/user';
import type { IProjectData, RoleType } from '@aimpact/agents-api/data/interfaces';
import { users } from '@aimpact/agents-api/data/model';
import type { Transaction } from 'firebase-admin/firestore';
import type { IGroupJoin, IJoinResponse } from '../../interfaces';
import { STATUS } from '../../status';
import { Users } from '../users';

export const approve = async (
	params: IGroupJoin,
	group: IProjectData,
	role: RoleType,
	user: User,
	transaction: Transaction
): Promise<BusinessResponse<IJoinResponse>> => {
	const { entity, collection } = params;

	// get user document to add organizations in users document
	let userDocument, error;
	({ userDocument, error } = await (async () => {
		const userDocument = await users.data({ id: user.uid, transaction });
		if (userDocument.error) return { error: userDocument.error };
		return { userDocument: userDocument.data.data };
	})());
	if (error) throw new BusinessResponse({ error });

	const parents: Record<string, string> = {};
	parents[entity.collectionName] = group.id;

	const data = {
		id: user.uid,
		uid: user.uid,
		email: user.email,
		name: user.displayName,
		photoUrl: user.photoUrl,
		role,
		authorized: true
	};
	const response = await collection.people.set({ id: user.uid, data, parents, transaction });
	if (response.error) throw new BusinessResponse({ error: response.error });

	const deleted = await collection.people.delete({ id: user.email, parents, transaction });
	if (deleted.error) throw new BusinessResponse({ error: deleted.error });

	// Update people on Organization document
	const people = group.people;
	people.push({ id: user.uid, uid: user.uid, name: user.displayName, photoUrl: user.photoUrl, role });

	const responseMerge = await collection.merge({ id: group.id, data: { people }, transaction });
	if (responseMerge.error) throw new BusinessResponse({ error: responseMerge.error });

	// Update the users organizations
	// if (entity.name === 'organization') {
	// 	// Set user's metadata request
	// 	const requests: IUserMetadata = { organizations: false };

	// 	const teacher = userDocument.teacher ?? { orgs: [] };
	// 	!teacher.orgs && (teacher.orgs = []);
	// 	const found = teacher.orgs.find(org => org.id === group.id);
	// 	!found && teacher.orgs.push({ id: group.id, name: group.name, role });

	// 	const roles = userDocument.roles ?? [];
	// 	if (!roles.includes(UserRole.Teacher)) roles.push(UserRole.Teacher);
	// 	role === 'manager' && !roles.includes(UserRole.Administrator) && roles.push(UserRole.Administrator);

	// 	await users.merge({ id: user.uid, data: { teacher, roles, metadata: { requests } }, transaction });
	// } else {
	// set Classrooms in usersHome
	// const { error } = await UsersHome.classrooms({
	// 	classroom: <IClassroomData>group,
	// 	role,
	// 	user: { uid: user.uid, name: user.displayName, photoUrl: user.photoURL },
	// 	transaction
	// });
	// if (error) throw new BusinessResponse({ error });

	// // Set user's metadata request
	// const requests: IUserMetadata = { classrooms: false };

	// const roles = userDocument.roles ?? [];
	// if (role === 'member' && !roles.includes(UserRole.Student)) roles.push(UserRole.Student);
	// if (role === 'manager' && !roles.includes(UserRole.Teacher)) roles.push(UserRole.Teacher);

	// const responseU = await users.merge({ id: user.uid, data: { roles, metadata: { requests } }, transaction });
	// if (responseU.error) throw new BusinessResponse({ error: responseU.error });
	// }

	// Update the users organizations/classrooms subcollection
	const specs = { group, user: user, transaction };
	const responseUsers = await Users.projects(specs);
	if (responseUsers.error) throw new BusinessResponse({ error: responseUsers.error });

	const joinResponse: IJoinResponse = { joined: true, status: STATUS.authorized };
	joinResponse[entity.name] = { id: group.id, name: group.name };

	return new BusinessResponse({ data: joinResponse });
};
