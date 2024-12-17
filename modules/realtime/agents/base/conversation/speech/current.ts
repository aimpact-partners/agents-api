import type { Conversation } from '..';

export class CurrentUserSpeech {
	#conversation: Conversation;
	#length = 0;

	constructor(conversation: Conversation) {
		this.#conversation = conversation;
	}

	commit() {
		const { agent } = this.#conversation;
		const { vad } = agent; // Voice audio detection

		vad && this.#length > 0 && agent.session.send('input_audio_buffer.commit');
		this.#length = 0;
	}

	append(chunk: Int16Array) {
		this.#length += chunk.byteLength;
	}
}
