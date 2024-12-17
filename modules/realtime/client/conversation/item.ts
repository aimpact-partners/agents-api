import type {
	IAgentItem,
	IAgentItemAudioDeltaEvent,
	IUserSpeechStartedEvent
} from '@aimpact/agents-api/realtime/interfaces/agent-events';
import { RealtimeUtils } from '@aimpact/agents-api/realtime/utils';

export class Item {
	#id: string;
	get id() {
		return this.#id;
	}

	#type: 'message' | 'function_call';
	get type() {
		return this.#type;
	}

	#role: 'user' | 'assistant' | 'function_call' | 'function_output';
	get role() {
		return this.#role;
	}

	#audio: Int16Array;
	get audio() {
		return this.#audio;
	}

	constructor(data: IAgentItem) {
		this.#id = data.id;
		this.#type = data.type;
		this.#role = data.role;
	}

	onAudioDelta(data: IAgentItemAudioDeltaEvent, delta?: Int16Array) {
		this.#audio = this.#audio ? RealtimeUtils.mergeInt16Arrays(this.#audio, delta) : delta;
	}

	/**
	 * This method can be useful in the future to store in memory in the client the audio of the item sent
	 * by the user when speaking
	 * @param data
	 */
	onSpeechStarted(data: IUserSpeechStartedEvent) {}
}
