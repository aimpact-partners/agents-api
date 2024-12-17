/**
 * Raw wav audio file contents
 */
export interface WavPackerAudioType {
	blob: Blob;
	url: string;
	channelCount: number;
	sampleRate: number;
	duration: number;
}

/**
 * Utility class for assembling PCM16 "audio/wav" data
 */
export /*bundle*/ class WavPacker {
	/**
	 * Converts Float32Array of amplitude data to ArrayBuffer in Int16Array format
	 * @param float32Array - Array of float audio values
	 * @returns ArrayBuffer with Int16 values
	 */
	static floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
		const buffer = new ArrayBuffer(float32Array.length * 2);
		const view = new DataView(buffer);
		let offset = 0;
		for (let i = 0; i < float32Array.length; i++, offset += 2) {
			let s = Math.max(-1, Math.min(1, float32Array[i]));
			view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		}
		return buffer;
	}

	/**
	 * Concatenates two ArrayBuffers
	 * @param leftBuffer - First buffer to concatenate
	 * @param rightBuffer - Second buffer to concatenate
	 * @returns Merged ArrayBuffer
	 */
	static mergeBuffers(leftBuffer: ArrayBuffer, rightBuffer: ArrayBuffer): ArrayBuffer {
		const tmpArray = new Uint8Array(leftBuffer.byteLength + rightBuffer.byteLength);
		tmpArray.set(new Uint8Array(leftBuffer), 0);
		tmpArray.set(new Uint8Array(rightBuffer), leftBuffer.byteLength);
		return tmpArray.buffer;
	}

	/**
	 * Packs data into an Int16 format
	 * @private
	 * @param size - 0 = 1x Int16, 1 = 2x Int16
	 * @param arg - Value to pack
	 * @returns Uint8Array representing packed data
	 */
	private _packData(size: number, arg: number): Uint8Array {
		return [
			new Uint8Array([arg & 0xff, (arg >> 8) & 0xff]),
			new Uint8Array([arg & 0xff, (arg >> 8) & 0xff, (arg >> 16) & 0xff, (arg >> 24) & 0xff])
		][size];
	}

	/**
	 * Packs audio into "audio/wav" Blob
	 * @param sampleRate - Sample rate of the audio
	 * @param audio - Audio object containing bitsPerSample, channels, and data
	 * @returns WavPackerAudioType containing blob, url, channelCount, sampleRate, and duration
	 */
	pack(
		sampleRate: number,
		audio: {
			bitsPerSample: number;
			channels: Float32Array[];
			data: Int16Array;
		}
	): WavPackerAudioType {
		if (!audio?.bitsPerSample) {
			throw new Error(`Missing "bitsPerSample"`);
		} else if (!audio?.channels) {
			throw new Error(`Missing "channels"`);
		} else if (!audio?.data) {
			throw new Error(`Missing "data"`);
		}

		const { bitsPerSample, channels, data } = audio;
		const output = [
			// Header
			'RIFF',
			this._packData(1, 4 + (8 + 24) /* chunk 1 length */ + (8 + 8) /* chunk 2 length */), // Length
			'WAVE',
			// chunk 1
			'fmt ', // Sub-chunk identifier
			this._packData(1, 16), // Chunk length
			this._packData(0, 1), // Audio format (1 is linear quantization)
			this._packData(0, channels.length),
			this._packData(1, sampleRate),
			this._packData(1, (sampleRate * channels.length * bitsPerSample) / 8), // Byte rate
			this._packData(0, (channels.length * bitsPerSample) / 8),
			this._packData(0, bitsPerSample),
			// chunk 2
			'data', // Sub-chunk identifier
			this._packData(1, (channels[0].length * channels.length * bitsPerSample) / 8), // Chunk length
			data
		];
		const blob = new Blob(output, { type: 'audio/mpeg' });
		const url = URL.createObjectURL(blob);
		return {
			blob,
			url,
			channelCount: channels.length,
			sampleRate,
			duration: data.byteLength / (channels.length * sampleRate * 2)
		};
	}
}
