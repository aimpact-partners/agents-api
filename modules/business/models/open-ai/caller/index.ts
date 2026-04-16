import { key } from '@aimpact/agents-api/business/models/open-ai/key';
import type {
	IQueryExecutionParams,
	IResolvedTool,
	IncrementalResponseType,
	ResponseType
} from '@aimpact/agents-api/business/models/types';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import OpenAI from 'openai';

export type {
	AgentTool,
	IIncrementalResponse,
	IIncrementalResponseMetadata,
	IQueryExecutionParams,
	IResolvedTool,
	IncrementalResponseType,
	MessagesType,
	ResponseType
} from '@aimpact/agents-api/business/models/types';

type FormatResponse = OpenAI.ResponseFormatText | OpenAI.ResponseFormatJSONObject | OpenAI.ResponseFormatJSONSchema;

// Define the OpenAICaller class for handling OpenAI API calls
export /*bundle*/ class OpenAICaller {
	/**
	 * Processes responses from the OpenAI API incrementally.
	 * This method handles both regular content and tools that need to be executed.
	 * @param params - The parameters for the query execution.
	 * @returns An async generator yielding incremental responses.
	 */
	static async *incremental(params: IQueryExecutionParams): IncrementalResponseType {
		const { messages, model, temperature, tools, browser, store, metadata } = params;

		let tool: IResolvedTool | undefined = void 0;

		// Determine the response format based on provided parameters
		const format = (() => {
			const { format, responseFormat, schema } = params;
			let response: FormatResponse = { type: 'text' };
			if (responseFormat === 'json' || format === 'json') response = { type: 'json_object' };
			if (responseFormat === 'json_schema' || format === 'json_schema')
				response = {
					type: 'json_schema',
					json_schema: {
						name: schema.name,
						description: schema.description ?? undefined,
						schema: schema.schema,
						strict: schema.stict ?? null
					}
				};
			return response;
		})();

		try {
			// Get the API key and initialize the OpenAI client
			const apiKey = await key.get();
			const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: !!browser });
			// Create a stream for chat completions
			const stream = await openai.chat.completions.create({
				model,
				temperature,
				messages,
				functions: tools, // Using functions parameter to describe tools
				stream: true,
				response_format: format,
				store,
				metadata
			});
			let content = '';

			// Process the stream of responses incrementally
			for await (const part of stream) {
				const choice = part.choices[0];

				// Check if a function call is detected in the response
				if (choice.delta?.function_call) {
					if (!tool) {
						// Initialize the tool if detected for the first time
						const { name } = choice.delta.function_call;
						tool = { name, params: '' };
					}

					// Accumulate parameters for the tool function
					const { arguments: params } = choice.delta.function_call!;
					tool.params += params;
				} else {
					// Accumulate content chunks for the regular message
					const chunk = choice.delta?.content;
					content += chunk ? chunk : '';
					if (chunk) yield { chunk };
				}

				const finish = choice.finish_reason;
				if (finish) {
					if (!tool) {
						// Regular message processing
						messages.push({ role: 'assistant', content });
						yield { metadata: { content, messages, finish } };
					} else {
						// Tool detected, yield to consumer for review and function execution
						yield { tool };
						const { response } = tool;

						// Consumer can decide to pause processing here for user feedback
						if (!response) {
							// End processing gracefully to wait for user feedback
							yield { metadata: { content, messages, finish: 'paused' } };
							return;
						}

						// Function executed, add response to messages and optionally continue processing
						if (response?.content) {
							messages.push({ role: 'function', name: tool.name, content: response.content });

							// Continue processing the initial query after handling the tool
							// by calling the incremental method recursively with updated messages.
							yield* this.incremental({ ...params, messages });
						} else {
							// Handle the case where the function was not executed or was cancelled
							yield { error: ErrorGenerator.functionExecutionError(tool) };
						}
					}
					break;
				}
			}
		} catch (exc) {
			console.error(exc);
			yield { error: ErrorGenerator.llmGenerationError() };
		}
	}

	/**
	 * Generates a single response from the OpenAI API.
	 * @param params - The parameters for the query execution.
	 * @returns A promise that resolves to the API response.
	 */
	static async generate(params: IQueryExecutionParams): ResponseType {
		const { messages, model, temperature, store, metadata } = params;

		const MAX_RETRIES = 5;
		const RETRY_INTERVAL = 5000;

		let retries = 0;

		const apiKey = await key.get();
		const openai = new OpenAI({ apiKey });

		// Determine the response format based on provided parameters
		const format = (() => {
			const { response, responseFormat, schema } = params;

			let format: FormatResponse = { type: 'text' };
			if (responseFormat === 'json' || response.format === 'json') format = { type: 'json_object' };
			if (responseFormat === 'json_schema' || response.format === 'json_schema') {
				format = {
					type: 'json_schema',
					json_schema: {
						name: schema.name,
						description: schema.description ?? undefined,
						schema: schema.schema,
						strict: schema.stict ?? null
					}
				};
			}
			return format;
		})();

		// Retry logic for API call
		while (retries < MAX_RETRIES) {
			try {
				const response = await openai.chat.completions.create({
					model,
					temperature,
					messages,
					response_format: format,
					store,
					metadata
				});

				let { content } = response.choices[0].message;
				content = content ?? '';
				return new BusinessResponse({ data: { content } });
			} catch (exc) {
				console.error(exc);
				retries++;
				await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
			}
		}

		return new BusinessResponse({ error: ErrorGenerator.llmGenerationError() });
	}
}
