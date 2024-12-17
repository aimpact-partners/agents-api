export class Channels {
	/**
	 * Reads and concatenates sampled chunks into separate audio channels.
	 * This method reads and combines audio chunks based on the channels.
	 * It can read a specific channel if specified or all channels up to maxChannels by default.
	 * It returns the concatenated audio data for each channel in the form of Float32Array.
	 *
	 * @param chunks - An array of audio chunks, where each chunk contains arrays for each channel (e.g., [Left[], Right[]]).
	 * @param channel - The specific channel to read. If -1, it reads all available channels up to `maxChannels`. Default is -1.
	 * @param maxChannels - The maximum number of channels to read if `channel` is set to -1. Default is 9.
	 *
	 * @returns An array of concatenated `Float32Array`s, each representing the audio data for a specific channel.
	 *
	 * @throws Error If the specified channel index is out of range based on the available channels in the chunks.
	 */
	static read(chunks: Float32Array[][], channel: number = -1, maxChannels: number = 9): Float32Array[] {
		let channelLimit;
		if (channel !== -1) {
			if (chunks[0] && chunks[0].length - 1 < channel) {
				throw new Error(`Channel \${channel} out of range: max \${chunks[0].length}`);
			}
			channelLimit = channel + 1;
		} else {
			channel = 0;
			channelLimit = Math.min(chunks[0] ? chunks[0].length : 1, maxChannels);
		}

		const channels = [];
		for (let n = channel; n < channelLimit; n++) {
			const length = chunks.reduce((sum, chunk) => {
				return sum + chunk[n].length;
			}, 0);
			const buffers = chunks.map(chunk => chunk[n]);
			const result = new Float32Array(length);
			let offset = 0;
			for (let i = 0; i < buffers.length; i++) {
				result.set(buffers[i], offset);
				offset += buffers[i].length;
			}
			channels[n] = result;
		}
		return channels;
	}

	/**
	 * Combines multiple audio channels into an interleaved format suitable for playback
	 * and also calculates the mean values for a mono representation.
	 *
	 * @param channels - An array where each entry is a `Float32Array`
	 * representing the audio data for a specific channel (e.g., [Left[], Right[]]).
	 *
	 * @returns An object containing:
	 *   - `float32Array`: The interleaved audio data combining all channels
	 *     (e.g., [L, R, L, R, ...] for stereo).
	 *   - `meanValues`: A mono representation of the audio, where each value
	 *     is the mean of all channels for that sample index.
	 */
	static format(channels: Float32Array[]): { float32Array: Float32Array; meanValues: Float32Array } {
		if (channels.length === 1) {
			// Simple case is only one channel
			const float32Array = channels[0].slice();
			const meanValues = channels[0].slice();
			return { float32Array, meanValues };
		} else {
			const float32Array = new Float32Array(channels[0].length * channels.length);
			const meanValues = new Float32Array(channels[0].length);
			for (let i = 0; i < channels[0].length; i++) {
				const offset = i * channels.length;
				let meanValue = 0;
				for (let n = 0; n < channels.length; n++) {
					float32Array[offset + n] = channels[n][i];
					meanValue += channels[n][i];
				}
				meanValues[i] = meanValue / channels.length;
			}
			return { float32Array, meanValues };
		}
	}
}
