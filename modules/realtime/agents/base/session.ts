import type { ChannelStatusType } from '@aimpact/agents-api/realtime/channel';
import { Channel } from '@aimpact/agents-api/realtime/channel';
import type {
	ISession,
	ISessionConfig,
	ISessionCreatedServerEvent,
	ISessionUpdateClientEvent
} from '@aimpact/agents-api/realtime/interfaces/open-ai-events';
import { RealtimeUtils } from '@aimpact/agents-api/realtime/utils';
import { Events } from '@beyond-js/events/events';
import { Data as MessageDataType } from 'ws';
import type { BaseRealtimeAgent } from '.';

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

	#config: ISession;
	#sessionProps = [
		'modalities',
		'instructions',
		'voice',
		'output_audio_format',
		'tools',
		'tool_choice',
		'temperature',
		'max_output_tokens',
		'input_audio_format',
		'input_audio_transcription',
		'turn_detection'
	] as (keyof ISession)[];

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
				this.#config = this.#sessionConfig(event.session, this.#sessionProps);

				this.off('session.created', oncreated);

				// console.log('agent trigger: session.created');
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
			return;
		}

		if (!message.type) {
			// @TODO: Log error
			console.warn('Open AI message type is not defined:', message);
			return;
		}
		if (message.error) {
			console.error('message', message);
		}

		// console.log('server trigger', message.type);
		this.trigger(message.type, message);

		if (message.type === 'session.updated') {
			console.log('server trigger session.ready');
			this.trigger('session.ready', message);
			this.#agent.trigger('session.ready');
		}
	};

	send(event: string, data?: Record<string, any>) {
		if (this.status !== 'created') throw new Error(`Session is not created`);

		data = data || {};
		if (typeof data !== 'object') throw new Error(`data must be an object`);

		const id = data.event_id ? data.event_id : RealtimeUtils.generateId('evt_');
		data = Object.assign({ event_id: id, type: event }, data);

		this.#channel.send(JSON.stringify(data));
		return true;
	}

	destroy() {
		this.#channel.off('open', this.#onopen);
		this.#channel.off('close', this.#onclose);
		this.#channel.off('message', this.#onmessage);
		if (['open', 'connecting'].includes(this.#channel.status)) this.#channel.close();
	}

	update(value: Partial<ISessionConfig>) {
		this.#config = Object.assign({}, this.#config, value);
		const event: ISessionUpdateClientEvent = {
			type: 'session.update',
			event_id: RealtimeUtils.generateId('evt_'),
			session: this.#config
		};

		// Be sure that the session is created before updating it
		const update = () => this.send('session.update', event);
		this.status === 'created' ? update() : this.#agent.on('session.created', update);
	}

	async close() {
		return await this.#channel.close();
	}

	#sessionConfig<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
		const props = {} as Pick<T, K>;
		keys.forEach(key => (props[key] = obj[key]));
		return props;
	}
}
