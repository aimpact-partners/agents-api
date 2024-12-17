// item.ts
import type { FormattedItemType, ContentType } from './client';

// Enhanced Item class to manage all item-related operations
export class Item {
	private item: FormattedItemType;

	constructor(item: FormattedItemType) {
		this.item = JSON.parse(JSON.stringify(item)); // Create a deep copy to avoid mutation issues
	}

	// Initialize item properties such as audio, text, and transcript
	initializeFormatted() {
		this.item.formatted = {
			audio: new Int16Array(0), // Initialize audio as empty
			text: '',
			transcript: ''
		};
		return this.item;
	}

	// Populate text content for the item
	populateTextContent(content: ContentType[]) {
		const textContent = content.filter((c: ContentType) => c.type === 'text' || c.type === 'input_text');
		for (const content of textContent) {
			this.item.formatted.text += content.text;
		}
	}

	// Assign transcript to the item
	assignTranscript(transcript: string) {
		this.item.formatted.transcript = transcript;
	}

	// Truncate audio for the item based on the given time
	truncateAudio(audioEndMs: number, defaultFrequency: number) {
		const endIndex = Math.floor((audioEndMs * defaultFrequency) / 1000);
		this.item.formatted.audio = this.item.formatted.audio.slice(0, endIndex); // Truncate the audio
		this.item.formatted.transcript = ''; // Optionally clear the transcript
	}

	// Set item status and assign queued audio if available
	setStatus(status: 'in_progress' | 'completed', queuedInputAudio?: Int16Array | null) {
		this.item.status = status;
		if (status === 'completed' && queuedInputAudio) {
			this.item.formatted.audio = queuedInputAudio;
		}
	}

	// Retrieve the complete item with formatted properties
	getFormattedItem() {
		return this.item;
	}
}
