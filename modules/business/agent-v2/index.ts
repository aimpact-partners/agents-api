import { Chat } from '@aimpact/agents-api/business/chats';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import type { IPromptExecutionParams } from '@aimpact/agents-api/business/prompts';
import { PromptTemplateExecutor } from '@aimpact/agents-api/business/prompts';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { User } from '@aimpact/agents-api/business/user';
import { prepare } from './prepare';

interface IParams {
	content: string;
	id?: string;
	systemId: string;
}

interface IMetadata {
	answer: string;
	summary?: string;
	progress?: string;
	error?: { code: number; text: string };
}

export /*bundle*/ class Agent {
	static async sendMessage(chatId: string, params: IParams, user: User) {
		let chat, error;
		({ chat, error } = await (async () => {
			const response = await Chat.get(chatId);
			if (response.error) return { error: response.error };
			chat = response.data;

			// Chat validations
			const id = chat.user.uid ?? chat.user.id;
			if (id !== user.uid) return { error: ErrorGenerator.unauthorizedUserForChat() };
			if (!chat.language) return { error: ErrorGenerator.chatWithoutLanguages(chatId) };
			return { chat };
		})());
		if (error) return { error: new BusinessResponse({ error }) };

		const specs: IPromptExecutionParams = prepare(chat, user);
		specs.messages = chat.messages ?? [];

		// add the user's message
		const { content } = params;
		specs.messages.push({ role: 'user', content });

		specs.model = 'gpt-4o-mini';
		specs.temperature = 1;

		const promptTemplate = new PromptTemplateExecutor(specs);
		const execution = await promptTemplate.incremental();

		async function* iterator(): AsyncIterable<{ chunk?: string; metadata?: IMetadata }> {
			const metadata = { synthesis: '', answer: '', objectives: '' };
			for await (const part of execution) {
				const chunk = part.chunk?.replace('ÿ', 'y').replace('😸', '😺').replace('🖋️', '✒️');

				// Yield the answer of the response of a function, but only compute the chunks for the answer of the answer
				if (chunk || part.fnc) yield { chunk: chunk ? chunk : part.fnc.name };
				metadata.answer += chunk ? chunk : '';
			}
			yield { metadata };
		}

		return { status: true, iterator: iterator() };
	}
}
