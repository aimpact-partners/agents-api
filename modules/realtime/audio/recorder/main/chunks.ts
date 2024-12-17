import { WavPacker } from '@aimpact/agents-api/realtime/audio/packer';

export interface IChunksConfig {
	size: number;
}

export class RecorderChunks {
	#buffer: { raw: ArrayBuffer; mono: ArrayBuffer } = { raw: new ArrayBuffer(0), mono: new ArrayBuffer(0) };
	#size: number;

	constructor(config?: IChunksConfig) {
		this.#size = config?.size ?? 8192;
	}

	process({ raw, mono }: { raw: ArrayBuffer; mono: ArrayBuffer }) {
		if (!this.#size) return { raw, mono };

		const buffer = this.#buffer;
		this.#buffer = {
			raw: WavPacker.mergeBuffers(buffer.raw, raw),
			mono: WavPacker.mergeBuffers(buffer.mono, mono)
		};

		if (this.#buffer.mono.byteLength >= this.#size) {
			const buffer = this.#buffer;
			this.#buffer = {
				raw: new ArrayBuffer(0),
				mono: new ArrayBuffer(0)
			};

			return buffer;
		}
	}

	pause() {
		this.#buffer.raw.byteLength && this.process(this.#buffer);
	}
}
