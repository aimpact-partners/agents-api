import type {
	IAgentItemCreatedEvent,
	IAgentItem,
	IAgentItemAudioDeltaEvent,
	IUserSpeechStartedEvent
} from '@aimpact/agents-api/realtime/interfaces/agent-events';
import { Events } from '@beyond-js/events/events';
import { Item } from './item';

export class ConversationItems extends Events {
	#values: IAgentItem[] = [];
	get values() {
		return this.#values;
	}

	#lookup: Map<string, Item> = new Map();

	#onItemCreated(data: IAgentItemCreatedEvent) {
		const item = new Item(data.item);

		this.#values.push(item);
		this.#lookup.set(item.id, item);
		this.trigger('change');
	}

	#onItemAudioDelta(data: IAgentItemAudioDeltaEvent, delta: Int16Array) {
		if (!this.#lookup.has(data.item.id)) {
			console.warn(`Item "${data.item.id}" not found on onItemAudioDelta event`);
			return;
		}

		const item = this.#lookup.get(data.item.id);
		item.onAudioDelta(data, delta);
	}

	#onSpeechStarted(data: IUserSpeechStartedEvent) {
		if (!this.#lookup.has(data.item.id)) {
			console.warn(`Item "${data.item.id}" not found on onItemAudioDelta event`);
			return;
		}

		const item = this.#lookup.get(data.item.id);
		item.onSpeechStarted(data);
	}

	process(event: string, data: any, delta?: Int16Array) {
		switch (event) {
			case 'conversation.item.created':
				this.#onItemCreated(data);
				break;
			case 'conversation.item.audio.delta':
				this.#onItemAudioDelta(data, delta);
				break;
			case 'user.speech.started':
				this.#onSpeechStarted(data);
				break;
		}
	}
}
