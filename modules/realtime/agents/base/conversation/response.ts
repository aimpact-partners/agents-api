import type { Conversation } from '.';
import type {
	IResponseCreatedServerEvent,
	IResponseOutputItemAddedServerEvent
} from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import { Events } from '@beyond-js/events/events';

export class ConversationResponse extends Events {
	#conversation: Conversation;

	#id: string;
	get id() {
		return this.#id;
	}

	#status: string;
	get status() {
		return this.#status;
	}

	#usage = { inputTokens: 0, outputTokens: 0 };
	get usage() {
		return this.#usage;
	}

	constructor(conversation: Conversation) {
		super();
		this.#conversation = conversation;
	}

	created(event: IResponseCreatedServerEvent) {
		const { id, usage } = event.response;
		this.#id = id;

		this.#usage.inputTokens = usage?.input_tokens ? usage.input_tokens : 0;
		this.#usage.outputTokens = usage?.output_tokens ? usage.input_tokens : 0;
	}
}
