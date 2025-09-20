import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { IArticleData, IUserBase as User } from '@aimpact/agents-api/data/interfaces';
import { Articles } from '@aimpact/agents-api/msp/business/articles';
import { DraftTypes } from '@aimpact/agents-api/data/interfaces';
import { drafts } from '@aimpact/agents-api/data/model';

type ModulesResponse = Promise<BusinessResponse<IArticleData>>;

export const publish = async (id: string, user: User): ModulesResponse => {
	if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });
	try {
		const responseData = await drafts.data({ id });
		if (responseData.error) throw new BusinessResponse({ error: responseData.error });
		if (!responseData.data.exists) throw new BusinessResponse({ error: responseData.data.error });

		const draft = responseData.data.data;
		if (user.uid !== draft.creator.id) {
			throw new BusinessResponse({ error: ErrorGenerator.userNotAuthorized() });
		}

		if (draft.type === DraftTypes.Article) {
			return await Articles.publish(draft, user);
		}

		return new BusinessResponse({ error: ErrorGenerator.typeNotValid(draft.id, draft.type) });
	} catch (exc) {
		const code = `B0001`;
		if (exc instanceof BusinessResponse) return exc;
		return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
	}
};
