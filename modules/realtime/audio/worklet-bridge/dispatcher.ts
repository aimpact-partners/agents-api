import type { WorkletNode } from './node';
import { PendingPromise } from '@beyond-js/kernel/core';
import { Events } from '@beyond-js/events/events';

export class WorkletDispatcher extends Events {
	#node: WorkletNode;
	#autoincrement = 0;
	#timeout: number;
	#responses: Map<number, PendingPromise<any>> = new Map();

	constructor(node: WorkletNode, timeout = 5000) {
		super();
		this.#node = node;
		this.#timeout = timeout;

		node.port.onmessage = this.#onmessage.bind(this);
	}

	dispatch(method: string, data?: any): Promise<any> {
		const id = this.#autoincrement++;
		this.#node.port.postMessage({ method, id, data });

		const promise = new PendingPromise();
		this.#responses.set(id, promise);

		const timedout = () => {
			this.#responses.delete(id);
			promise.reject({ code: 0, text: `Request method "${method}" has timed out` });
		};

		this.#responses.set(id, promise);
		setTimeout(timedout, this.#timeout);

		return promise;
	}

	#onmessage(e: MessageEvent) {
		const { method, id, data } = e.data;
		if (method !== 'response') {
			this.#node.bridge._onmessage(e);
			return;
		}

		if (id === void 0) throw new Error(`Response id is undefined on method "${method}"`);
		if (!this.#responses.has(id)) return; // Request could have reached its time out limit

		const promise = this.#responses.get(id);
		this.#responses.delete(id);
		promise.resolve({ data });
	}
}
