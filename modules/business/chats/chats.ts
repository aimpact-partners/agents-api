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

	static async byAgent(id: string, agent: string) {
		try {
			if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

			const docs = await chats.col().where('user.id', '==', id).where('project.agent', '==', agent).get();
			const items: IChatData[] = [];
			docs.forEach(item => items.push(item.data()));

			return new BusinessResponse({ data: { items } });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async filter(userId: string, projectId: string, agentId: string) {
		try {
			if (!userId) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['userId']) });
			if (!projectId) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['projectId']) });
			if (!agentId) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['agentId']) });

			const docs = await chats
				.col()
				.where('user.id', '==', userId)
				.where('project.id', '==', projectId)
				.where('project.agent', '==', agentId)
				.get();

			const items: IChatData[] = docs.docs.map(doc => doc.data() as IChatData);

			return new BusinessResponse({ data: { items } });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}
}
