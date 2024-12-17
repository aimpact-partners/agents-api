import { permissions } from './permission';
import { Device } from './device';
import type { DeviceInfo } from './device';

export /*bundle*/ const devices = new (class Devices extends Map<string, Device> {
	#available = false;
	get available() {
		return this.#available;
	}

	get default(): Device {
		const devices = [...this.values()];
		const def = devices.find(device => device.default);
		return def ? def : devices[0];
	}

	constructor() {
		super();

		if (!navigator.mediaDevices || !('getUserMedia' in navigator.mediaDevices)) {
			this.#available = false;
			return;
		}

		navigator.mediaDevices.addEventListener('devicechange', async () => await this.prepare());
	}

	async prepare() {
		await permissions.request();
		if (permissions.state !== 'granted') return false;

		const devices: DeviceInfo[] = await (async () => {
			const devices = await navigator.mediaDevices.enumerateDevices();

			// The default device comes duplicated with another device in the same group
			// "Default - Internal Microphone (Built-in)" / "Internal Microphone (Built-in)"
			const def = devices.find(device => device.deviceId === 'default');

			// Only take the audioinputs devices and not the default device,
			// as we need to take the other device in the same group that the default device is
			const audioinputs = <DeviceInfo[]>devices.filter(device => device.kind === 'audioinput' && device !== def);

			// Search for the other device in the same group as the default device
			// (this is going to be the real default device)
			const other = audioinputs.find(device => device.groupId === def.groupId);
			const replacement = other ? other : def;
			(replacement as DeviceInfo).default = true;
			audioinputs.unshift(replacement);

			return audioinputs;
		})();

		devices.forEach(item => {
			const device = new Device(item);
			this.set(item.deviceId, device);
		});
	}
})();
