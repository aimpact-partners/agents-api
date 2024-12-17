import type { WebSocket as WebSocketNode, Data as MessageDataType } from 'ws';
import { Events } from '@beyond-js/events/events';

declare function bimport(module: string): Promise<any>;

export /*bundle*/ type ChannelStatusType = 'closed' | 'connecting' | 'open' | 'closing' | 'error';

/**
 * Interface defining settings for initializing the web socket.
 */
export /*bundle*/ interface IChannelSettings {
	url: string;
	headers?: { [key: string]: string } | string[];
}

export /*bundle*/ class Channel extends Events {
	#settings: IChannelSettings;

	#ws: WebSocket | WebSocketNode;
	get ws() {
		return this.#ws;
	}

	// Determine if running in the browser or Node.js
	static get browser() {
		return !(globalThis as any).process?.versions?.node;
	}

	get status(): ChannelStatusType {
		if (!this.#ws) return 'closed';

		const { readyState: state } = this.#ws;
		if (this.#error) {
			return 'error';
		} else if (state === this.#ws.CONNECTING) {
			return 'connecting';
		} else if (state === this.#ws.OPEN) {
			return 'open';
		} else if (state === this.#ws.CLOSING) {
			return 'closing';
		} else if (state === this.#ws.CLOSED) {
			return 'closed';
		}
	}

	#error: Error;
	get error() {
		return this.#error;
	}

	#listeners: { [event: string]: any } = {};

	constructor(settings: IChannelSettings) {
		super();
		if (!settings?.url) throw new Error(`Invalid settings. Attribute 'url' must be specified`);

		this.#settings = settings;
	}

	async #create() {
		if (Channel.browser) {
			// Browser WebSocket setup
			const WebSocket = (globalThis as any).WebSocket;

			const { url, headers } = this.#settings;
			if (headers && !(headers instanceof Array)) {
				throw new Error('Invalid headers specification. An array was expected when client is a browser');
			}

			this.#ws = <WebSocket>new WebSocket(url, headers);

			// Define event handlers for the browser
			this.#listeners = {
				open: () => this.trigger('open'),
				message: (event: MessageEvent) => this.trigger('message', event.data),
				close: (event: CloseEvent) => this.trigger('close', event.code, event.reason),
				error: (event: Event) => this.trigger('error', event)
			};

			// Attach listeners using addEventListener
			for (const [event, listener] of Object.entries(this.#listeners)) {
				this.#ws.addEventListener(event, listener);
			}
		} else {
			// Node.js WebSocket setup
			const { WebSocket } = <{ WebSocket: typeof WebSocketNode }>await bimport('ws');

			const { url, headers } = <{ url: string; headers: { [key: string]: string } }>this.#settings;
			if (headers && headers instanceof Array) {
				throw new Error('Invalid headers specification. An object was expected when running on node.js');
			}

			this.#ws = <WebSocketNode>new WebSocket(url, { headers });

			// Define event handlers for node.js
			this.#listeners = {
				open: () => this.trigger('open'),
				message: (data: MessageDataType) => this.trigger('message', data),
				close: (code: number, reason: string) => this.trigger('close', code, reason),
				error: (error: Error) => this.trigger('error', error)
			};

			// Attach listeners using .on
			for (const [event, listener] of Object.entries(this.#listeners)) {
				this.#ws.on(event, listener);
			}
		}

		// Attach to the close event to cleanup and remove the web socket instance
		// Socket can be reconnected by calling the `connect` method
		this.on('close', this.#onclose);
	}

	/**
	 * Sends data through the WebSocket
	 */
	send(data: any): void {
		const { status } = this;
		if (status !== 'open') throw new Error(`Channel is not in an 'open' state. Actual state is '${status}'`);

		this.#ws.send(data);
	}

	/**
	 * Removes all event listeners and closes the WebSocket.
	 */
	#cleanup(): void {
		// Remove all listeners based on the environment
		if (Channel.browser) {
			// Browser: Remove listeners with removeEventListener
			for (const [event, listener] of Object.entries(this.#listeners)) {
				(<WebSocket>this.#ws).removeEventListener(event, listener);
			}
		} else {
			// Node.js: Remove listeners with off (for ws library in Node.js)
			for (const [event, listener] of Object.entries(this.#listeners)) {
				(<WebSocketNode>this.#ws).off(event, listener);
			}
		}
	}

	#onclose = () => {
		this.#cleanup();
		this.#ws = void 0;
		this.off('close', this.#onclose);
	};

	async connect(): Promise<boolean> {
		if (this.#ws) throw new Error(`Socket status must be 'closed' before attempting to connect`);
		await this.#create();

		const promise: Promise<boolean> = new Promise(resolve => {
			const off = () => {
				this.off('open', onopen);
				this.off('error', onerror);
				this.off('close', onclose);
			};

			const onopen = () => {
				off();
				resolve(true);
			};

			const onerror = (ws: WebSocket, error: Error) => {
				off();
				this.#error = error;
				resolve(false);
			};

			const onclose = (ws: WebSocket, code: number, reason: Buffer) => {
				off();
				this.#ws = void 0;
				if (this.#error) return;

				this.#error = new Error(`WebSocket closed unexpectedly. Code: ${code}. Reason: ${reason}`);
				resolve(false);
			};

			this.on('open', onopen);
			this.on('error', onerror);
			this.on('close', onclose);
		});

		return await promise;
	}

	/**
	 * Closes the WebSocket connection and waits for the close event.
	 */
	async close(): Promise<void> {
		const ws = this.#ws;
		if (ws.readyState === WebSocket.CLOSED) {
			return; // Already closed
		}

		return new Promise(resolve => {
			// Listen for the close event
			const onclose = () => setTimeout(resolve, 0);

			// Attach the close listener
			this.on('close', onclose);

			// Initiate the closing handshake
			ws.close();
		});
	}
}
