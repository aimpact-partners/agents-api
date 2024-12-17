import type { Conversation } from '..';
import type { IInputAudioBufferSpeechStartedServerEvent } from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import type { IUserSpeechStartedEvent } from '@aimpact/agents-api/realtime/interfaces/agent-events';
import { SpeechStorage } from './storage';
import { RealtimeUtils } from '@aimpact/agents-api/realtime/utils';
import { CurrentUserSpeech } from './current';

export class Speech {
	#conversation: Conversation;
	#storage: SpeechStorage;
	#current: CurrentUserSpeech;

	constructor(conversation: Conversation) {
		this.#conversation = conversation;
		this.#storage = new SpeechStorage(conversation);
		this.#current = new CurrentUserSpeech(conversation);
	}

	append(chunk: Int16Array) {
		if (chunk.byteLength === 0) return;

		const { session } = this.#conversation.agent;
		session.send('input_audio_buffer.append', { audio: RealtimeUtils.arrayBufferToBase64(chunk) });

		this.#current.append(chunk);
		this.#storage.append(chunk);
	}

	flush() {
		this.#storage.flush();
	}

	commit() {
		this.#current.commit();
	}

	onStarted(event: IInputAudioBufferSpeechStartedServerEvent) {
		/**
		 * Trigger event to notify speech started detected
		 */
		const { agent } = this.#conversation;
		const data: IUserSpeechStartedEvent = { item: { id: event.item_id } };
		agent.trigger('user.speech.started', data);
	}
}
