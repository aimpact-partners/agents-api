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

const JSON_MODE_DIRECTIVE =
	'STRICT_JSON_OUTPUT: Respond with a single valid json value only. ' +
	'Do not include markdown, code fences, natural language, prefixes, or trailing commentary. ' +
	'Start the response with `{` or `[` and end with the matching closing bracket. ' +
	'Example shape (actual keys/structure depend on the task): {"key":"value"}.';

const JSON_SCHEMA_DIRECTIVE_HEADER =
	'STRICT_JSON_SCHEMA: Your response MUST be a single JSON value that exactly matches the schema below. ' +
	'Return every required field using the exact field names, respecting types, enums, and array/object shapes. ' +
	'When the schema declares `type: "array"`, return a JSON array (not an object keyed by name). ' +
	'Do not include markdown, code fences, natural language, prefixes, or trailing commentary.';

function extractJson(raw: string): string {
	if (!raw) return raw;
	let cleaned = raw.trim();
	// Strip surrounding markdown fences if present
	cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
	// Slice from the first opening bracket to the last matching closing bracket
	const firstObj = cleaned.indexOf('{');
	const firstArr = cleaned.indexOf('[');
	const candidates = [firstObj, firstArr].filter(i => i !== -1);
	if (!candidates.length) return cleaned;
	const start = Math.min(...candidates);
	const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
	if (end <= start) return cleaned;
	return cleaned.slice(start, end + 1);
}

function ensureJsonDirective(messages: IQueryExecutionParams['messages']) {
	// DeepSeek rejects `response_format: json_object` unless the prompt mentions "json".
	const alreadyRequested = messages.some(m => typeof (m as any)?.content === 'string' && (m as any).content.toLowerCase().includes('json'));
	if (alreadyRequested) return;

	const first = messages[0] as any;
	if (first?.role === 'system' && typeof first.content === 'string') {
		first.content = `${first.content}\n\n${JSON_MODE_DIRECTIVE}`;
		return;
	}

	messages.unshift({ role: 'system', content: JSON_MODE_DIRECTIVE } as any);
}

function ensureSchemaDirective(messages: IQueryExecutionParams['messages'], schema: Record<string, any>) {
	// DeepSeek does not support `response_format: json_schema` natively.
	// We inject the schema as a system-level instruction so the model sees the same contract OpenAI sees.
	if (!schema) return;
	const directive = `${JSON_SCHEMA_DIRECTIVE_HEADER}\n\nJSON Schema:\n${JSON.stringify(schema, null, 2)}`;

	const first = messages[0] as any;
	if (first?.role === 'system' && typeof first.content === 'string') {
		first.content = `${first.content}\n\n${directive}`;
		return;
	}

	messages.unshift({ role: 'system', content: directive } as any);
}

function applyJsonDirective(messages: IQueryExecutionParams['messages'], params: IQueryExecutionParams) {
	const schemaRequested =
		params.responseFormat === 'json_schema' ||
		params.response?.format === 'json_schema' ||
		params.format === 'json_schema';
	if (schemaRequested && params.schema) {
		ensureSchemaDirective(messages, params.schema);
		return;
	}
	ensureJsonDirective(messages);
}

export /*bundle*/ class DeepSeekCaller {
	static async *incremental(params: IQueryExecutionParams): IncrementalResponseType {
		const { messages, model, temperature, tools, browser } = params;

		let tool: IResolvedTool | undefined = void 0;

		const format = (() => {
			const { format, responseFormat, response: responseOpts } = params;
			let formatValue: FormatResponse = { type: 'text' };
			if (
				responseFormat === 'json' ||
				format === 'json' ||
				responseFormat === 'json_schema' ||
				format === 'json_schema' ||
				responseOpts?.format === 'json' ||
				responseOpts?.format === 'json_schema'
			) {
				formatValue = { type: 'json_object' };
			}
			return formatValue;
		})();

		if (format.type === 'json_object') applyJsonDirective(messages, params);

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

		if (format.type === 'json_object') applyJsonDirective(messages, params);

		while (retries < MAX_RETRIES) {
			try {
				const request = {
					model,
					temperature,
					messages,
					response_format: format
				};
				console.log('[LLM:deepseek][request] ->', JSON.stringify(request, null, 2));

				const response = await openai.chat.completions.create(request);
				console.log('[LLM:deepseek][response] <-', JSON.stringify(response, null, 2));

				let { content } = response.choices[0].message;
				content = content ?? '';

				if (format.type === 'json_object') {
					const candidate = extractJson(content);
					try {
						JSON.parse(candidate);
						content = candidate;
					} catch (parseExc) {
						console.error('DeepSeek returned invalid JSON, retrying', { attempt: retries + 1, content });
						retries++;
						await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
						continue;
					}
				}

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
