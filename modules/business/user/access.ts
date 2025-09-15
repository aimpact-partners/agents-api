import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { metadata } from '@aimpact/agents-api/data/model';
import type { IUser } from '.';

export /*bundle*/ class UserAccess {
	static async authorizations(user: IUser) {
		const authorizations = await metadata.data({ id: 'authorizations' });
		if (authorizations.error) return new BusinessResponse({ error: authorizations.error });
		const dataHandler = authorizations.data.exists ? authorizations.data.data.promptsManagement : [];
		if (!dataHandler || (dataHandler && !dataHandler.includes(user.email))) {
			return new BusinessResponse({ error: ErrorGenerator.userNotAuthorized() });
		}

		return new BusinessResponse({ data: user });
	}
}
