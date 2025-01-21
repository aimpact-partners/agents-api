import type { IPromptExecutionParams } from '@aimpact/agents-api/business/prompts';
import { PromptTemplateExecutor } from '@aimpact/agents-api/business/prompts';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { User } from '@aimpact/agents-api/business/user';
import * as dotenv from 'dotenv';
import { Chat } from './chat';
import { hook } from './hook';
import { IPE } from './ipe';

dotenv.config();
const { AGENT_API_URL, AGENT_API_TOKEN } = process.env;

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
				console.error('process IPE', response.error);
				return;
			}

			const { ipe } = response;

			const hookSpecs = { ipe, answer, testing: chat.testing };
			const hookResponse = await hook(chat, user, hookSpecs);
			if (hookResponse.error) {
				console.error('Hook ', hookResponse.error);
				return;
			}

			// Store messages
			await chat.storeInteration({ prompt: params.content, answer, ipe });
			if (chat.error) {
				console.error('store user msg', chat.error);
				return;
			}
		}

		async function* iterator(): AsyncIterable<{ chunk?: string; metadata?: IMetadata }> {
			const metadata: IMetadata = { answer: '', progress: '' };
			for await (const part of execution) {
				if (part.error) metadata.error = part.error;

				const chunk = part.chunk?.replace('ÿ', 'y').replace('😸', '😺').replace('🖋️', '✒️');

				// Yield the answer of the response of a function, but only compute the chunks for the answer of the answer
				if (chunk || part.fnc) yield { chunk: chunk ? chunk : part.fnc.name };
				metadata.answer += chunk ? chunk : '';
			}

			// Call postProcessor
			await post(metadata.answer);

			yield { metadata };
		}

		return { status: true, iterator: iterator() };
	}

	static async processRealtime(chatId: string, params: IParams, user: User) {}
}
