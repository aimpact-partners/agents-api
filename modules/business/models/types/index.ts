import type { BusinessErrorManager } from '@aimpact/agents-api/business/errors';
import type { BusinessResponse } from '@aimpact/agents-api/business/response';
import type OpenAI from 'openai';

export /*bundle*/ type MessagesType = Omit<OpenAI.Chat.ChatCompletionMessageParam[], 'name'>;

export /*bundle*/ interface AgentTool {
	name: string;
	description: string;
	parameters: {
		type: string;
		properties: Record<string, { type: string }>;
		required?: string[];
	};
}

export /*bundle*/ interface IQueryExecutionParams {
	model: string;
	temperature?: number;
	messages: MessagesType;
	tools?: AgentTool[];
	response?: { format: string };
	browser?: boolean;
	format?: 'text' | 'json' | 'json_schema';
	store?: boolean | null;
	metadata?: Record<string, string>;
	schema?: Record<string, any>;

	/**
	 * @deprecated Use `response.format` instead.
	 */
	responseFormat?: 'text' | 'json' | 'json_schema';
}

export /*bundle*/ interface IResolvedTool {
	name: string;
	params: string;
	response?: { content: string };
}

export /*bundle*/ interface IIncrementalResponse {
	chunk?: string;
	tool?: IResolvedTool;
	function?: { content: string } | null;
	error?: BusinessErrorManager;
	metadata?: IIncrementalResponseMetadata;
}

export /*bundle*/ type IncrementalResponseType = AsyncGenerator<IIncrementalResponse>;

export /*bundle*/ type ResponseType = Promise<BusinessResponse<{ content: string }>>;

export /*bundle*/ interface IIncrementalResponseMetadata {
	content?: string;
	finish: string;
	messages: MessagesType;
}

export /*bundle*/ interface IModelCaller {
	generate(params: IQueryExecutionParams): ResponseType;
	incremental(params: IQueryExecutionParams): IncrementalResponseType;
}
