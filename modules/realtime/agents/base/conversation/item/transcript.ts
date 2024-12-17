import type {
	IConversationInputAudioTranscriptionCompletedServerEvent,
	IResponseAudioTranscriptDeltaServerEvent,
	IResponseContentPartAddedServerEvent
} from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import { Events } from '@beyond-js/events/events';

export class ConversationItemTranscript extends Events {
	#value: string = '';
	get value() {
		return this.#value;
	}

	#status: 'empty' | 'in_progress' | 'completed' = 'empty';
	get status() {
		return this.#status;
	}

	clear() {
		this.#value = '';
		this.#status = 'empty';
	}

	contentPartAdded(event: IResponseContentPartAddedServerEvent) {
		if (event.part.type !== 'audio' || !event.part.transcript) return;

		this.#value += event.part.transcript;
	}

	completed(event: IConversationInputAudioTranscriptionCompletedServerEvent) {
		this.#value = event.transcript ? event.transcript : ' ';
		this.#status = 'completed';
	}

	audioTranscriptDelta(event: IResponseAudioTranscriptDeltaServerEvent) {
		this.#value += event.delta;
	}
}
