import { Audio } from './audio';

class AudioProcessor extends AudioWorkletProcessor {
	#audio: Audio;

	constructor() {
		super();

		this.port.onmessage = this.#request.bind(this);
		this.#audio = new Audio(this.port);
	}

	#request(event: MessageEvent) {
		if (!event.data?.method) return;
		const { id, method } = event.data;

		let data: any;
		switch (method) {
			case 'record':
				this.#audio.recording = true;
				break;
			case 'pause':
				this.#audio.recording = false;
				break;
			case 'stop':
				this.#audio.recording = false;
				this.#audio.reset();
				break;
			default:
				throw new Error(`Method "\${method}" is invalid`);
		}

		// Always send back a response
		this.port.postMessage({ method: 'response', id, data });
	}

	process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: any): boolean {
		return this.#audio.process(inputs, outputs, parameters);
	}
}

registerProcessor('recorder_processor', AudioProcessor);
