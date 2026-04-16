import { BusinessErrorManager, ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { key } from '@aimpact/agents-api/business/models/deepseek/key';
import type {
	IIncrementalResponseMetadata,
	IQueryExecutionParams,
	IResolvedTool,
	IncrementalResponseType,
	MessagesType,
	ResponseType
} from '@aimpact/agents-api/business/models/types';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import OpenAI from 'openai';

type FormatResponse = OpenAI.ResponseFormatText | OpenAI.ResponseFormatJSONObject;

const JSON_INSTRUCTION = 'Respond with a valid JSON object.';

/**
 * DeepSeek requires the word "json" to appear somewhere in the prompt
 * when using response_format: json_object. This helper ensures that
 * constraint is met without modifying the original messages array.
 */
function ensureJsonInstruction(messages: MessagesType): MessagesType {
	const hasJsonHint = messages.some(m => {
		const content = typeof m.content === 'string' ? m.content : '';
		return content.toLowerCase().includes('json');
	});

	if (hasJsonHint) return messages;

	// Insert a new system message to avoid mutating existing instructions.
	return [{ role: 'system', content: JSON_INSTRUCTION }, ...messages] as MessagesType;
}

export /*bundle*/ class DeepSeekCaller {
	static async *incremental(params: IQueryExecutionParams): IncrementalResponseType {
		const { model, temperature, tools, browser } = params;

		let tool: IResolvedTool | undefined = void 0;

		const isJson = (() => {
			const { format, responseFormat } = params;
			return (
				format === 'json' ||
				format === 'json_schema' ||
				responseFormat === 'json' ||
				responseFormat === 'json_schema'
			);
		})();

		const format: FormatResponse = isJson ? { type: 'json_object' } : { type: 'text' };
		const messages = isJson ? ensureJsonInstruction(params.messages) : params.messages;

		try {
			const apiKey = await key.get();
			const openai = new OpenAI({
				apiKey,
				baseURL: 'https://api.deepseek.com',
				dangerouslyAllowBrowser: !!browser
			});

			const stream = await openai.chat.completions.create({
				model,
				temperature,
				messages,
				functions: tools,
				stream: true,
				response_format: format
			});
			let content = '';

			for await (const part of stream) {
				const choice = part.choices[0];

				if (choice.delta?.function_call) {
					if (!tool) {
						const { name } = choice.delta.function_call;
						tool = { name, params: '' };
					}

					const { arguments: toolParams } = choice.delta.function_call!;
					tool.params += toolParams;
				} else {
					const chunk = choice.delta?.content;
					content += chunk ? chunk : '';
					if (chunk) yield { chunk };
				}

				const finish = choice.finish_reason;
				if (finish) {
					if (!tool) {
						messages.push({ role: 'assistant', content });
						const responseMetadata: IIncrementalResponseMetadata = { content, messages, finish };
						yield { metadata: responseMetadata };
					} else {
						yield { tool };
						const { response } = tool;

						if (!response) {
							yield { metadata: { content, messages, finish: 'paused' } };
							return;
						}

						if (response?.content) {
							messages.push({ role: 'function', name: tool.name, content: response.content });
							yield* this.incremental({ ...params, messages });
						} else {
							yield { error: ErrorGenerator.functionExecutionError(tool) };
						}
					}
					break;
				}
			}
		} catch (exc) {
			console.error(exc);
			const error = ErrorGenerator.llmGenerationError(exc as Error);
			yield { error };
		}
	}

	static async generate(params: IQueryExecutionParams): ResponseType {
		const { model, temperature } = params;

		const MAX_RETRIES = 5;
		const RETRY_INTERVAL = 5000;

		let retries = 0;

		const apiKey = await key.get();
		const openai = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' });

		const isJson = (() => {
			const { response, responseFormat } = params;
			return (
				responseFormat === 'json' ||
				response?.format === 'json' ||
				responseFormat === 'json_schema' ||
				response?.format === 'json_schema'
			);
		})();

		const format: FormatResponse = isJson ? { type: 'json_object' } : { type: 'text' };
		const messages = isJson ? ensureJsonInstruction(params.messages) : params.messages;

		while (retries < MAX_RETRIES) {
			try {
				const response = await openai.chat.completions.create({
					model,
					temperature,
					messages,
					response_format: format
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

		const error: BusinessErrorManager = ErrorGenerator.llmGenerationError();
		return new BusinessResponse({ error });
	}
}
