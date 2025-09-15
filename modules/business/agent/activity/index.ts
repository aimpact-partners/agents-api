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
	static async pre(chat: Chat, prompt: string) {
		// Fetch the agent
		const response = await hook(chat);
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
		const hookResponse = await hook(chat, hookSpecs);
		if (hookResponse.error) return { error: hookResponse.error };

		// Store messages
		await chat.storeInteration({ prompt, answer, ipe });
		if (chat.error) return { error: chat.error };

		return { ipe, credits: hookResponse.data.credits };
	}

	static async processIncremental(chat: Chat, params: IParams) {
		const prompt = params.content;

		// Call preProcessor
		const { specs, error } = await ActivityAgent.pre(chat, prompt);
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
			const response = await ActivityAgent.post(chat, prompt, answer);
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
