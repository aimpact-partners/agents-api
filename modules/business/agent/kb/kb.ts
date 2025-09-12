import { User } from '@aimpact/agents-api/business/user';
import { Chat } from '@aimpact/agents-api/business/agent/chat';
import { hook } from '@aimpact/agents-api/business/agent/hook';

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

export /*bundle*/ class KBAgent {
	// PreProcessor
	static async pre(chat: IAgentChat, prompt: string, user: User) {
		// Fetch the agent
		const response = await hook(chat, user, { prompt, language: chat.language });
		if (response.error) return { error: response.error };

		console.log('response AGENT', response.data);
		console.log('response AGENT 2', chat.project.agent);

		// const { specs, error } = await KB.process(chat, prompt, user);
		return { specs: response.data };
	}

	// PostProcessor
	static async post(chat: Chat, prompt: string, answer: string, user: User) {
		// const response = await IPE.process(chat, prompt, answer, user);
		// if (response.error) return { error: response.error };

		// const { ipe } = response;
		// const hookSpecs = { ipe, prompt, answer, testing: chat.testing };
		// const hookResponse = await hook(chat, user, hookSpecs);
		// if (hookResponse.error) return { error: hookResponse.error };

		// Store messages
		console.log('store ', prompt, answer);
		await chat.storeInteration({ prompt, answer, ipe: [] });
		if (chat.error) return { error: chat.error };

		return { credits: { total: 100, consumed: 1 } };
	}

	static async processIncremental(chat: string, params: IParams, user: User) {
		const prompt = params.content;

		console.log('prompt', prompt);
		// Call preProcessor
		const { specs, error } = await KBAgent.pre(chat, prompt, user);
		if (error) return { status: false, error };

		console.log('specs', specs);

		// Convert specs.output string into chunks of fixed size
		const chunkSize = 50; // Tamaño fijo para cada chunk
		const outputText = specs.output || '';

		async function* iterator(): AsyncIterable<{ chunk?: string; metadata?: IMetadata }> {
			let answer = '';
			const metadata: IMetadata = {};

			// Dividir el texto en chunks de tamaño fijo
			for (let i = 0; i < outputText.length; i += chunkSize) {
				const chunk = outputText.slice(i, i + chunkSize);

				// Aplicar los mismos reemplazos que en el código original
				const processedChunk = chunk.replace('ÿ', 'y').replace('😸', '😺').replace('🖋️', '✒️');

				// Simular un pequeño delay para mantener la experiencia incremental
				await new Promise(resolve => setTimeout(resolve, 10));

				// Yield el chunk procesado
				yield { chunk: processedChunk };

				answer += processedChunk;
			}

			yield { chunk: 'ÿ' };

			// Call postProcessor
			const response = await KBAgent.post(chat, prompt, outputText, user);
			if (response.error) metadata.error = response.error;

			response.credits && (metadata.credits = response.credits);
			yield { metadata };
		}

		return { status: true, iterator: iterator() };
	}
}
