import type {
	IConversationCreatedServerEvent,
	IInputAudioBufferSpeechStartedServerEvent,
	IInputAudioBufferSpeechStoppedServerEvent
} from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import type { BaseRealtimeAgent } from '..';
import { Items } from './items';
import { ConversationResponses } from './responses';
import { Speech } from './speech';

const LOG = false;

export class Conversation {
	#id: string;
	get id() {
		return this.#id;
	}

	#agent: BaseRealtimeAgent;
	get agent() {
		return this.#agent;
	}

	#speech: Speech;
	get speech() {
		return this.#speech;
	}

	#items: Items;
	get items() {
		return this.#items;
	}

	#responses: ConversationResponses;
	get responses() {
		return this.#responses;
	}

	constructor(agent: BaseRealtimeAgent) {
		this.#agent = agent;
		this.#items = new Items(this);
		this.#responses = new ConversationResponses(this);
		this.#speech = new Speech(this);

		const { session } = agent;
		session.on('conversation.created', this.onCreated.bind(this));
		session.on('input_audio_buffer.speech_started', this.onSpeechStarted.bind(this));
		session.on('input_audio_buffer.speech_stopped', this.onSpeechStopped.bind(this));
	}

	listen(chunk: Int16Array) {
		this.#speech.append(chunk);
	}

	log(...args: any[]) {
		LOG && console.log(...args);
	}

	onCreated(event: IConversationCreatedServerEvent) {
		this.log('[IMPLEMENTED] on[Conversation]Created event received:', event);
		this.#id = event.conversation.id;
	}

	onSpeechStarted(event: IInputAudioBufferSpeechStartedServerEvent) {
		this.log('[IMPLEMENTED] onSpeechStarted event received:', event);
		this.#speech.onStarted(event);
		this.#items.speechStarted(event);
	}

	onSpeechStopped(event: IInputAudioBufferSpeechStoppedServerEvent, audio: Int16Array) {
		this.log('onSpeechStopped event received:', event);

		// if (!this.#lookup.has(event.item_id)) {
		// 	this.trigger('error', { error: `input_audio_buffer.speech_stopped: Item "${event.item_id}" not found` });
		// 	return;
		// }
		// const item = this.#lookup.get(event.item_id);
		// item.speechStopped(event, audio);
	}
}
