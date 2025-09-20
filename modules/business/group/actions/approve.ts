import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { User } from '@aimpact/agents-api/business/user';
import type { IProjectData } from '@aimpact/agents-api/data/interfaces';
import { db } from '@beyond-js/firestore-collection/db';
import * as dotenv from 'dotenv';
import type { Transaction } from 'firebase-admin/firestore';
import type { IApproveResponse, IGroupApprove } from '../interfaces';
import { STATUS } from '../status';
import { Users } from './users';

dotenv.config();
const { MAIL_TEMPLATES_APPROVE } = process.env;

export class Approve {
	static async process(params: IGroupApprove, user: User) {
		try {
			return await db.runTransaction(async (transaction: Transaction) => {
				if (!MAIL_TEMPLATES_APPROVE) {
					throw new BusinessResponse({ error: ErrorGenerator.mailTemplatesNotDefined('approve') });
				}

				let error;
				const { id, entity, collection } = params;
				const parents: Record<string, string> = {};
				parents[entity.collectionName] = id;

				// Get group data
				let group: IProjectData;
				({ group, error } = await (async () => {
					const { data, error } = await collection.data({ id, transaction });
					if (error) return { error: error };
					return !data.exists ? { error: data.error } : { group: data.data };
				})());
				if (error) throw new BusinessResponse({ error });

				// 1. Validate user permissions
				let people;
				({ people, error } = await (async () => {
					const { data, error } = await collection.people.data({ id: user.uid, parents, transaction });
					if (error) return { error };
					if (!data.exists) return { error: ErrorGenerator.userNotAuthorizedOnGroup(params) };
					if (data.data.role !== 'manager') return { error: ErrorGenerator.userNotAuthorizedOnGroup(params) };

					// 1.1 Check if uid exists on People Collection
					const peopleResponse = await collection.people.data({ id: params.uid, parents, transaction });
					if (peopleResponse.error) return { error: peopleResponse.error };
					if (!peopleResponse.data.exists) return { error: peopleResponse.data.error };

					return { people: peopleResponse.data.data };
				})());
				if (error) throw new BusinessResponse({ error });

				// Authorization already true
				// 2. validate authorized
				if (people.authorized) {
					const approveResponse: IApproveResponse = { approved: true, status: STATUS.already };
					approveResponse[entity.name] = { id, name: group.name };
					return new BusinessResponse({ data: approveResponse });
				}

				// 3. change authorized true
				people.authorized = true;
				people.role = params.role;
				const peopleSetResponse = await collection.people.set({
					id: params.uid,
					data: people,
					parents,
					transaction
				});
				if (peopleSetResponse.error) throw new BusinessResponse({ error: peopleSetResponse.error });

				// 4. update people on group Collection
				const items = group.people;
				items.push({ uid: people.uid, name: people.name, photoUrl: people.photoUrl, role: params.role });
				const groupSetResponse = await collection.merge({ id, data: { people: items }, transaction });
				if (groupSetResponse.error) throw new BusinessResponse({ error: groupSetResponse.error });

				// 5. Update Users data
				// 5.3 Update users organizations/classrooms subcollection
				const usersSpecs = { group, user: people, transaction };
				let userResponse;
				if (params.entity.name === 'project') userResponse = await Users.projects(usersSpecs);
				if (userResponse.error) throw new BusinessResponse({ error: userResponse.error });

				// 6. send Mail Notification
				// const specs = {
				// 	name: people.name,
				// 	groupName: group.name,
				// 	groupText: entity.name === 'organization' ? 'a la institución' : 'al aula',
				// 	appUrl: config.params.applicationUrl,
				// 	applicationName: config.params.applicationName,
				// 	actionUrl: config.params.applicationUrl
				// };

				// const tpl = parseInt(MAIL_TEMPLATES_APPROVE);
				// const response = await Mailer.send(tpl, people.email, specs);
				// if (response.error) throw new BusinessResponse({ error: ErrorGenerator.mailNotSend() });

				const approveResponse: IApproveResponse = { approved: true, status: STATUS.authorized };
				approveResponse[entity.name] = { id, name: group.name };

				return new BusinessResponse({ data: approveResponse });
			});
		} catch (exc) {
			const code = `B0010`;
			if (exc instanceof BusinessResponse) return exc;
			return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}
}
