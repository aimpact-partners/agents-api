import type OAI from 'openai';
import type { IUser } from '@aimpact/agents-client/users';
import { PromptTemplateExecutor, MessagesType } from '@aimpact/agents-client/prompts';

interface ILastMessages {
	content: string;
	role: OAI.Chat.ChatCompletionRole;
	synthesis?: string;
}

export /*bundle*/ interface IAgentRequestParams {
	chatId: string;
	language: string;
	user: IUser;
	messages: { last: ILastMessages[]; count: number };
	synthesis?: string;
	prompt: string;
	project: string;
	metadata: any;
}

export /*bundle*/ interface IAgentRequestProcessParams extends IAgentRequestParams {
	system: { prompt: { category: string; name: string } };
	model: string;
	temperature: number;
	literals: Record<string, string>;
	responseFormat?: 'text' | 'json';
	summary: { prompt: { category: string; name: string }; literals: Record<string, string> };
}

export /*bundle*/ type AgentResponseType = AsyncGenerator<{
	chunk?: string;
	metadata?: { synthesis: string; answer: string; error?: string };
}>;

export /*bundle*/ abstract class Agent {
	abstract sendMessage(params: IAgentRequestParams): AgentResponseType;

	async *processMessage(params: IAgentRequestProcessParams): AgentResponseType {
		const { system, language, model, temperature, literals, responseFormat } = params;
		const { category, name } = system.prompt;

		let previous: string = '';
		const messages: MessagesType = params.messages.last.map((message: ILastMessages) => {
			const data = { role: message.role, content: message.content };

			if (message.role === 'assistant') {
				previous = message.synthesis;
				return <OAI.ChatCompletionAssistantMessageParam>data;
			} else if (message.role === 'user') return <OAI.ChatCompletionUserMessageParam>data;
			else if (message.role === 'tool') return <OAI.ChatCompletionToolMessageParam>data;
			else if (message.role === 'system') return <OAI.ChatCompletionSystemMessageParam>data;
			else if (message.role === 'function') return <OAI.ChatCompletionFunctionMessageParam>data;
		});

		messages.push({ role: 'user', content: params.prompt });

		// Process the agent's answer
		let promptExecutor: PromptTemplateExecutor;
		promptExecutor = new PromptTemplateExecutor({
			messages,
			category,
			name,
			language,
			model,
			temperature,
			literals,
			responseFormat
		});
		const iterator = promptExecutor.incremental();

		const metadata = { synthesis: '', answer: '', objectives: '' };
		for await (const part of iterator) {
			const chunk = part.chunk?.replace('ÿ', 'y').replace('😸', '😺').replace('🖋️', '✒️');

			// Yield the answer of the response of a function, but only compute the chunks for the answer of the answer
			if (chunk || part.fnc) yield { chunk: chunk ? chunk : part.fnc.name };
			metadata.answer += chunk ? chunk : '';
		}

		// Process the synthesis
		promptExecutor = new PromptTemplateExecutor({
			category: 'agents',
			name: params.summary.prompt.name,
			model,
			temperature: 1,
			language,
			literals: { answer: metadata.answer, ...params.summary.literals }
		});
		const response = await promptExecutor.execute();

		console.log(' response==', response.data);
		try {
			const responseParsed = JSON.parse(response.data.content);
			console.log(' response parsed ==', responseParsed);

			const { summary, progress } = responseParsed;

			metadata.synthesis = summary;
			metadata.progress = JSON.stringify(progress);

			console.log('PARSE==', metadata);
		} catch (exc) {
			console.log('exc==', exc);
		}

		console.log('metadata response ==', metadata);

		yield { metadata };
	}
}
