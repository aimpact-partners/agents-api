import type { ClientSessionBase } from '.';
import type { Events } from '@beyond-js/events/events';
import type { AgentEventName } from '@aimpact/agents-api/realtime/interfaces/agent-events';

type EventName = AgentEventName | 'session.close' | 'session.open';

enum EventSource {
	AGENT = 0,
	SESSION
}

enum EventDestination {
	CONVERSATION = 0,
	CLIENT
}

interface IEventRoute {
	source: EventSource;
	destination?: EventDestination;
	name?: EventName;
}

/**
 * The router routes the events from the agent (or the session of the agent), to
 * the client, or the conversation of the client.
 */
export class Router {
	#client: ClientSessionBase;
	#agent: Events;
	#session: Events;

	/**
	 * By default:
	 * - The events received from the session (EventSource.SESSION) are routed to
	 * the client, and the events.
	 * - The events received from the agent are routed to active conversation.
	 */
	#events: Map<AgentEventName | 'open' | 'close', IEventRoute> = new Map([
		['open', { source: EventSource.SESSION, name: 'session.open' }],
		['close', { source: EventSource.SESSION, name: 'session.close' }],
		['session.created', { source: EventSource.AGENT, destination: EventDestination.CLIENT }],
		['conversation.item.created', { source: EventSource.AGENT }],
		['conversation.item.audio.delta', { source: EventSource.AGENT }],
		['user.speech.started', { source: EventSource.AGENT }]
	]);
	#listeners: Map<string, (data: any) => void> = new Map();

	#initialised = false;
	get initialised() {
		return this.#initialised;
	}

	constructor(client: ClientSessionBase, agent: Events, session: Events) {
		this.#client = client;
		this.#agent = agent;
		this.#session = session;
	}

	initialise() {
		if (this.#initialised) return;
		this.#initialised = true;

		this.#events.forEach((specs, event) => {
			const listener = (data?: any) => {
				const destination: EventDestination = (() => {
					if (specs.destination !== void 0) return specs.destination;

					// As specs.destination is not set, set the default
					return specs.source === EventSource.SESSION
						? EventDestination.CLIENT
						: EventDestination.CONVERSATION;
				})();

				// The event name can be renamed when triggered
				const renamed = specs.name ? specs.name : event;

				if (destination === EventDestination.CLIENT) {
					this.#client.trigger(renamed, data);
				} else if (destination === EventDestination.CONVERSATION) {
					this.#client.conversation.process(renamed, data);
				}
			};

			this.#listeners.set(event, listener);
			specs.source === EventSource.SESSION && this.#session.on(event, listener);
			specs.source === EventSource.AGENT && this.#agent.on(event, listener);
		});
	}

	release() {
		if (!this.#initialised) throw new Error(`Router hasn't been initialised`);
		this.#initialised = false;

		this.#events.forEach((specs, event) => {
			const listener = this.#listeners.get(event);

			specs.source === EventSource.SESSION && this.#session.off(event, listener);
			specs.source === EventSource.AGENT && this.#agent.off(event, listener);
		});
	}
}
