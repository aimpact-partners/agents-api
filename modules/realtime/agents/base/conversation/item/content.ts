import type {
	IConversationInputAudioTranscriptionCompletedServerEvent,
	IResponseContentPartAddedServerEvent,
	IResponseAudioTranscriptDeltaServerEvent,
	IResponseAudioDeltaServerEvent,
	IResponseTextDeltaServerEvent,
	IConversationItemCreatedServerEvent,
	IResponseOutputItemDoneServerEvent
} from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import { ConversationItemTranscript } from './transcript';
import { ConversationItemAudio } from './audio';
import { ConversationItemText } from './text';
import { Events } from '@beyond-js/events/events';

export class ConversationItemContent extends Events {
	#status: 'empty' | 'in_progress' | 'completed' | 'incomplete' = 'empty';
	get status() {
		return this.#status;
	}

	#text = new ConversationItemText();
	get text() {
		return this.#text;
	}

	#audio = new ConversationItemAudio();
	get audio() {
		return this.#audio;
	}

	#transcript = new ConversationItemTranscript();
	get transcript() {
		return this.#transcript;
	}

	/**
	 * When a conversation item is created.
	 * There are several scenarios that produce this event:
	 *
	 * @param event
	 */
	created(event: IConversationItemCreatedServerEvent) {
		// Set the item status based on the type and role
		if (event.item.type !== 'message') return;

		this.#text.created(event);
		this.#audio.created(event);

		this.#status = event.item.role === 'user' ? 'completed' : 'in_progress';
	}

	/**
	 * When a new content part is added to an assistant message item during response generation.
	 * @param event
	 */
	contentPartAdded(event: IResponseContentPartAddedServerEvent) {
		this.#transcript.contentPartAdded(event);
		this.#text.contentPartAdded(event);
		this.#audio.contentPartAdded(event);
	}

	audioDelta(event: IResponseAudioDeltaServerEvent) {
		this.#audio.audioDelta(event);
	}

	textDelta(event: IResponseTextDeltaServerEvent) {
		this.#text.textDelta(event);
	}

	audioTranscriptDelta(event: IResponseAudioTranscriptDeltaServerEvent) {
		this.#transcript.audioTranscriptDelta(event);
	}

	transcriptionCompleted(event: IConversationInputAudioTranscriptionCompletedServerEvent) {
		this.#transcript.completed(event);
	}

	done(event: IResponseOutputItemDoneServerEvent) {
		this.#status = event.item.status;
	}
}
