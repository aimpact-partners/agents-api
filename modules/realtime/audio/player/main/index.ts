import { StreamWorkletBridge } from '@aimpact/agents-api/realtime/audio/player/worklet/bridge';
import { AudioAnalyzer } from '@aimpact/agents-api/realtime/audio/player/analyzer';

type AnalysisType = 'frequency' | 'music' | 'voice';

interface ISampleOffset {
	trackId: string | null;
	offset: number;
	currentTime: number;
}

/**
 * Plays audio streams received in raw PCM16 chunks from the browser
 */
export /*bundle*/ class StreamPlayer {
	#context: AudioContext;
	#stream: StreamWorkletBridge;
	#analyzer: AnalyserNode;
	#samplerate: number;
	#trackSampleOffsets: Record<string, ISampleOffset> = {};
	#interruptedTrackIds: Record<string, boolean> = {};

	#error: Error;
	get error() {
		return this.#error;
	}

	constructor({ samplerate = 44100 } = {}) {
		this.#samplerate = samplerate;
	}

	/**
	 * Connects the audio context and enables output to speakers
	 * @returns
	 */
	async connect(): Promise<void> {
		const context = (this.#context = new AudioContext({ sampleRate: this.#samplerate }));
		context.state === 'suspended' && (await context.resume());

		// Create an AudioWorkletNode for processing audio data
		const worklet = (this.#stream = new StreamWorkletBridge(context));
		await worklet.setup();
		if (worklet.error) {
			this.#error = worklet.error;
			return;
		}

		const analyzer = context.createAnalyser();
		analyzer.fftSize = 8192;
		analyzer.smoothingTimeConstant = 0.1;
		this.#analyzer = analyzer;
	}

	/**
	 * @TODO: Disconnect player
	 */
	disconnect() {}

	/**
	 * Gets the current frequency domain data from the playing track
	 */
	getFrequencies(analysisType: AnalysisType = 'frequency', minDecibels = -100, maxDecibels = -30) {
		if (!this.#analyzer) throw new Error('Not connected, please call .connect() first');

		return AudioAnalyzer.getFrequencies(
			this.#analyzer,
			this.#samplerate,
			null,
			analysisType,
			minDecibels,
			maxDecibels
		);
	}

	#start() {
		this.#stream.create();
		this.#stream.connect(this.#context.destination);
		this.#stream.on('stop', this.#onstop);
		this.#stream.on('offset', this.#onoffset);

		this.#analyzer.disconnect();
		this.#stream.connect(this.#analyzer);
	}

	#onstop = () => {
		this.#stream.off('stop', this.#onstop);
		this.#stream.off('offset', this.#onoffset);
		this.#stream.disconnect();
	};

	#onoffset = (data: ISampleOffset & { requestId: number }) => {
		const { requestId, trackId, offset } = data;
		const currentTime = offset / this.#samplerate;
		this.#trackSampleOffsets[requestId] = { trackId, offset, currentTime };
	};

	/**
	 * Adds 16BitPCM data to the currently playing audio stream
	 * You can add chunks beyond the current play point and they will be queued for play
	 */
	add16BitPCM(arrayBuffer: ArrayBuffer, trackId = 'default'): Int16Array {
		if (this.#error) {
			throw new Error(`Cannot play audio as player is in an invalid state. Check the 'error' property.`);
		}

		if (!this.#stream) throw new Error(`Stream player not connected`);

		if (typeof trackId !== 'string') throw new Error(`trackId must be a string`);
		if (this.#interruptedTrackIds[trackId]) return;

		!this.#stream.node && this.#start();

		const buffer = (() => {
			if (arrayBuffer instanceof Int16Array) return arrayBuffer;
			if (arrayBuffer instanceof ArrayBuffer) return new Int16Array(arrayBuffer);
			throw new Error(`argument must be Int16Array or ArrayBuffer`);
		})();

		this.#stream.dispatch('write', { buffer, trackId });
		return buffer;
	}

	/**
	 * Gets the offset (sample count) of the currently playing stream
	 */
	async getTrackSampleOffset(interrupt = false): Promise<ISampleOffset> {
		if (!this.#stream.node) return null;

		const requestId = crypto.randomUUID();
		this.#stream.dispatch(interrupt ? 'interrupt' : 'offset', { requestId });

		let trackSampleOffset;
		while (!trackSampleOffset) {
			trackSampleOffset = this.#trackSampleOffsets[requestId];
			await new Promise<void>(resolve => setTimeout(() => resolve(), 1));
		}

		const { trackId } = trackSampleOffset;
		interrupt && trackId && (this.#interruptedTrackIds[trackId] = true);

		return trackSampleOffset;
	}

	/**
	 * Strips the current stream and returns the sample offset of the audio
	 */
	async interrupt(): Promise<ISampleOffset> {
		return this.getTrackSampleOffset(true);
	}
}
