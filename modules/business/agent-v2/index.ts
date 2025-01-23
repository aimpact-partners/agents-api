import type { IPromptExecutionParams } from '@aimpact/agents-api/business/prompts';
import { PromptTemplateExecutor } from '@aimpact/agents-api/business/prompts';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { User } from '@aimpact/agents-api/business/user';
import { Chat } from './chat';
import { hook } from './hook';
import { IPE } from './ipe';

interface IParams {
	content: string;
	id?: string;
	systemId: string;
}

interface IMetadata {
	answer: string;
	summary?: string;
	objectives?: [];
	credits?: { total: number; consumed: number };
	error?: { code: number; text: string };
}

export /*bundle*/ class Agent {
	static async processIncremental(chatId: string, params: IParams, user: User) {
		// Get Chat
		const chat = new Chat(chatId, user);
		await chat.fetch();
		if (chat.error) return chat.error;

		// Fetch the agent
		const response = await hook(chat, user);
		if (!response.data.credits) return new BusinessResponse({ error: response.credits });

		const prompt = params.content;
		const specs: IPromptExecutionParams = IPE.prepare(chat, prompt);

		const promptTemplate = new PromptTemplateExecutor(specs);
		const execution = promptTemplate.incremental();

		// PostProcessor
		async function post(answer: string) {
			const response = await IPE.process(chat, prompt, answer);
			if (response.error) {
				return { error: response.error };
			}

			const { ipe } = response;
			const hookSpecs = { ipe, answer, testing: chat.testing };
			const hookResponse = await hook(chat, user, hookSpecs);
			if (hookResponse.error) {
				return { error: hookResponse.error };
			}

			// Store messages
			await chat.storeInteration({ prompt: params.content, answer, ipe });
			if (chat.error) {
				console.error('store user msg', chat.error);
				return;
			}

			return { ipe, credits: hookResponse.data.credits };
		}

		async function* iterator(): AsyncIterable<{ chunk?: string; metadata?: IMetadata }> {
			const metadata: IMetadata = { answer: '', objectives: [] };
			for await (const part of execution) {
				if (part.error) metadata.error = part.error;

				const chunk = part.chunk?.replace('ÿ', 'y').replace('😸', '😺').replace('🖋️', '✒️');

				// Yield the answer of the response of a function, but only compute the chunks for the answer of the answer
				if (chunk || part.function) yield { chunk: chunk ? chunk : part.function.content };
				metadata.answer += chunk ? chunk : '';
			}

			// Call postProcessor
			const response = await post(metadata.answer);
			if (response.error) metadata.error = response.error;

			response.credits && (metadata.credits = response.credits);
			if (response.ipe) {
				response.ipe.forEach(ipe => {
					if (ipe.key !== 'objectives') return;
					const { objectives } = ipe.response;
					metadata.objectives = objectives.map(o => ({
						name: o.name,
						relevance: o.relevance,
						status: o.status
					}));
				});
			}

			yield { metadata };
		}

		return { status: true, iterator: iterator() };
	}

	static async processRealtime(chatId: string, params: IParams, user: User) {}
}
