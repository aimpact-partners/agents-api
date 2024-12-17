import type {
	IConversationItemCreatedServerEvent,
	IConversationItemTruncatedServerEvent,
	IResponseAudioDeltaServerEvent,
	IResponseContentPartAddedServerEvent
} from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import { RealtimeUtils } from '@aimpact/agents-api/realtime/utils';
import { Events } from '@beyond-js/events/events';

export class ConversationItemAudio extends Events {
	#frequency: number;
	get frequency() {
		return this.#frequency;
	}

	#value: Int16Array = new Int16Array(0);
	get value() {
		return this.#value;
	}

	constructor(frequency?: number) {
		super();
		this.#frequency = frequency;
	}

	truncated(event: IConversationItemTruncatedServerEvent) {
		const { audio_end_ms } = event;

		// Calculate the end index for truncating the audio based on the frequency
		const endIndex = Math.floor((audio_end_ms * this.#frequency) / 1000);
		this.#value = this.#value.slice(0, endIndex); // Truncate the audio
	}

	#merge(audio: string) {
		const buffer = RealtimeUtils.base64ToArrayBuffer(audio);
		const append = new Int16Array(buffer);
		this.#value = RealtimeUtils.mergeInt16Arrays(this.#value, append);
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
				if (content.type !== 'audio' && content.type !== 'input_audio') return;
				content.audio && this.#merge(content.audio);
			});
		}
	}

	/**
	 * When a new content part is added to an assistant message item during response generation.
	 * @param event
	 */
	contentPartAdded(event: IResponseContentPartAddedServerEvent) {
		if (!event.part.audio) return;

		this.#merge(event.part.audio);
		this.trigger('audio.delta', { audio: event.part.audio });
	}

	audioDelta(event: IResponseAudioDeltaServerEvent) {
		this.#merge(event.delta);
		this.trigger('audio.delta', { audio: event.delta });
	}
}
