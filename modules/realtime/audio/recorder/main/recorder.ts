import type { Device } from './device';
import { RecorderWorkletBridge } from '@aimpact/agents-api/realtime/audio/recorder/worklet/bridge';
import { Events } from '@beyond-js/events/events';
import { PendingPromise } from '@beyond-js/kernel/core';
import { RecorderChunks } from './chunks';
import type { IChunksConfig } from './chunks';

export /*bundle*/ interface IRecorderConfig {
	samplerate?: number;
	debug: boolean; // In debugging mode, input sound outputs to speakers
	chunks?: IChunksConfig;
}

interface IRecorderContext {
	stream: MediaStream;
	context: AudioContext;
	media: MediaStreamAudioSourceNode;
	node: AudioNode;
	analyser: AnalyserNode;
	processor: AudioWorkletNode;
}

type IStatus = 'starting' | 'recording' | 'pausing' | 'paused' | 'stopping' | 'stopped' | 'error';

/**
 * Records live stream of user audio as PCM16 "audio/wav" data
 */
export /*bundle*/ class Recorder extends Events {
	#worklet: RecorderWorkletBridge;
	#chunks: RecorderChunks;

	#device: Device;
	get device() {
		return this.#device;
	}

	#config: IRecorderConfig;
	get config() {
		return this.#config;
	}

	#status: IStatus = 'stopped';
	get status() {
		return this.#status;
	}

	#error: Error;
	get error() {
		return this.#error;
	}

	#ready: PendingPromise<void>;
	get ready(): PendingPromise<void> {
		if (this.#ready) return this.#ready;

		this.#ready = new PendingPromise();
		this.#setup()
			.then(() => this.#ready.resolve())
			.catch(error => {
				this.#error = error;
				this.#ready.resolve();
			});

		return this.#ready;
	}
	#context: IRecorderContext;

	constructor(device: Device, config: IRecorderConfig) {
		super();
		this.#device = device;
		this.#config = config;
		this.#config.samplerate = this.#config.samplerate ?? 44100;

		this.#chunks = new RecorderChunks(config.chunks);
	}

	/**
	 * Do not call it directly, access the .ready property instead
	 * @returns
	 */
	async #setup() {
		const context: Partial<IRecorderContext> = {};

		try {
			const config: MediaStreamConstraints = { audio: { deviceId: { exact: this.#device.id } } };
			context.stream = await navigator.mediaDevices.getUserMedia(config);
		} catch (error) {
			this.#error = error;
			return;
		}

		// Set up AudioContext and connect the audio stream source
		context.context = new AudioContext({ sampleRate: this.#config.samplerate });
		context.media = context.context.createMediaStreamSource(context.stream);

		// Create an AudioWorkletNode for processing audio data
		const worklet = (this.#worklet = new RecorderWorkletBridge(context.context));

		await worklet.setup();
		if (worklet.error) {
			this.#error = worklet.error;
			return;
		}

		worklet.create();
		const node = context.media.connect(worklet.node);

		const analyser = context.context.createAnalyser();
		analyser.fftSize = 8192;
		analyser.smoothingTimeConstant = 0.1;
		node.connect(analyser);
		if (this.#config.debug) {
			console.warn(
				`Warning: Output to speakers may affect sound quality, ` +
					`especially due to system audio feedback preventative measures. Use only for debugging`
			);
			analyser.connect(context.context.destination);
		}

		// Store references for future use
		this.#context = <IRecorderContext>context;
	}

	#onchunk = ({ raw, mono }: { raw: Int16Array; mono: Int16Array }) => {
		const chunk = this.#chunks.process({ raw, mono });
		this.trigger('chunk', chunk);
	};

	async record(): Promise<boolean> {
		await this.ready;
		if (!this.#worklet.check()) return;
		if (!['stopped', 'paused'].includes(this.#status)) {
			throw new Error(`Cannot start recording as it is not stopped or paused`);
		}
		this.#status = 'starting';

		try {
			const config = this.#config;
			await this.#worklet.dispatch('record', { config });
			this.#status = 'recording';
		} catch (exc) {
			this.#status = 'stopped';
			throw exc;
		}

		this.#worklet.on('chunk', this.#onchunk);
	}

	async pause() {
		if (!this.#context) throw new Error(`Recorder not initialized`);
		if (!this.#worklet.check()) return;

		this.#worklet.off('chunk', this.#onchunk);

		this.#status = 'pausing';
		await this.#worklet.dispatch('pause');
		this.#status = 'paused';

		this.#chunks.pause();
	}

	async stop() {
		if (!this.#context) throw new Error(`Recorder not initialized`);
		if (!this.#worklet.check()) return;

		this.#worklet.off('chunk', this.#onchunk);

		this.#status = 'stopping';
		await this.#worklet.dispatch('stop');
		this.#status = 'stopped';

		// Stop all audio tracks to release the microphone
		const tracks = this.#context.stream.getTracks();
		tracks.forEach(track => track.stop());
	}
}
