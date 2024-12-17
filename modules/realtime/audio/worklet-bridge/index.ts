import { Events } from '@beyond-js/events/events';
import { WorkletNode } from './node';

export /*bundle*/ abstract class WorkletBridge {
	#context: AudioContext;
	get context() {
		return this.#context;
	}

	#node: WorkletNode;
	get node() {
		return this.#node;
	}

	#name: string;
	get name() {
		return this.#name;
	}

	#src: string;
	get src() {
		return this.#src;
	}

	#timeout: number;
	get timeout() {
		return this.#timeout;
	}

	#prepared = false;
	get prepared() {
		return this.#prepared;
	}

	#preparing = false;
	get preparing() {
		return this.#preparing;
	}

	#error: Error;
	get error() {
		return this.#error;
	}

	#events: Events;
	get _events() {
		return this.#events;
	}

	on(event: string, callback: (...data: any[]) => any) {
		return this.#events.on(event, callback);
	}

	off(event: string, callback: (...data: any[]) => any) {
		return this.#events.off(event, callback);
	}

	constructor(context: AudioContext, name: string, src: string, timeout = 1000) {
		this.#context = context;
		this.#name = name;
		this.#src = src;
		this.#timeout = timeout;
		this.#events = new Events();
	}

	check() {
		if (!this.#prepared) throw new Error('Worklet not prepared. Call `setup` method before calling this method.');
		if (this.#error) throw new Error('Worklet is in an error state');
		if (!this.#node) throw new Error('Worklet node not created. Call the `create` method first');
		return true;
	}

	async setup(): Promise<Error> {
		if (this.#prepared || this.#preparing) throw new Error('Setup method already executed');
		if (this.#error) throw new Error('Setup method has already been executed with errors found');
		this.#preparing = true;

		try {
			// Load and register the AudioWorklet module
			!this.#prepared && (await this.#context.audioWorklet.addModule(this.#src));
			this.#prepared = true;
		} catch (exc) {
			console.log(`Error loading "${this.#name}" worklet:\n• ${exc.message}`);
			this.#error = exc;
			return exc;
		} finally {
			this.#preparing = false;
		}
	}

	create() {
		if (this.#node) throw new Error('Worklet node already created');
		this.#node = new WorkletNode(this, this.#context, this.#name, this.#timeout);
	}

	connect(destination: AudioNode, output?: number, input?: number) {
		if (!this.check()) return;
		return this.#node.connect(destination, output, input);
	}

	disconnect() {
		if (!this.check()) return;

		const node = this.#node;
		this.#node = void 0;
		return node.disconnect();
	}

	_onmessage(e: MessageEvent): void {
		const { method, data } = e.data;
		if (!method || typeof method !== 'string') {
			const error =
				`Audio worklet "${this.#name}" ` +
				`has triggered an invalid event with an invalid or undefined method name. ` +
				`If for some reason in the future it would be required to receive events without ` +
				`the structure currently implemented, just make a change in this validation` +
				`Check the event data:`;
			console.error(error, e);
			return;
		}

		this.#events.trigger(method, data);
	}

	async dispatch(method: string, data?: any): Promise<any> {
		if (!this.check()) return;
		return this.#node.dispatcher.dispatch(method, data);
	}
}
