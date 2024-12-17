import type { Conversation } from '.';
import type {
	IConversationItemCreateClientEvent,
	IConversationItemCreatedServerEvent,
	IConversationItemDeletedServerEvent,
	IConversationItemTruncatedServerEvent,
	IResponseAudioDeltaServerEvent,
	IResponseAudioTranscriptDeltaServerEvent,
	IResponseContentPartAddedServerEvent,
	IResponseFunctionCallArgumentsDeltaServerEvent,
	IResponseOutputItemAddedServerEvent,
	IResponseOutputItemDoneServerEvent,
	IConversationInputAudioTranscriptionCompletedServerEvent,
	IResponseTextDeltaServerEvent,
	IInputAudioBufferSpeechStartedServerEvent
} from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import {
	IItem,
	IUserItem,
	IItemInputTextContent,
	IItemInputAudioContent
} from '@aimpact/agents-api/realtime/interfaces/item';
import {
	IAgentItemCreatedEvent,
	IAgentItemAudioDeltaEvent
} from '@aimpact/agents-api/realtime/interfaces/agent-events';
import { ConversationItem } from './item';
import { Events } from '@beyond-js/events/events';

const LOG = false;

export class Items extends Events {
	#conversation: Conversation;

	get #session() {
		return this.#conversation.agent.session;
	}

	#items: ConversationItem[] = [];
	get items() {
		return this.#items;
	}

	#lookup: Map<string, ConversationItem> = new Map();
	get lookup() {
		return this.#lookup;
	}

	has(id: string): boolean {
		return this.#lookup.has(id);
	}

	get(id: string): ConversationItem {
		return this.#lookup.get(id);
	}

	delete(id: string): boolean {
		if (!this.#lookup.has(id)) return false;

		const item = this.#lookup.get(id);
		this.#lookup.delete(id);
		this.#items.splice(this.#items.indexOf(item), 1);
	}

	#errors: string[] = [];
	get errors() {
		return this.#errors;
	}

	/**
	 * Transcription runs asynchronously with Response creation,
	 * so this event may come before or after the Response events.
	 *
	 * Realtime API models accept audio natively, and thus input transcription is a separate process
	 * run on a separate ASR (Automatic Speech Recognition) model, currently always whisper-1.
	 * Thus the transcript may diverge somewhat from the model's interpretation,
	 * and should be treated as a rough guide.
	 *
	 * https://platform.openai.com/docs/api-reference/realtime-server-events/conversation/item/input_audio_transcription/completed
	 */
	#orphans: {
		transcripts: Map<string, string>;
	};

	log(...args: any[]) {
		LOG && console.log(...args);
	}

	constructor(conversation: Conversation) {
		super();
		this.#conversation = conversation;

		const session = this.#session;
		session.on('conversation.item.created', this.onItemCreated.bind(this));
		session.on('conversation.item.truncated', this.onItemTruncated.bind(this));
		session.on('conversation.item.deleted', this.onItemDeleted.bind(this));
		session.on('conversation.item.input_audio_transcription.completed', this.onTranscriptionCompleted.bind(this));
		session.on('response.output_item.added', this.onResponseItemAdded.bind(this));
		session.on('response.content_part.added', this.onResponseContentPartAdded.bind(this));
		session.on('response.audio_transcript.delta', this.onResponseAudioTranscriptDelta.bind(this));
		session.on('response.audio.delta', this.onResponseAudioDelta.bind(this));
		session.on('response.text.delta', this.onResponseTextDelta.bind(this));
		session.on('response.function_call_arguments.delta', this.onResponseFunctionCallArgumentsDelta.bind(this));
		session.on('response.output_item.done', this.onResponseItemDone.bind(this));
	}

	create(item: IItem, previous?: string, eventId?: string) {
		const data: IConversationItemCreateClientEvent<IItem> = {
			type: 'conversation.item.create',
			event_id: eventId,
			previous_item_id: previous,
			item
		};

		this.#session.send('conversation.item.create', data);
	}

	send(message: { text?: string; audio?: string }) {
		if (!message?.text && !message.audio) {
			throw new Error(`Invalid parameters. Message audio or text must be provided`);
		}

		const item: IUserItem = {
			id: null,
			type: 'message',
			role: 'user',
			// Has no effect on the conversation, here for consistency with the conversation.item.created
			status: 'completed',
			content: []
		};

		const content: IItemInputTextContent | IItemInputAudioContent = message.text
			? { type: 'input_text', text: message.text }
			: { type: 'input_audio', audio: message.audio };

		item.content.push(content);

		this.create(item);
		this.#conversation.responses.create();
	}

	speechStarted(event: IInputAudioBufferSpeechStartedServerEvent) {
		if (!this.#lookup.has(event.item_id)) {
			const error = `input_audio_buffer.speech_started: Item "${event.item_id}" not found`;
			this.#errors.push(error);
			this.trigger('error', { error });
			return;
		}

		const item = this.#lookup.get(event.item_id);
		item.speechStarted(event);
	}

	/**
	 * When a conversation item is created.
	 * There are several scenarios that produce this event:
	 *
	 * 1. The server is generating a Response, which if successful will produce either one or two Items,
	 *    which will be of type message (role assistant) or type function_call.
	 *
	 * 2. The input audio buffer has been committed, either by the client or the server (in server_vad mode).
	 *    The server will take the content of the input audio buffer and add it to a new user message Item.
	 *
	 * 3. The client has sent a conversation.item.create event to add a new Item to the Conversation.
	 *
	 * @param event
	 */
	onItemCreated(event: IConversationItemCreatedServerEvent) {
		this.log('[IMPLEMENTED] onItemCreated event received:', event);

		const item = (() => {
			// If the item is being created as a result of a response creation, then the
			// item is already in the items collections. Otherwise, it is required to create
			// an instance of the item
			if (this.#lookup.has(event.item.id)) return this.#lookup.get(event.item.id);

			const item = new ConversationItem(event.item.id);
			this.#items.push(item);
			this.#lookup.set(item.id, item);
			return item;
		})();

		item.created(event);

		/**
		 * Trigger event to notify the item creation
		 */
		(() => {
			const { agent } = this.#conversation;
			const id = item.id;
			const type = <'message'>item.type;
			const role = <'assistant'>item.role;
			const data: IAgentItemCreatedEvent = { item: { id, type, role } };

			agent.trigger('conversation.item.created', data);
		})();
	}

	onItemTruncated(event: IConversationItemTruncatedServerEvent) {
		this.log('onItemTruncated event received:', event);

		// if (!this.#lookup.has(event.item_id)) {
		// 	this.trigger('error', { error: `item.truncated: Item "${event.item_id}" not found` });
		// 	return;
		// }
		// const item = this.#lookup.get(event.item_id);
		// item.truncated(event);
	}

	onItemDeleted(event: IConversationItemDeletedServerEvent) {
		this.log('onItemDeleted event received:', event);

		// if (!this.#lookup.has(event.item_id)) {
		// 	this.trigger('error', { error: `item.deleted: Item "${event.item_id}" not found` });
		// 	return;
		// }
		// // Remove item from lookup table
		// this.delete(event.item_id);
	}

	onTranscriptionCompleted(event: IConversationInputAudioTranscriptionCompletedServerEvent) {
		this.log('onTranscriptionCompleted event received:', event);

		// if (!this.#lookup.has(event.item_id)) {
		// 	// If the item doesn't exist yet, queue the transcript for later
		// 	const transcript = event.transcript || ' '; // Use a single space if transcript is empty
		// 	this.#orphans.transcripts.set(event.item_id, transcript);
		// 	return;
		// } else {
		// 	const item = this.#lookup.get(event.item_id);
		// 	item.transcriptionCompleted(event);
		// }
	}

	/**
	 * When a new Item is created during Response generation.
	 *
	 * @param event
	 * @returns
	 */
	onResponseItemAdded(event: IResponseOutputItemAddedServerEvent) {
		this.log('[IMPLEMENTED] onItemAdded event received:', event);

		const { responses } = this.#conversation;
		if (!responses.has(event.response_id)) {
			const error = `response.output_item.added: Response "${event.response_id}" not found`;
			this.#errors.push(error);
			this.trigger('error', { error });
			return;
		}

		const item = new ConversationItem(event.item.id);
		this.#lookup.set(item.id, item);
		this.#items.push(item);

		const response = responses.get(event.response_id);
		item.added(response, event);
	}

	onResponseContentPartAdded(event: IResponseContentPartAddedServerEvent) {
		// this.log('[IMPLEMENTED] onContentPartAdded event received:', event);

		if (!this.#lookup.has(event.item_id)) {
			const error = `response.content_part.added: Item "${event.item_id}" not found`;
			this.#errors.push(error);
			this.trigger('error', { error });
			return;
		}

		const item = this.#lookup.get(event.item_id);
		item.contentPartAdded(event);
	}

	onResponseAudioTranscriptDelta(event: IResponseAudioTranscriptDeltaServerEvent) {
		// this.log('[IMPLEMENTED] onAudioTranscriptDelta event received:', event);

		if (!this.#lookup.has(event.item_id)) {
			const error = `response.audio_transcript.delta: Item "${event.item_id}" not found`;
			this.#errors.push(error);
			this.trigger('error', { error });
			return;
		}

		const item = this.#lookup.get(event.item_id);
		item.audioTranscriptDelta(event);
	}

	onResponseAudioDelta(event: IResponseAudioDeltaServerEvent) {
		// this.log('[IMPLEMENTED] onAudioDelta event received:', event);

		if (!this.#lookup.has(event.item_id)) {
			const error = `response.audio.delta: Item "${event.item_id}" not found`;
			this.#errors.push(error);
			this.trigger('error', { error });
			return;
		}

		const item = this.#lookup.get(event.item_id);
		item.audioDelta(event);

		/**
		 * Trigger event to notify the item creation
		 */
		(() => {
			const { agent } = this.#conversation;
			const id = item.id;
			const data: IAgentItemAudioDeltaEvent = { item: { id }, delta: event.delta };

			agent.trigger('conversation.item.audio.delta', data);
		})();
	}

	onResponseTextDelta(event: IResponseTextDeltaServerEvent) {
		this.log('[IMPLEMENTED] onTextDelta event received:', event);

		if (!this.#lookup.has(event.item_id)) {
			const error = `response.text.delta: Item "${event.item_id}" not found`;
			this.#errors.push(error);
			this.trigger('error', { error });
			return;
		}

		const item = this.#lookup.get(event.item_id);
		item.textDelta(event);
	}

	onResponseFunctionCallArgumentsDelta(event: IResponseFunctionCallArgumentsDeltaServerEvent) {
		this.log('[IMPLEMENTED] onFunctionCallArgumentsDelta event received:', event);

		if (!this.#lookup.has(event.item_id)) {
			const error = `response.function_call_arguments.delta: Item "${event.item_id}" not found`;
			this.#errors.push(error);
			this.trigger('error', { error });
			return;
		}

		const item = this.#lookup.get(event.item_id);
		item.functionCallArgumentsDelta(event);
	}

	onResponseItemDone(event: IResponseOutputItemDoneServerEvent) {
		this.log('[IMPLEMENTED] onItemDone event received:', event);

		if (!event.item) {
			const error = `response.output_item.done: Missing "item"`;
			this.#errors.push(error);
			this.trigger('error', { error });
			return;
		}

		const item = this.#lookup.get(event.item.id);
		if (!this.#lookup.has(event.item.id)) {
			const error = `response.output_item.done: Item "${event.item.id}" not found`;
			this.#errors.push(error);
			this.trigger('error', { error });
			return;
		}

		item.done(event);
	}
}
