import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { ICodeData, IProjectData } from '@aimpact/agents-api/data/interfaces';
import { codes } from '@aimpact/agents-api/data/model';
import type { User } from '@aimpact/agents-api/business/user';
import { db } from '@beyond-js/firestore-collection/db';
import type { Transaction } from 'firebase-admin/firestore';
import type { IGroupJoin } from '../../interfaces';
import { approve } from './approve';
import { request } from './request';

export class Join {
	static async process(params: IGroupJoin, user: User) {
		// 1. Look for the code into the Codes collection
		// 2. Check if the user is already invited
		// 2.1 If the user is already invited, remove and create a new doc as an authorized member
		// 2.2 If not invited, then register the user as an anauthorized person

		try {
			return await db.runTransaction(async (transaction: Transaction) => {
				const { entity, collection } = params;
				const code = params.code.toUpperCase();

				let codeData: ICodeData, error;
				({ codeData, error } = await (async () => {
					const { data, error } = await codes.data({ id: `${entity.name}.${code}`, transaction });
					if (error || !data.exists) {
						return { error: ErrorGenerator.codeNotFound(code, entity.collectionName) };
					}
					return { codeData: data.data };
				})());
				if (error) throw new BusinessResponse({ error });

				const parents: Record<string, string> = {};
				parents[entity.collectionName] = codeData.entity.id;

				// get Organization document
				let group: IProjectData;
				({ group, error } = await (async () => {
					const { data, error } = await collection.data({ id: codeData.entity.id, transaction });
					if (error) return { error: error };
					if (!data.exists) return { error: data.error };
					return { group: data.data };
				})());
				if (error) throw new BusinessResponse({ error });

				// validate user on people subcollection
				let people;
				({ people, error } = await (async () => {
					// getting by email - The user has been previously invited.
					const byEmail = await collection.people.data({ id: user.email, parents, transaction });
					if (byEmail.error) return { error: byEmail.error };
					if (byEmail.data.exists) return { people: byEmail.data.data };

					// getting by uid - The user join without invitation
					const byId = await collection.people.data({ id: user.uid, parents, transaction });
					if (byId.error) return { error: byId.error };
					return { people: byId.data.exists ? byId.data.data : void 0 };
				})());
				if (error) throw new BusinessResponse({ error });

				/**
				 * User made a join request and has NO invitation
				 */
				if (!people) return await request(params, group, user, transaction);

				// User already in organization
				if (people.authorized) {
					throw new BusinessResponse({
						error: ErrorGenerator.userAlreadyExistOnGroup(user.email, entity.name)
					});
				}
				// The user has already made a join request
				if (people.invited === undefined) {
					throw new BusinessResponse({
						error: ErrorGenerator.joinWaitingToConfirm(user.email)
					});
				}
				// The invitation exists but is inactive
				if (people.invited === false) {
					throw new BusinessResponse({
						error: ErrorGenerator.invitationNotValid(user.email, entity.name)
					});
				}

				return approve(params, group, people.role, user, transaction);
			});
		} catch (exc) {
			const code = `B0012`;
			if (exc instanceof BusinessResponse) return exc;
			return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}
}
