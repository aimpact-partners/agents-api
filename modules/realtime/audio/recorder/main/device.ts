import type { IRecorderConfig } from './recorder';
import { Recorder } from './recorder';

export interface DeviceInfo extends MediaDeviceInfo {
	default?: boolean;
}

export /*bundle*/ interface IDevice {
	get id(): string;
	get label(): string;
	get default(): boolean;
	get recorder(): Recorder;

	record(config: IRecorderConfig): Promise<void>;
	pause(): Promise<void>;
	stop(): Promise<void>;
}

export class Device implements IDevice {
	#id: string;
	get id() {
		return this.#id;
	}

	#label: string;
	get label() {
		return this.#label;
	}

	#groupId: string;
	get groupId() {
		return this.#groupId;
	}

	#default: boolean;
	get default() {
		return this.#default;
	}

	#recorder: Recorder;
	get recorder() {
		return this.#recorder;
	}

	constructor(device: DeviceInfo) {
		this.#id = device.deviceId;
		this.#label = device.label;
		this.#default = !!device.default;
		this.#groupId = device.groupId;
	}

	async record(config: IRecorderConfig) {
		!this.#recorder && (this.#recorder = new Recorder(this, config));
		await this.#recorder.record();
	}

	async pause() {
		if (!this.#recorder) throw new Error('Recorder has not been initialized');
		await this.#recorder.pause();
	}

	async stop() {
		if (!this.#recorder) throw new Error('Recorder has not been initialized');
		await this.#recorder.stop();
	}
}
