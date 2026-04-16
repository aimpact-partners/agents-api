import { BusinessErrorManager, ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { key } from '@aimpact/agents-api/business/models/deepseek/key';
import type {
	IIncrementalResponseMetadata,
	IQueryExecutionParams,
	IResolvedTool,
	IncrementalResponseType,
	ResponseType
} from '@aimpact/agents-api/business/models/types';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import OpenAI from 'openai';

type FormatResponse = OpenAI.ResponseFormatText | OpenAI.ResponseFormatJSONObject;

export /*bundle*/ class DeepSeekCaller {
	static async *incremental(params: IQueryExecutionParams): IncrementalResponseType {
		const { messages, model, temperature, tools, browser } = params;

		let tool: IResolvedTool | undefined = void 0;

		const format = (() => {
			const { format, responseFormat } = params;
			let response: FormatResponse = { type: 'text' };
			if (
				responseFormat === 'json' ||
				format === 'json' ||
				responseFormat === 'json_schema' ||
				format === 'json_schema'
			) {
				response = { type: 'json_object' };
			}
			return response;
		})();

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
		const { messages, model, temperature } = params;

		const MAX_RETRIES = 5;
		const RETRY_INTERVAL = 5000;

		let retries = 0;

		const apiKey = await key.get();
		const openai = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' });

		const format = (() => {
			const { response, responseFormat } = params;

			let responseFormatValue: FormatResponse = { type: 'text' };
			if (
				responseFormat === 'json' ||
				response?.format === 'json' ||
				responseFormat === 'json_schema' ||
				response?.format === 'json_schema'
			) {
				responseFormatValue = { type: 'json_object' };
			}
			return responseFormatValue;
		})();

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
