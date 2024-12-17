import type { WorkletBridge } from '.';
import { WorkletDispatcher } from './dispatcher';

export /*bundle*/ class WorkletNode extends AudioWorkletNode {
	#bridge: WorkletBridge;
	get bridge() {
		return this.#bridge;
	}

	#dispatcher: WorkletDispatcher;
	get dispatcher() {
		return this.#dispatcher;
	}

	constructor(bridge: WorkletBridge, context: AudioContext, name: string, timeout = 1000) {
		super(context, name);
		this.#bridge = bridge;
		this.#dispatcher = new WorkletDispatcher(this, timeout);
	}
}
