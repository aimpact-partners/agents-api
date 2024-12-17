import { AudioProcessorSrc } from './worklets/audio_processor.js';
import { AudioAnalysis, AudioAnalysisOutputType } from './analysis/audio_analysis.js';
import { WavPacker, WavPackerAudioType } from './wav_packer.js';
import { InputHandler } from './input/index.js';

/**
 * Decodes audio into a wav file
 */
export interface DecodedAudioType {
	blob: Blob;
	url: string;
	values: Float32Array;
	audioBuffer: AudioBuffer;
}

/**
 * Records live stream of user audio as PCM16 "audio/wav" data
 */
export class WavRecorder {
	private scriptSrc: string;
	private sampleRate: number;
	getSampleRate(): number {
		return this.sampleRate;
	}

	private outputToSpeakers: boolean;
	private debug: boolean;
	private _deviceChangeCallback: ((devices: MediaDeviceInfo[]) => void) | null;
	private _devices: MediaDeviceInfo[];
	private stream: MediaStream | null;
	private processor: AudioWorkletNode | null;
	private source: MediaStreamAudioSourceNode | null;
	private node: AudioNode | null;
	private analyser: AnalyserNode | null;
	private recording: boolean;
	private _lastEventId: number;
	private eventReceipts: Record<number, any>;
	private eventTimeout: number;
	private _chunkProcessor: (data: { mono: ArrayBuffer; raw: ArrayBuffer }) => void;
	private _chunkProcessorSize: number | undefined;
	private _chunkProcessorBuffer: { raw: ArrayBuffer; mono: ArrayBuffer };

	constructor({ sampleRate = 44100, outputToSpeakers = false, debug = false } = {}) {
		// Initialize default values and properties
		this.scriptSrc = AudioProcessorSrc;
		this.sampleRate = sampleRate;
		this.outputToSpeakers = outputToSpeakers;
		this.debug = debug;
		this._deviceChangeCallback = null;
		this._devices = [];
		this.stream = null;
		this.processor = null;
		this.source = null;
		this.node = null;
		this.analyser = null;
		this.recording = false;
		this._lastEventId = 0;
		this.eventReceipts = {};
		this.eventTimeout = 5000;
		this._chunkProcessor = () => {};
		this._chunkProcessorSize = undefined;
		this._chunkProcessorBuffer = {
			raw: new ArrayBuffer(0),
			mono: new ArrayBuffer(0)
		};
	}

	/**
	 * Logs messages to console if debugging is enabled
	 */
	log(...args: any[]): true {
		this.debug && console.log(...args);
		return true;
	}

	getStatus(): 'ended' | 'paused' | 'recording' {
		if (!this.processor) {
			return 'ended';
		} else if (!this.recording) {
			return 'paused';
		} else {
			return 'recording';
		}
	}

	/**
	 * Starts recording audio from the connected microphone stream
	 * @param chunkProcessor Function to handle each audio chunk
	 * @param chunkSize Size of the chunks to be processed
	 */
	async record(
		chunkProcessor: (data: { mono: ArrayBuffer; raw: ArrayBuffer }) => any = () => {},
		chunkSize = 8192
	): Promise<true> {
		if (!this.processor) {
			throw new Error('Session ended: please call .begin() first');
		} else if (this.recording) {
			throw new Error('Already recording: please call .pause() first');
		} else if (typeof chunkProcessor !== 'function') {
			throw new Error(`chunkProcessor must be a function`);
		}
		this._chunkProcessor = chunkProcessor;
		this._chunkProcessorSize = chunkSize;
		this._chunkProcessorBuffer = {
			raw: new ArrayBuffer(0),
			mono: new ArrayBuffer(0)
		};
		this.log('Recording ...');
		await this._event('start');
		this.recording = true;
		return true;
	}

	/**
	 * Ends the current recording session and saves the result as a WAV file
	 */
	async end(): Promise<WavPackerAudioType> {
		if (!this.processor) {
			throw new Error('Session ended: please call .begin() first');
		}

		const _processor = this.processor;

		this.log('Stopping ...');
		await this._event('stop');
		this.recording = false;

		// Export recorded data
		const exportData = await this._event('export', {}, _processor);

		// Disconnect audio nodes and clean up
		this.processor.disconnect();
		this.source!.disconnect();
		this.node!.disconnect();
		this.analyser!.disconnect();

		// Set references to null to allow garbage collection
		this.stream = null;
		this.processor = null;
		this.source = null;
		this.node = null;

		// Use WavPacker to create WAV file from exported data
		const packer = new WavPacker();
		const result = packer.pack(this.sampleRate, exportData.audio);
		return result;
	}

