import { PromptTemplateExecutor } from '@aimpact/agents-api/business/prompts';
import { User } from '@aimpact/agents-api/business/user';
import { AssistantMission } from './assistan-mission';
import { Chat } from './chat';
import { _hook } from './hook';
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
	// PreProcessor
	static async pre(id: string, prompt: string, user: User) {
		const chat = new Chat(id, user);
		await chat.fetch();
		if (chat.error) return { error: chat.error };

		// Fetch the agent
		const response = await _hook(chat, user);
		if (response.error) return { error: response.error };

		const { specs, error } = await AssistantMission.get(chat, prompt, user);
		if (error) return { error };

		return { chat, specs };
	}

	// PostProcessor
	static async post(chat: Chat, prompt: string, answer: string, user: User) {
		const response = await IPE.process(chat, prompt, answer, user);
		if (response.error) return { error: response.error };

		const { ipe } = response;
		const hookSpecs = { ipe, prompt, answer, testing: chat.testing };
		const hookResponse = await _hook(chat, user, hookSpecs);
		if (hookResponse.error) return { error: hookResponse.error };

		// Store messages
		await chat.storeInteration({ prompt, answer, ipe });
		if (chat.error) return { error: chat.error };

		return { ipe, credits: hookResponse.data.credits };
	}

	// Hook
	static async hook(chat: Chat, user: User, params = {}) {
		return _hook(chat, user, params);
	}

	static async processIncremental(chatId: string, params: IParams, user: User) {
		const prompt = params.content;

		// Call preProcessor
		const { chat, specs, error } = await Agent.pre(chatId, prompt, user);
		if (error) return { status: false, error };

		const promptTemplate = new PromptTemplateExecutor(specs);
		const execution = promptTemplate.incremental();

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
			const response = await Agent.post(chat, prompt, metadata.answer, user);
			if (response.error) metadata.error = response.error;

			response.credits && (metadata.credits = response.credits);
			response.ipe &&
				response.ipe?.forEach(ipe => {
					if (ipe.key !== 'progress') return;
					const { objectives } = ipe.response;
					metadata.objectives =
						objectives &&
						objectives.map(o => ({
							name: o.name,
							relevance: o.relevance,
							status: o.status
						}));
				});

			yield { metadata };
		}

		return { status: true, iterator: iterator() };
	}

	static async processRealtime(chatId: string, params: IParams, user: User) {}
}
