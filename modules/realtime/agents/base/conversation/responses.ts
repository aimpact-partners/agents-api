import type { Conversation } from '.';
import type {
	IResponseCreatedServerEvent,
	IResponseOutputItemAddedServerEvent
} from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import { ConversationResponse } from './response';
import { Events } from '@beyond-js/events/events';

export class ConversationResponses extends Events {
	#conversation: Conversation;

	#lookup: Map<string, ConversationResponse> = new Map();
	get lookup() {
		return this.#lookup;
	}

	has(id: string): boolean {
		return this.#lookup.has(id);
	}

	get(id: string): ConversationResponse {
		return this.#lookup.get(id);
	}

	delete(id: string): boolean {
		if (!this.#lookup.has(id)) return false;
		this.#lookup.delete(id);
	}

	constructor(conversation: Conversation) {
		super();

		this.#conversation = conversation;
		const { session } = conversation.agent;
		session.on('response.created', this.created.bind(this));
	}

	// Create a response from the server
	create() {
		this.#conversation.speech.commit();

		const { agent } = this.#conversation;
		agent.session.send('response.create');
		return true;
	}

	created(event: IResponseCreatedServerEvent) {
		if (this.#lookup.has(event.response.id)) return;

		const response = new ConversationResponse(this.#conversation);
		this.#lookup.set(event.response.id, response);
		response.created(event);
	}
}
