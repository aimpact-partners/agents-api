import { ActivityAgent } from '@aimpact/agents-api/business/agent/activity';
import { Chat } from '@aimpact/agents-api/business/agent/chat';
import { KBAgent } from '@aimpact/agents-api/business/agent/kb';
import { User } from '@aimpact/agents-api/business/user';

interface IParams {
	content: string;
	id?: string;
	systemId?: string;
}

export /*bundle*/ class Agent {
	static async process(chatId: string, params: IParams, user: User) {
		const chat = new Chat(chatId, user);
		await chat.fetch();
		if (chat.error) return { error: chat.error };

		console.log('response AGENT BASE', chat.project.agent);
		if (chat.project.agent === 'kb-conversation') {
			return await KBAgent.processIncremental(chat, params, user);
		}

		return await ActivityAgent.processIncremental(chat, params, user);
	}
}
