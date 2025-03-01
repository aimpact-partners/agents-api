import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { IChatData } from '@aimpact/agents-api/data/interfaces';
import { chats } from '@aimpact/agents-api/data/model';

export /*bundle*/ class Chats {
	static async byUser(id: string) {
		try {
			if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

			const docs = await chats.col().where('user.id', '==', id).get();
			const items: IChatData[] = [];
			docs.forEach(item => items.push(item.data()));

			return new BusinessResponse({ data: { items } });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}
}
