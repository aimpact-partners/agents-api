import type { Conversation } from '..';
import type { Writable } from 'stream';
import type { Storage } from '@google-cloud/storage';
import { RealtimeUtils } from '@aimpact/agents-api/realtime/utils';

// Recommended buffer size for PCM audio in real-time applications, around 5MB.
const BUFFER_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB in bytes

declare function bimport(module: string): Promise<any>;

export class SpeechStorage {
	#conversation: Conversation;
	#buffer: Int16Array = new Int16Array(0);
	#stream: Writable;
	#browser: boolean;
	#prepared = false;

	constructor(conversation: Conversation) {
		this.#conversation = conversation;

		// Determine if running in the browser or Node.js
		this.#browser = !(globalThis as any).process?.versions?.node;
		!this.#browser && this.#ready().catch(exc => console.log(exc));
	}

	async #ready() {
		const { Storage } = await bimport('@google-cloud/storage');
		const storage: Storage = new Storage();
		const bucket = storage.bucket('conversations-audios');

		const file = bucket.file(`conversation/${this.#conversation.id}.pcm`);

		// Initialize a writable stream to GCS
		this.#stream = file.createWriteStream({
			resumable: false, // Disables resumable uploads for real-time performance
			contentType: 'audio/L16' // PCM 16-bit audio format
		});

		this.#stream.on('error', this.#onerror);
		this.#stream.on('finish', this.#onfinish);

		this.#prepared = true;
	}

	#onerror = (error: Error) => {
		// @TODO: Handle this error
		console.error('Error uploading audio to Google Cloud Storage:', error);
	};

	#onfinish = () => {
		this.#stream.off('error', this.#onerror);
		this.#stream.off('finish', this.#onfinish);
		this.#stream = void 0;
	};

	append(chunk: Int16Array) {
		if (this.#browser) return;

		this.#buffer = RealtimeUtils.mergeInt16Arrays(this.#buffer, chunk);

		// Check if the buffer has reached the size limit
		if (this.#buffer.byteLength >= BUFFER_SIZE_LIMIT) {
			this.flush();
		}
	}

	flush() {
		if (this.#browser) return;
		if (this.#buffer.byteLength === 0) return;

		if (!this.#prepared) {
			// Reset the buffer, some audio is going to be lost
			// This should never happen, it is related with the `ready` method
			this.#buffer = new Int16Array(0);

			console.warn(`Speech storage is not prepared`);
			return;
		}

		// Write the current buffer to the GCS file stream
		this.#stream.write(Buffer.from(this.#buffer.buffer), error => {
			if (error) {
				// @TODO: Handle this error
				console.error('Error writing buffer to stream:', error);
			}
		});

		// Reset the buffer
		this.#buffer = new Int16Array(0);
	}

	close() {
		if (this.#browser) return;

		// Flush any remaining buffer data before closing
		this.flush();

		// End the writable stream to Cloud Storage
		this.#stream.end();
	}
}
