import type { User } from '@aimpact/agents-api/business/user';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { Mailer } from '@aimpact/agents-api/business/mailer';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import config from '@aimpact/agents-api/config';
import { db } from '@beyond-js/firestore-collection/db';
import * as dotenv from 'dotenv';
import type { Transaction } from 'firebase-admin/firestore';
import type { IGroupInvite, IInviteResponse } from '../interfaces';
import { STATUS } from '../status';

dotenv.config();
const { MAIL_TEMPLATES_INVITE } = process.env;

export class Invite {
	static async process(params: IGroupInvite, user: User) {
		// 1. Look for the user (uid)
		// 2. Check user is a teacher, otherwise return with an error
		// 3. Regiter the user in the People's subcollection
		// 4. Send the invited an email
		try {
			return await db.runTransaction(async (transaction: Transaction) => {
				if (!MAIL_TEMPLATES_INVITE) {
					throw new BusinessResponse({ error: ErrorGenerator.mailTemplatesNotDefined('invite') });
				}

				const { id, entity, collection, name, role } = params;
				const email = params.email.toLocaleLowerCase();

				const response = await collection.data({ id, transaction });
				if (response.error) throw new BusinessResponse({ error: response.error });
				if (!response.data.exists) throw new BusinessResponse({ error: response.data.error });
				const groupData = response.data.data;

				const parents: Record<string, string> = {};
				parents[entity.collectionName] = id;
				const managerCheck = await collection.people.data({ id: user.uid, parents, transaction });
				if (managerCheck.error) throw new BusinessResponse({ error: managerCheck.error });
				if (!managerCheck.data.exists || managerCheck.data.data.role !== 'manager') {
					throw new BusinessResponse({ error: ErrorGenerator.userNotAuthorizedOnGroup(params) });
				}
				const peopleResponse = await collection.people.data({ id: email, parents, transaction });
				if (peopleResponse.error) throw new BusinessResponse({ error: peopleResponse.error });
				if (peopleResponse.data.exists) {
					if (peopleResponse.data.data.authorized) {
						throw new BusinessResponse({
							error: ErrorGenerator.userAlreadyExistOnGroup(email, params.entity.name)
						});
					}
					throw new BusinessResponse({
						error: ErrorGenerator.invitationAlreadyExists(email, params.entity.name, params.id)
					});
				}

				const data = { email, name, role, invited: true };
				const peopleSet = await collection.people.set({ id: email, parents, data, transaction });
				if (peopleSet.error) throw new BusinessResponse({ error: peopleSet.error });

				// const specs = {
				// 	name,
				// 	groupName: groupData.name,
				// 	groupText: entity.name === 'project' ? 'al proyecto' : '',
				// 	code: groupData.joinSpecs.code,
				// 	appUrl: config.params.applicationUrl,
				// 	actionUrl: `${config.params.applicationUrl}/${entity.name}s/join?code=${groupData.joinSpecs.code}`
				// };

				// const tpl = parseInt(MAIL_TEMPLATES_INVITE);
				// const { error } = await Mailer.send(tpl, email, specs);
				// if (error) throw new BusinessResponse({ error: ErrorGenerator.mailNotSend() });

				const inviteResponse: IInviteResponse = { invited: true, status: STATUS.invited };
				inviteResponse[entity.name] = { id, name: groupData.name };

				return new BusinessResponse({ data: inviteResponse });
			});
		} catch (exc) {
			const code = `B0014`;
			if (exc instanceof BusinessResponse) return exc;
			return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}
}
