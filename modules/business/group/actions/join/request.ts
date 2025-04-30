import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { IProjectData } from '@aimpact/agents-api/data/interfaces';
import type { User } from '@aimpact/agents-api/business/user';
import * as dotenv from 'dotenv';
import type { Transaction } from 'firebase-admin/firestore';
import type { IGroupJoin, IJoinResponse } from '../../interfaces';
import { STATUS } from '../../status';

dotenv.config();
const { MAIL_TEMPLATES_JOIN } = process.env;

export const request = async (
	params: IGroupJoin,
	group: IProjectData,
	user: User,
	transaction: Transaction
): Promise<BusinessResponse<IJoinResponse>> => {
	if (!MAIL_TEMPLATES_JOIN) {
		throw new BusinessResponse({ error: ErrorGenerator.mailTemplatesNotDefined('join') });
	}

	const { entity, collection } = params;
	const parents: Record<string, string> = {};
	parents[entity.collectionName] = group.id;
	const data = {
		id: user.id,
		uid: user.uid,
		email: user.email,
		name: user.displayName,
		photoUrl: user.photoURL,
		authorized: false
	};
	const response = await collection.people.set({ id: user.uid, data, parents, transaction });
	if (response.error) throw new BusinessResponse({ error: response.error });

	// Set user's metadata request
	// const requests: IUserMetadata = {};
	// requests[entity.name === 'classroom' ? 'classrooms' : 'organizations'] = true;

	// const responseU = await users.merge({ id: user.uid, data: { metadata: { requests } }, transaction });
	// if (responseU.error) throw new BusinessResponse({ error: responseU.error });

	//SendMail

	// const specs = {
	// 	name: user.displayName,
	// 	email: user.email,
	// 	groupName: group.name,
	// 	groupText: entity.name === 'organization' ? 'a la institución' : 'al aula',
	// 	date: dayjs().format('MM/DD/YYYY'),
	// 	appUrl: config.params.applicationUrl,
	// 	applicationName: config.params.applicationName,
	// 	actionUrl: `${config.params.applicationUrl}/${entity.name}s/view/${group.id}`
	// };
	// const entries = await collection
	// 	.doc({ id: group.id })
	// 	.collection('People')
	// 	.where('notifications', '==', true)
	// 	.get();
	// const tpl = parseInt(MAIL_TEMPLATES_JOIN);

	// const promises: Promise<any>[] = [];
	// entries.docs.map(entry => {
	// 	const people = <IPeopleData>entry.data();
	// 	people.email && promises.push(Mailer.send(tpl, people.email, specs));
	// });
	// const results = await Promise.all(promises);
	// const errors = results.find(result => !!result.error);
	// if (errors) throw new BusinessResponse({ error: ErrorGenerator.mailNotSend() });

	const joinResponse: IJoinResponse = { joined: true, status: STATUS.pending };
	joinResponse[entity.name] = { id: group.id, name: group.name };

	return new BusinessResponse({ data: joinResponse });
};
