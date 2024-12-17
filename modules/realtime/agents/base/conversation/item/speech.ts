import type { IInputAudioBufferSpeechStoppedServerEvent } from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import type { ConversationItemAudio } from './audio';

export class ConversationItemSpeech {
	#input: ConversationItemAudio;

	#start: number;
	get start() {
		return this.#start;
	}

	#end: number;
	get end() {
		return this.#end;
	}

	#value: Int16Array;
	get value() {
		return this.#value;
	}

	constructor(input: ConversationItemAudio, start: number) {
		this.#input = input;
		this.#start = start;
	}

	stopped(event: IInputAudioBufferSpeechStoppedServerEvent, audio: Int16Array) {
		this.#end = event.audio_end_ms;

		if (audio) {
			// Calculate start and end indices for slicing the audio buffer
			const start = Math.floor((this.#start * this.#input.frequency) / 1000);
			const end = Math.floor((this.#end * this.#input.frequency) / 1000);

			// Extract the audio segment and assign it to the speech item
			this.#value = this.#input.value.slice(start, end);
		}
	}
}
