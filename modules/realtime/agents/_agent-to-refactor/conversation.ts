import type { ItemType, FormattedItemType, ContentType } from './client';

// Interface representing changes to item content
interface ItemContentDeltaType {
	text?: string; // Delta for text content
	audio?: Int16Array; // Delta for audio content
	arguments?: string; // Delta for function call arguments
	transcript?: string; // Delta for audio transcript
}

// Interface for storing queued transcript items before they are processed
interface QueuedTranscriptItemType {
	transcript: string; // The transcript text
}

// Interface for storing queued speech items, including start and end times and audio data
interface QueuedSpeechItemType {
	audio_start_ms: number; // Start time of the audio in milliseconds
	audio_end_ms?: number; // Optional end time of the audio in milliseconds
	audio?: Int16Array; // Audio data
}

// Class representing the conversation state, managing items, and processing events
export class RealtimeConversation {
	private defaultFrequency: number; // Default audio frequency in Hz
	private itemLookup: { [key: string]: FormattedItemType }; // Lookup table for items by ID
	private items: FormattedItemType[]; // List of items in the conversation
	private responseLookup: { [key: string]: any }; // Lookup table for responses by ID
	private responses: any[]; // List of responses
	private queuedSpeechItems: { [key: string]: QueuedSpeechItemType }; // Queued speech items waiting for processing
	private queuedTranscriptItems: { [key: string]: QueuedTranscriptItemType }; // Queued transcript items waiting for processing
	private queuedInputAudio: Int16Array | null; // Queued input audio waiting to be assigned to an item

	constructor() {
		this.defaultFrequency = 24000; // Default frequency set to 24,000 Hz
		this.clear(); // Clear conversation state
	}

	// Clear all conversation data and reset state
	clear(): true {
		this.itemLookup = {};
		this.items = [];
		this.responseLookup = {};
		this.responses = [];
		this.queuedSpeechItems = {};
		this.queuedTranscriptItems = {};
		this.queuedInputAudio = null;
		return true;
	}

	// Queue input audio for later use, e.g., when creating a new item
	queueInputAudio(inputAudio: Int16Array): Int16Array {
		this.queuedInputAudio = inputAudio;
		return inputAudio;
	}

	// Process an event from the WebSocket server and update conversation state accordingly
	processEvent(event: any, ...args: any[]): { item: ItemType | null; delta: ItemContentDeltaType | null } {
		if (!event.event_id) {
			console.error(event);
			throw new Error(`Missing "event_id" on event`);
		}
		if (!event.type) {
			console.error(event);
			throw new Error(`Missing "type" on event`);
		}
		// Retrieve the appropriate event processor based on the event type
		const eventProcessor = this.getEventProcessor(event.type);
		if (!eventProcessor) {
			throw new Error(`Missing conversation event processor for "${event.type}"`);
		}
		// Call the event processor to handle the event
		return eventProcessor.call(this, event, ...args);
	}

	// Retrieve an item by its ID
	getItem(id: string): FormattedItemType | null {
		return this.itemLookup[id] || null;
	}

	// Retrieve all items in the conversation
	getItems(): FormattedItemType[] {
		return [...this.items]; // Return a shallow copy of the items array
	}

	// Retrieve the appropriate event processor function based on the event type
	private getEventProcessor(eventType: string): Function | undefined {
		return this.eventProcessors[eventType];
	}
}
