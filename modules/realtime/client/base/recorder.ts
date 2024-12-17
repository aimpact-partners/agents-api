import type { IDevice } from '@aimpact/agents-api/realtime/audio/recorder';
import { Events } from '@beyond-js/kernel/core';

export class Recorder extends Events {
	#device: IDevice;
	get device() {
		return this.#device;
	}
	set device(device: IDevice) {
		if (this.#device === device) return;
		if (this.#device && this.status !== 'stopped') {
			throw `Recorder is actually in "${this.status}" state. Stop it before changing the device`;
		}

		this.#device = device;
	}

	get status() {
		return this.#device?.recorder?.status;
	}

	get error() {
		return this.#device?.recorder?.error;
	}

	#onchunk = (data: { raw: ArrayBuffer; mono: ArrayBuffer }) => {
		if (!data) return;
		this.trigger('chunk', data);
	};

	async record() {
		const device = this.#device;
		if (!device) throw new Error(`Device hasn't been selected`);

		const config = { samplerate: 24000, chunks: { size: 8192 }, debug: false };
		await device.record(config);
		if (device.recorder.error) {
			console.log('Recorder Error:', device.recorder.error);
			return;
		}

		device.recorder.on('chunk', this.#onchunk);
	}

	async pause() {
		const device = this.#device;
		if (!device) throw new Error(`Device hasn't been selected`);

		device.recorder.off('chunk', this.#onchunk);
		await device.recorder.pause();
	}

	async stop() {
		const device = this.#device;
		if (!device) return;

		device.recorder.off('chunk', this.#onchunk);
		if (['stopped', 'stopping', 'error'].includes(device.recorder?.status)) return;
		await device.recorder.stop();
	}
}
