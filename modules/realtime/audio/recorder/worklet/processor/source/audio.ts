import { Channels } from './channels';
import { Utils } from './utils';

export class Audio {
	#found = false;
	get found() {
		return this.#found;
	}

	#recording = false;
	get recording() {
		return this.#recording;
	}
	set recording(value) {
		this.#recording = value;
	}

	#chunks: Float32Array[][] = [];
	get chunks() {
		return this.#chunks;
	}

	#port: MessagePort;
	constructor(port: MessagePort) {
		this.#port = port;
	}

	reset() {
		this.#chunks = [];
		this.#recording = false;
		this.#found = false;
	}

	/**
	 * Retrieves the most recent amplitude values from the audio stream
	 * @param {number} channel
	 */
	get(channel: number = -1) {
		const channels = Channels.read(this.chunks, channel);
		const { meanValues } = Channels.format(channels);
		return { meanValues, channels };
	}

	/**
	 * Exports chunks as an audio/wav file
	 */
	export() {
		const channels = Channels.read(this.chunks);
		const { float32Array, meanValues } = Channels.format(channels);
		const data = Utils.floatTo16BitPCM(float32Array);
		return { meanValues, audio: { bitsPerSample: 16, channels, data } };
	}

	process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: any): boolean {
		// Copy input to output (e.g. speakers)
		// Note that this creates choppy sounds with Mac products
		const sourceLimit = Math.min(inputs.length, outputs.length);
		for (let index = 0; index < sourceLimit; index++) {
			const input = inputs[index];
			const output = outputs[index];

			const channelCount = Math.min(input.length, output.length);
			for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
				input[channelIndex].forEach((sample, i) => (output[channelIndex][i] = sample));
			}
		}

		// There's latency at the beginning of a stream before recording starts
		// Make sure we actually receive audio data before we start storing chunks
		let slice = 0;
		if (!this.#found) {
			for (const channel of inputs[0]) {
				slice = 0; // reset for each channel
				if (this.#found) {
					break;
				}
				if (channel) {
					for (const value of channel) {
						if (value !== 0) {
							// Find only one non-zero entry in any channel
							this.#found = true;
							break;
						} else {
							slice++;
						}
					}
				}
			}
		}

		if (inputs[0] && inputs[0][0] && this.#found && this.#recording) {
			// We need to copy the TypedArray, because the `process` internals will reuse the same buffer to hold each input
			const chunk = inputs[0].map(input => input.slice(slice));
			this.#chunks.push(chunk);
			this.#send(chunk);
		}
		return true;
	}

	#send(chunk: Float32Array[]) {
		const channels = Channels.read([chunk]);
		const { float32Array, meanValues } = Channels.format(channels);

		const rawAudioData = Utils.floatTo16BitPCM(float32Array);
		const monoAudioData = Utils.floatTo16BitPCM(meanValues);
		this.#port.postMessage({ method: 'chunk', data: { mono: monoAudioData, raw: rawAudioData } });
	}
}
