import { RealtimeUtils } from '@aimpact/agents-api/realtime/utils';

/**
 * AudioHandler class to manage audio-related operations.
 * This class is designed to be independent of specific item structures.
 */
export class AudioHandler {
	private static readonly DEFAULT_FREQUENCY = 24000; // Default frequency in Hz

	/**
	 * Truncates the given audio buffer based on the provided ending timestamp in milliseconds.
	 *
	 * @param {Int16Array} audioBuffer - The original audio buffer to truncate.
	 * @param {number} audioEndMs - The end time in milliseconds to which the audio should be truncated.
	 * @param {number} frequency - The frequency of the audio in Hz (defaults to 24000 Hz).
	 * @returns {Int16Array} - The truncated audio buffer.
	 */
	static truncate(
		audioBuffer: Int16Array,
		audioEndMs: number,
		frequency: number = AudioHandler.DEFAULT_FREQUENCY
	): Int16Array {
		// Calculate the end index based on the frequency and the end time in milliseconds
		const endIndex = Math.floor((audioEndMs * frequency) / 1000);
		// Return the truncated audio buffer
		return audioBuffer.slice(0, endIndex);
	}

	/**
	 * Merges two audio buffers into one.
	 *
	 * @param {Int16Array | ArrayBuffer} buffer1 - The first audio buffer.
	 * @param {Int16Array | ArrayBuffer} buffer2 - The second audio buffer.
	 * @returns {Int16Array} - The merged audio buffer.
	 */
	static merge(buffer1: Int16Array | ArrayBuffer, buffer2: Int16Array | ArrayBuffer): Int16Array {
		return RealtimeUtils.mergeInt16Arrays(buffer1, buffer2);
	}
}
