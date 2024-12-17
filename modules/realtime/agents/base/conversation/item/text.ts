import type {
	IConversationItemCreatedServerEvent,
	IResponseContentPartAddedServerEvent,
	IResponseTextDeltaServerEvent
} from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import { Events } from '@beyond-js/events/events';

export class ConversationItemText extends Events {
	#frequency: number;
	get frequency() {
		return this.#frequency;
	}

	#value = '';
	get value() {
		return this.#value;
	}

	constructor(frequency?: number) {
		super();
		this.#frequency = frequency;
	}

	/**
	 * When a conversation item is created.
	 * There are several scenarios that produce this event:
	 *
	 * @param event
	 */
	created(event: IConversationItemCreatedServerEvent) {
		// Populate formatted text if it comes out on creation
		if (event.item.type === 'message' && event.item.content) {
			event.item.content.forEach(content => {
				if (content.type !== 'text' && content.type !== 'input_text') return;
				this.#value += content.text;
			});
		}
	}

	/**
	 * When a new content part is added to an assistant message item during response generation.
	 * @param event
	 */
	contentPartAdded(event: IResponseContentPartAddedServerEvent) {
		if (event.part.type !== 'text') return;

		this.#value += event.part.text;
	}

	/**
	 * Returned when the text value of a "text" content part is updated.
	 * @param event
	 */
	textDelta(event: IResponseTextDeltaServerEvent) {
		this.#value += event.delta;
		this.trigger('text.delta', { audio: event.delta });
	}
}
