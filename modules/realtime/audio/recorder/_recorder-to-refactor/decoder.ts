import { WavPacker } from './wav_packer';

export interface DecodedAudioType {
	blob: Blob;
	url: string;
	values: Float32Array;
	audioBuffer: AudioBuffer;
}

/**
 * Decodes various audio formats into a wav file
 * Converts audio data to a format that can be processed as a Blob and used in the browser.
 */
export async function decodeAudio(
	audioData: Blob | Float32Array | Int16Array | ArrayBuffer | number[],
	sampleRate = 44100,
	fromSampleRate = -1
): Promise<DecodedAudioType> {
	const context = new AudioContext({ sampleRate });
	let arrayBuffer: ArrayBuffer;
	let blob: Blob;
	if (audioData instanceof Blob) {
		// Handle case where input is a Blob (e.g., a file object)
		if (fromSampleRate !== -1) {
			throw new Error(`Cannot specify "fromSampleRate" when reading from Blob`);
		}
		blob = audioData;
		arrayBuffer = await blob.arrayBuffer();
	} else if (audioData instanceof ArrayBuffer) {
		// Handle case where input is an ArrayBuffer
		if (fromSampleRate !== -1) {
			throw new Error(`Cannot specify "fromSampleRate" when reading from ArrayBuffer`);
		}
		arrayBuffer = audioData;
		blob = new Blob([arrayBuffer], { type: 'audio/wav' });
	} else {
		let float32Array: Float32Array;
		let data: Int16Array;
		if (audioData instanceof Int16Array) {
			// Convert Int16Array data to Float32Array
			data = audioData;
			float32Array = new Float32Array(audioData.length);
			for (let i = 0; i < audioData.length; i++) {
				float32Array[i] = audioData[i] / 0x8000;
			}
		} else if (audioData instanceof Float32Array) {
			float32Array = audioData;
		} else if (Array.isArray(audioData)) {
			float32Array = new Float32Array(audioData);
		} else {
			throw new Error(`"audioData" must be one of: Blob, Float32Array, Int16Array, ArrayBuffer, Array<number>`);
		}
		if (fromSampleRate === -1) {
			throw new Error(`Must specify "fromSampleRate" when reading from Float32Array, Int16Array, or Array`);
		} else if (fromSampleRate < 3000) {
			throw new Error(`Minimum "fromSampleRate" is 3000 (3kHz)`);
		}

		if (!data!) {
			// Convert Float32Array to Int16Array to create PCM data
			data = WavPacker.floatTo16BitPCM(float32Array) as Int16Array;
		}
		const audio = {
			bitsPerSample: 16,
			channels: [float32Array],
			data
		};
		const packer = new WavPacker();
		const result = packer.pack(fromSampleRate, audio);
		blob = result.blob;
		arrayBuffer = await blob.arrayBuffer();
	}

	const audioBuffer = await context.decodeAudioData(arrayBuffer);
	const values = audioBuffer.getChannelData(0);
	const url = URL.createObjectURL(blob);
	return { blob, url, values, audioBuffer };
}