	/**
	 * Manually request permission to use the microphone
	 */
	async requestPermission(): Promise<true> {
		const permissionStatus = await navigator.permissions.query({
			name: 'microphone'
		});
		if (permissionStatus.state === 'denied') {
			window.alert('You must grant microphone access to use this feature.');
		} else if (permissionStatus.state === 'prompt') {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true
				});
				const tracks = stream.getTracks();
				tracks.forEach(track => track.stop());
			} catch (e) {
				window.alert('You must grant microphone access to use this feature.');
			}
		}
		return true;
	}

	/**
	 * List all eligible devices for recording, will request permission to use microphone
	 */
	async listDevices(): Promise<Array<MediaDeviceInfo & { default: boolean }>> {
		if (!navigator.mediaDevices || !('enumerateDevices' in navigator.mediaDevices)) {
			throw new Error('Could not request user devices');
		}
		await this.requestPermission();
		const devices = await navigator.mediaDevices.enumerateDevices();
		const audioDevices = devices.filter(device => device.kind === 'audioinput');
		const defaultDeviceIndex = audioDevices.findIndex(device => device.deviceId === 'default');
		const deviceList: Array<MediaDeviceInfo & { default: boolean }> = [];
		if (defaultDeviceIndex !== -1) {
			let defaultDevice = audioDevices.splice(defaultDeviceIndex, 1)[0];
			let existingIndex = audioDevices.findIndex(device => device.groupId === defaultDevice.groupId);
			if (existingIndex !== -1) {
				defaultDevice = audioDevices.splice(existingIndex, 1)[0];
			}
			defaultDevice.default = true;
			deviceList.push(defaultDevice);
		}
		return deviceList.concat(audioDevices);
	}

	/**
	 * Sets device change callback, remove if callback provided is `null`
	 * @param {(devices: MediaDeviceInfo[]) => void | null} callback
	 */
	listenForDeviceChange(callback: ((devices: MediaDeviceInfo[]) => void) | null): true {
		if (callback === null && this._deviceChangeCallback) {
			navigator.mediaDevices.removeEventListener('devicechange', this._deviceChangeCallback);
			this._deviceChangeCallback = null;
		} else if (callback !== null) {
			// Debounce device change events to execute the latest callback only
			let lastId = 0;
			let lastDevices: MediaDeviceInfo[] = [];
			const serializeDevices = (devices: MediaDeviceInfo[]) =>
				devices
					.map(d => d.deviceId)
					.sort()
					.join(',');
			const cb = async () => {
				let id = ++lastId;
				const devices = await this.listDevices();
				if (id === lastId) {
					if (serializeDevices(lastDevices) !== serializeDevices(devices)) {
						lastDevices = devices;
						callback(devices.slice());
					}
				}
			};
			navigator.mediaDevices.addEventListener('devicechange', cb);
			cb();
			this._deviceChangeCallback = cb;
		}
		return true;
	}

	/**
	 * Clears the audio buffer, empties stored recording
	 */
	async clear() {
		if (!this.processor) {
			throw new Error('Session ended: please call .begin() first');
		}
		await this._event('clear');
		return true;
	}

	/**
	 * Reads the current audio stream data
	 */
	async read(): Promise<Record<string, any>> {
		if (!this.processor) {
			throw new Error('Session ended: please call .begin() first');
		}
		this.log('Reading ...');
		const result = await this._event('read');
		return result;
	}

	/**
	 * Saves the current audio stream to a file
	 * @param {boolean} [force] Force saving while still recording
	 */
	async save(force: boolean = false): WavPackerAudioType {
		if (!this.processor) {
			throw new Error('Session ended: please call .begin() first');
		}
		if (!force && this.recording) {
			throw new Error('Currently recording: please call .pause() first, or call .save(true) to force');
		}
		this.log('Exporting ...');
		const exportData = await this._event('export');
		const packer = new WavPacker();
		const result = packer.pack(this.sampleRate, exportData.audio);
		return result;
	}

	/**
	 * Performs a full cleanup of WavRecorder instance
	 * Stops actively listening via microphone and removes existing listeners
	 */
	async quit(): Promise<true> {
		this.listenForDeviceChange(null);
		if (this.processor) {
			await this.end();
		}
		return true;
	}
}
