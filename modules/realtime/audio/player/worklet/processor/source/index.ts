interface IWrite {
	buffer: Float32Array;
	trackId: number;
}

class StreamProcessor extends AudioWorkletProcessor {
	#started = false;
	#interrupted = false;
	#bufferLength = 128;
	#write: IWrite = { buffer: new Float32Array(this.#bufferLength), trackId: null };
	#writeOffset = 0;
	#outputBuffers: IWrite[] = [];
	#trackSampleOffsets: Record<string, number> = {};

	constructor() {
		super();
		this.port.onmessage = this.#request.bind(this);
	}

	#writeData(float32Array: Float32Array, trackId: number = null) {
		let { buffer } = this.#write;
		let offset = this.#writeOffset;
		for (let i = 0; i < float32Array.length; i++) {
			buffer[offset++] = float32Array[i];
			if (offset >= buffer.length) {
				this.#outputBuffers.push(this.#write);
				this.#write = { buffer: new Float32Array(this.#bufferLength), trackId };
				buffer = this.#write.buffer;
				offset = 0;
			}
		}
		this.#writeOffset = offset;
		return true;
	}

	process(inputs: Float32Array[][], outputs: Float32Array[][]) {
		const output = outputs[0];
		const outputChannelData = output[0];
		const outputBuffers = this.#outputBuffers;

		if (this.#interrupted) {
			this.port.postMessage({ method: 'stop' });
			return false;
		} else if (outputBuffers.length) {
			/**
			 * If there are buffers in outputBuffers, start writing from the first buffer in the queue
			 * to the output channel data.
			 */
			this.#started = true;
			const { buffer, trackId } = outputBuffers.shift();
			for (let i = 0; i < outputChannelData.length; i++) {
				outputChannelData[i] = buffer[i] || 0;
			}
			if (trackId) {
				this.#trackSampleOffsets[trackId] = this.#trackSampleOffsets[trackId] || 0;
				this.#trackSampleOffsets[trackId] += buffer.length;
			}
			return true;
		} else if (this.#started) {
			/**
			 * If there is no buffered data and processing had previously started (#started),
			 * send a "stop" message and returns false to end processing.
			 */
			this.port.postMessage({ method: 'stop' });
			return false;
		} else {
			return true;
		}
	}

	#request(event: MessageEvent) {
		if (!event.data?.method) return;
		const { id, method } = event.data;

		let data: any, trackId: number;
		switch (method) {
			case 'write':
				const { buffer } = event.data.data;
				trackId = event.data.data.trackId;
				const float32Array = new Float32Array(buffer.length);

				// Convert Int16 to Float32
				buffer.forEach((data: number, index: number) => (float32Array[index] = data / 0x8000));
				this.#writeData(float32Array, trackId);
				break;
			case 'offset':
			case 'interrupt':
				trackId = this.#write.trackId;
				const offset = this.#trackSampleOffsets[trackId] || 0;

				method === 'interrupt' && (this.#interrupted = true);

				data = { trackId, offset };
				break;
			default: {
				throw new Error(`Method "\${method}" is invalid`);
			}
		}

		// Always send back a response
		this.port.postMessage({ method: 'response', id, data });
	}
}

registerProcessor('stream_processor', StreamProcessor);
