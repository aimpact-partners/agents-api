import type { ConversationResponse } from '../response';
import type {
	IConversationInputAudioTranscriptionCompletedServerEvent,
	IConversationItemCreatedServerEvent,
	IConversationItemTruncatedServerEvent,
	IInputAudioBufferSpeechStartedServerEvent,
	IInputAudioBufferSpeechStoppedServerEvent,
	IResponseOutputItemAddedServerEvent,
	IResponseOutputItemDoneServerEvent,
	IResponseContentPartAddedServerEvent,
	IResponseAudioTranscriptDeltaServerEvent,
	IResponseAudioDeltaServerEvent,
	IResponseTextDeltaServerEvent,
	IResponseFunctionCallArgumentsDeltaServerEvent
} from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import type { ItemType, MessageSenderType, ItemStatusType } from '@aimpact/agents-api/realtime/interfaces/item';
import { ConversationItemTool } from './tool';
import { ConversationItemAudio } from './audio';
import { ConversationItemSpeech } from './speech';
import { ConversationItemTranscript } from './transcript';
import { ConversationItemContent } from './content';
import { Events } from '@beyond-js/events/events';

export class ConversationItem extends Events {
	#id: string;
	get id() {
		return this.#id;
	}

	#type: ItemType;
	get type() {
		return this.#type;
	}

	#role: MessageSenderType;
	get role() {
		return this.#role;
	}

	#audio?: ConversationItemAudio;
	get audio() {
		return this.#audio;
	}

	#content = new ConversationItemContent();
	get content() {
		return this.#content;
	}

	#transcript?: ConversationItemTranscript;
	get transcript() {
		return this.#transcript;
	}

	#tool?: ConversationItemTool;
	get tool() {
		return this.#tool;
	}

	#output?: string;
	get output() {
		return this.#output;
	}

	#status: ItemStatusType;
	get status() {
		return this.#status;
	}

	#speech?: ConversationItemSpeech;

	#response: ConversationResponse;
	get response() {
		return this.#response;
	}

	constructor(id: string) {
		super();
		this.#id = id;
	}

	/**
	 * When a new Item is created during Response generation.
	 *
	 * @param response
	 * @param event
	 */
	added(response: ConversationResponse, event: IResponseOutputItemAddedServerEvent) {
		this.#response = response;
		this.#status = event.item.status;
		this.#type = event.item.type;
	}

	/**
	 * When a conversation item is created.
	 * There are several scenarios that produce this event:
	 *
	 * @param event
	 */
	created(event: IConversationItemCreatedServerEvent) {
		// Set the item status based on the type and role
		if (event.item.type === 'message') {
			if (event.item.role === 'user') {
				this.#status = 'completed'; // Mark user message as completed
			} else {
				this.#status = 'in_progress'; // Set status as in progress for other types
			}
		} else if (event.item.type === 'function_call') {
			this.#tool = new ConversationItemTool({
				name: event.item.name,
				caller: event.item.call_id,
				arguments: ''
			});
			this.#status = 'in_progress';
		} else if (event.item.type === 'function_call_output') {
			this.#status = 'completed';
			this.#output = event.item.output;
		}

		this.#content.created(event);
	}

	contentPartAdded(event: IResponseContentPartAddedServerEvent) {
		this.#content.contentPartAdded(event);
	}

	audioTranscriptDelta(event: IResponseAudioTranscriptDeltaServerEvent) {
		this.#content.audioTranscriptDelta(event);
	}

	done(event: IResponseOutputItemDoneServerEvent) {
		this.#status = event.item.status;
		this.#content.done(event);
	}

	truncated(event: IConversationItemTruncatedServerEvent) {
		// Clear the transcript
		this.#transcript.clear();

		if (!this.#audio) {
			this.trigger('error', { error: `item.truncated: Audio of item "${event.item_id}" not found` });
			return;
		}
		this.#audio.truncated(event);
	}

	speechStarted(event: IInputAudioBufferSpeechStartedServerEvent) {
		if (this.#speech) {
			this.trigger('error', {
				error: `input_audio_buffer.speech_started: Item speech "${event.item_id}" already created`
			});
			return;
		}

		this.#speech = new ConversationItemSpeech(this.#audio, event.audio_start_ms);
	}

	speechStopped(event: IInputAudioBufferSpeechStoppedServerEvent, audio: Int16Array) {
		if (!this.#audio) {
			this.trigger('error', {
				error: `input_audio_buffer.speech_stopped: Audio of item "${event.item_id}" not found`
			});
			return;
		}

		// If there's no queued speech item, initialize it with the end time
		!this.#speech && (this.#speech = new ConversationItemSpeech(this.#audio, event.audio_end_ms));
		this.#speech.stopped(event, audio);
	}

	transcriptionCompleted(event: IConversationInputAudioTranscriptionCompletedServerEvent) {
		// Assign transcript to the item
		this.#content.transcriptionCompleted(event);
		this.#transcript.completed(event);
	}

	audioDelta(event: IResponseAudioDeltaServerEvent) {
		this.#content.audioDelta(event);
	}

	textDelta(event: IResponseTextDeltaServerEvent) {
		this.#content.textDelta(event);
	}

	functionCallArgumentsDelta(event: IResponseFunctionCallArgumentsDeltaServerEvent) {
		if (!this.#tool) {
			this.trigger('error', {
				error: `response.function_call_arguments.delta: Tool of item "${event.item_id}" not found`
			});
			return;
		}

		this.#tool.functionCallArgumentsDelta(event);
	}
}
