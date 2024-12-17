import type {
	IAgentItemCreatedEvent,
	IAgentItemAudioDeltaEvent,
	IUserSpeechStartedEvent
} from '@aimpact/agents-api/realtime/interfaces/agent-events';
import { ConversationItems } from './items';

export /*bundle*/ class Conversation {
	#id: string;
	get id() {
		return this.#id;
	}

	#items = new ConversationItems();
	get items() {
		return this.#items;
	}

	constructor(id: string) {
		this.#id = id;
	}

	async fetch() {}

	#onSpeechStarted(data: IUserSpeechStartedEvent) {}

	_process(event: string, data: any, delta?: Int16Array) {
		switch (event) {
			case 'conversation.item.created':
				this.#items.process(event, data);
				break;
			case 'conversation.item.audio.delta':
				this.#items.process(event, data, delta);
				break;
			case 'user.speech.started':
				this.#onSpeechStarted(data);
				break;
		}
	}
}
