import type { IPromptExecutionParams } from '@aimpact/agents-api/business/prompts';
import { PromptTemplateExecutor } from '@aimpact/agents-api/business/prompts';
import { User } from '@aimpact/agents-api/business/user';
import { Chat } from './chat';
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
	static async processInteraction(chatId: string, params: IParams, user: User) {
		const chat = new Chat(chatId, user);
		await chat.fetch();
		if (chat.error) return chat.error;

		const specs: IPromptExecutionParams = prepare(chat, params.content);
		const promptTemplate = new PromptTemplateExecutor(specs);
		const execution = await promptTemplate.incremental();

		async function* iterator(): AsyncIterable<{ chunk?: string; metadata?: IMetadata }> {
			const metadata: IMetadata = { answer: '', progress: '' };
			for await (const part of execution) {
				if (part.error) metadata.error = part.error;

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
