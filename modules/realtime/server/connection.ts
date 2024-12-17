import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { AgentV2 } from '@aimpact/agents-api/realtime/agents/v2';
import { RealtimeUtils } from '@aimpact/agents-api/realtime/utils';
import * as dotenv from 'dotenv';

dotenv.config();

const { OPENAI_API_KEY } = process.env;

type RouterFunctionType = (event: string, data: any) => void;

const events = ['session.created', 'conversation.item.created', 'conversation.item.audio.delta', 'user.speech.started'];

export class RealtimeConversationConnection {
	#ws: WebSocket;
	#agent: AgentV2;

	#routes: Map<string, RouterFunctionType> = new Map();

	constructor(ws: WebSocket, request: IncomingMessage) {
		this.#ws = ws;

		ws.on('message', this.#onmessage);
		ws.on('close', this.#onclose);

		const agent = (this.#agent = new AgentV2({ key: OPENAI_API_KEY }));

		/**
		 * Route the events from the agent to the client
		 */
		events.forEach(event => {
			const route = (data: any) => this.#ws.send(JSON.stringify({ event, data }));
			this.#routes.set(event, route);
			agent.on(event, route);
		});

		// Automatically connect the agent
		agent.connect();
	}

	/**
	 * Messages received from the client (browser) that need to be sent to the agent
	 * @param message
	 */
	#onmessage = (message: any) => {
		let event: string, data: any;

		try {
			const parsed = JSON.parse(message);
			({ event, data } = parsed);
		} catch (exc) {
			console.warn(`Unable to parse realtime agent received message:`, message, exc.message);
			return;
		}

		try {
			switch (event) {
				case 'listen':
					const audio = RealtimeUtils.base64ToArrayBuffer(data.audio);
					this.#agent.manager.listen(new Int16Array(audio));
					break;
				default:
					const error = `Realtime agent received message seems to be invalid, event name is not defined:`;
					console.warn(error, message);
					break;
			}
		} catch (exc) {
			console.error(`Error found processing "${event}" event:`, exc);
		}
	};

	#onclose = () => {
		events.forEach(event => {
			const route = this.#routes.get(event);
			this.#routes.delete(event);
			this.#agent.off(event, route);
		});

		this.#ws.on('message', this.#onmessage);
		this.#ws.on('close', this.#onclose);
	};
}
