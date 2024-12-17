import type { BaseRealtimeAgent } from '.';
import type { IChannelSettings, ChannelStatusType } from '@aimpact/agents-api/realtime/channel';
import type { ISessionCreatedServerEvent } from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import { Data as MessageDataType } from 'ws';
import { Channel } from '@aimpact/agents-api/realtime/channel';
import { Events } from '@beyond-js/events/events';
import { RealtimeUtils } from '@aimpact/agents-api/realtime/utils';

export /*bundle*/ interface ISessionSettings {
	key: string; // The Open AI API key
}

export /*bundle*/ type AgentStatusType = ChannelStatusType | 'created';

const defaults = {
	url: 'wss://api.openai.com/v1/realtime',
	model: 'gpt-4o-realtime-preview-2024-10-01'
};

export class AgentSession extends Events {
	#agent: BaseRealtimeAgent;

	#channel: Channel;
	get channel() {
		return this.#channel;
	}

	#id: string;
	#model: string;

	get error() {
		return this.#channel.error;
	}

	#created = false;
	get created() {
		return this.#created;
	}

	get status(): AgentStatusType {
		const { status } = this.#channel;
		return status === 'open' && this.#created ? 'created' : status;
	}

	constructor(agent: BaseRealtimeAgent, settings: ISessionSettings) {
		super();

		if (!settings?.key) throw new Error('OpenAI API key must be specified');

		this.#agent = agent;

		const headers = (() => {
			const { key } = settings;
			if (Channel.browser) {
				return ['realtime', `openai-insecure-api-key.${key}`, 'openai-beta.realtime-v1'];
			} else {
				return { Authorization: `Bearer ${key}`, 'OpenAI-Beta': 'realtime=v1' };
			}
		})();

		this.#channel = new Channel({ url: `${defaults.url}?model=${defaults.model}`, headers });
		this.#channel.on('open', this.#onopen);
		this.#channel.on('close', this.#onclose);
		this.#channel.on('message', this.#onmessage);
	}

	/**
	 * Connect with the server
	 *
	 * Take care that the session status is 'connected' after the 'session.created' event is received,
	 * not when the socket is connected.
	 */
	connect(): Promise<boolean> {
		if (this.status !== 'closed') throw new Error(`Session status must be 'closed' before trying to connect it`);

		return new Promise(resolve => {
			let timer: ReturnType<typeof setInterval>;

			const oncreated = (event: ISessionCreatedServerEvent) => {
				clearTimeout(timer);

				this.#created = true;
				this.#created = true;
				this.off('session.created', oncreated);

				this.#agent.trigger('session.created');

				// @TODO: Session created. @TODO: handle session data (id, settings)
				resolve(true);
			};

			this.on('session.created', oncreated);

			const ontimeout = () => {
				// @TODO: Log that the session hasn't been created
				this.#channel.close();
				resolve(false);
			};

			// Wait some seconds to the session to be created
			timer = setTimeout(ontimeout, 4000);

			this.#channel.connect();
		});
	}

	#onopen = () => this.trigger('open');

	#onclose = () => {
		// @TODO: Add a logic to log and/or reconnect the channel when it unexpectedly closed
		this.#created = false;
		this.trigger('close');
	};

	#onmessage = (data: MessageDataType) => {
		let message: any;
		try {
			message = JSON.parse(<string>data);
		} catch (exc) {
			// @TODO: Log error messages
			console.warn(`Open AI message cannot be parsed: ${exc.message}`, exc);
		}

		if (!message.type) {
			// @TODO: Log error
			console.warn('Open AI message type is not defined:', message);
			return;
		}

		this.trigger(message.type, message);
	};

	send(event: string, data?: Record<string, any>) {
		if (this.status !== 'created') throw new Error(`Session is not created`);

		data = data || {};
		if (typeof data !== 'object') throw new Error(`data must be an object`);
		data = Object.assign({ event_id: RealtimeUtils.generateId('evt_'), type: event }, data);

		this.#channel.send(JSON.stringify(data));
		return true;
	}

	destroy() {
		this.#channel.off('open', this.#onopen);
		this.#channel.off('close', this.#onclose);
		this.#channel.off('message', this.#onmessage);
		if (['open', 'connecting'].includes(this.#channel.status)) this.#channel.close();
	}

	async close() {
		return await this.#channel.close();
	}
}
