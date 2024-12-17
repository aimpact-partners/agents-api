import { BusinessErrorManager } from '@aimpact/agents-api/business/errors';
import type { IncrementalResponseType, IResolvedTool, ResponseType } from '@aimpact/agents-api/models/open-ai/caller';
import { MessagesType, OpenAICaller } from '@aimpact/agents-api/models/open-ai/caller';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { PromptTemplateProcessor } from './templates/processor';
// import type { IToolSpecs } from './tools';
// import { Tools } from './tools';

export /*bundle*/ interface IPromptExecutionParams {
	category: string;
	name: string;
	language: string;
	model: string;
	temperature: number;
	// tools?: IToolSpecs[];
	messages?: MessagesType;
	format?: 'text' | 'json';
	options?: Record<string, string>;
	literals?: Record<string, string>;
}

/**
 * The prompt executor is used both for Generative AI and for Conversational AI
 * Both uses chat completions Open AI API
 */
export /*bundle*/ class PromptTemplateExecutor {
	#messages: MessagesType;
	get messages() {
		return this.#messages;
	}

	#model: string;
	get model() {
		return this.#model;
	}

	#temperature: number;
	get temperature() {
		return this.#temperature;
	}

	// #tools: IToolSpecs[];

	#prompt: PromptTemplateProcessor;
	get prompt() {
		return this.#prompt;
	}

	#format: 'text' | 'json';
	get format() {
		return this.#format;
	}

	constructor(params: IPromptExecutionParams) {
		this.#model = params.model;
		this.#temperature = params.temperature;
		// this.#tools = params.tools;
		this.#format = params.format;
		this.#messages = params.messages ? params.messages : [];

		this.#prompt = new PromptTemplateProcessor(params);
	}

	async #prepare(): Promise<
		Partial<{
			error: BusinessErrorManager;
			prompt: PromptTemplateProcessor;
			messages: MessagesType;
			model: string;
			temperature: number;
			// tools: Tools;
			format: 'text' | 'json';
		}>
	> {
		const prompt = this.#prompt;
		await prompt.process();
		if (prompt.error) return { error: prompt.error };

		const { model, temperature } = this;
		const messages = this.#messages;

		// If messages is empty, the prompt is considered to be used for Generative AI.
		// If there are messages, then the prompt is considered the 'system' or 'assistant mission' in
		// a conversation with an AI assistant.
		messages.length
			? messages.unshift({ role: 'system', content: prompt.value })
			: messages.push({ role: 'user', content: prompt.value });

		// const tools = new Tools(prompt.tools, this.#tools);
		const format = this.#format;

		return { prompt, model, temperature, messages, format };
	}

	async execute(): ResponseType {
		const { error, prompt, messages, model, temperature, format } = await this.#prepare();
		if (error) return new BusinessResponse({ error });

		// Call Open AI to generate the response of the prompt
		// @todo Add code to support tools in cases of non-incremental executions
		let content: string;
		while (true) {
			const response = await OpenAICaller.generate({
				model,
				temperature,
				messages,
				// tools: prompt.tools,
				response: { format }
			});
			content = response.data.content;
			break;
		}

		return new BusinessResponse({ data: { content } });
	}

	async *incremental(): IncrementalResponseType {
		const { error, prompt, messages, model, temperature, format } = await this.#prepare();
		if (error) return new BusinessResponse({ error });

		// Call Open AI to generate the response of the prompt
		// The iterator can return a tool call of a chunk
		// Keep iterating while the query returns a tool call
		while (true) {
			const iterator = OpenAICaller.incremental({
				model,
				temperature,
				messages,
				// tools: prompt.tools,
				response: { format }
			});
			for await (const data of iterator) {
				yield data;
			}

			let tool: IResolvedTool;
			for await (const { tool: resolvedTool, chunk } of iterator) {
				if (resolvedTool) {
					tool = resolvedTool;
					break;
				}

				yield { chunk };
			}
			if (!tool) return;

			// Notify the use of the tool
			// yield { fnc: '😸' + JSON.stringify({ type: 'tool', data: fnc }) + '🖋️' };

			// Add the tool to the messages array
			messages.push({
				role: 'assistant',
				content: null,
				function_call: {
					name: tool.name,
					arguments: tool.params
				}
			});

			// Execute the tool
			// const response = await tool.execute(tool);

			// Notify the tool response
			// yield { fnc: '😸' + JSON.stringify({ type: 'kb-response', data: response }) + '🖋️' };

			// Add the tool response to the messages array
			// messages.push({
			// 	role: 'function',
			// 	name: tool.name,
			// 	content: response
			// });
		}
	}
}
