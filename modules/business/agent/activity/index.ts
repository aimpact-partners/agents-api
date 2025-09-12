import { Chat } from '@aimpact/agents-api/business/agent/chat';
import { PromptTemplateExecutor } from '@aimpact/agents-api/business/prompts';
import { AssistantMission } from './assistan-mission';
import { hook } from '@aimpact/agents-api/business/agent/hook';
import { IPE } from './ipe';

interface IParams {
	content: string;
	id?: string;
	systemId?: string;
}

interface IMetadata {
	summary?: string;
	objectives?: [];
	credits?: { total: number; consumed: number };
	error?: { code: number; text: string };
}

export /*bundle*/ class ActivityAgent {
	// PreProcessor
<<<<<<< HEAD:modules/business/agent-v2/index.ts
	static async pre(id: string, prompt: string) {
		const chat = new Chat(id);
		await chat.fetch();
		if (chat.error) return { error: chat.error };

		// Fetch the agent
		const response = await _hook(chat);
=======
	static async pre(chat: IAgentChat, prompt: string, user: User) {
		// Fetch the agent
		const response = await hook(chat, user);
>>>>>>> origin/dev:modules/business/agent/activity/index.ts
		if (response.error) return { error: response.error };

		const { specs, error } = await AssistantMission.get(chat, prompt);
		if (error) return { error };

		return { specs };
	}

	// PostProcessor
	static async post(chat: Chat, prompt: string, answer: string) {
		const response = await IPE.process(chat, prompt, answer);
		if (response.error) return { error: response.error };

		const { ipe } = response;
		const hookSpecs = { ipe, prompt, answer, testing: chat.testing };
<<<<<<< HEAD:modules/business/agent-v2/index.ts
		const hookResponse = await _hook(chat, hookSpecs);
=======
		const hookResponse = await hook(chat, user, hookSpecs);
>>>>>>> origin/dev:modules/business/agent/activity/index.ts
		if (hookResponse.error) return { error: hookResponse.error };

		// Store messages
		await chat.storeInteration({ prompt, answer, ipe });
		if (chat.error) return { error: chat.error };

		return { ipe, credits: hookResponse.data.credits };
	}

	// Hook
<<<<<<< HEAD:modules/business/agent-v2/index.ts
	static async hook(chat: Chat, params = {}) {
		return _hook(chat, params);
	}

	static async processIncremental(chatId: string, params: IParams) {
		const prompt = params.content;

		// Call preProcessor
		const { chat, specs, error } = await Agent.pre(chatId, prompt);
=======
	// static async hook(chat: Chat, user: User, params = {}) {
	// 	return Hook.process(chat, user, params);
	// }

	static async processIncremental(chat: string, params: IParams, user: User) {
		const prompt = params.content;

		// Call preProcessor
		const { specs, error } = await ActivityAgent.pre(chat, prompt, user);
>>>>>>> origin/dev:modules/business/agent/activity/index.ts
		if (error) return { status: false, error };

		const promptTemplate = new PromptTemplateExecutor(specs);
		const execution = promptTemplate.incremental();

		async function* iterator(): AsyncIterable<{ chunk?: string; metadata?: IMetadata }> {
			let answer = '';
			const metadata: IMetadata = { objectives: [] };
			for await (const part of execution) {
				if (part.error) metadata.error = part.error;

				const chunk = part.chunk?.replace('ÿ', 'y').replace('😸', '😺').replace('🖋️', '✒️');

				// Yield the answer of the response of a function, but only compute the chunks for the answer of the answer
				if (chunk || part.function) yield { chunk: chunk ? chunk : part.function.content };

				answer += chunk ? chunk : '';
				// Yield the delimiter character because the llm metadata arrived
				if (part.metadata) yield { chunk: 'ÿ' };
			}

			// Call postProcessor
<<<<<<< HEAD:modules/business/agent-v2/index.ts
			const response = await Agent.post(chat, prompt, answer);
=======
			const response = await ActivityAgent.post(chat, prompt, answer, user);
>>>>>>> origin/dev:modules/business/agent/activity/index.ts
			if (response.error) metadata.error = response.error;

			response.credits && (metadata.credits = response.credits);
			response.ipe &&
				response.ipe?.forEach(ipe => {
					if (ipe.key !== 'progress') return;
					const { objectives } = ipe.response;
					if (!objectives) return;
					metadata.objectives = objectives.map(o => ({
						name: o.name,
						status: o.status,
						relevance: o.relevance
					}));
				});

			yield { metadata };
		}

		return { status: true, iterator: iterator() };
	}

	static async processRealtime(chatId: string, params: IParams) {}
}
