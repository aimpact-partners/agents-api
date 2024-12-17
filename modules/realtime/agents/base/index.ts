import type { AgentEventName } from '@aimpact/agents-api/realtime/interfaces/agent-events';
import { ISessionSettings } from './session';
import { AgentSession } from './session';
import { Conversation } from './conversation';
import { Events } from '@beyond-js/events/events';

export /*bundle*/ interface IVoiceAudioDetection {
	type: 'server_vad';
	threshold: number;
	prefix_padding_ms: number;
	silence_duration_ms: number;
}

export /*bundle*/ class BaseRealtimeAgent extends Events {
	/**
	 * Voice Audio Detection
	 */
	#vad?: IVoiceAudioDetection;
	get vad() {
		return this.#vad;
	}
	set vad(value) {
		this.#vad = value;
	}

	#session: AgentSession;
	get session() {
		return this.#session;
	}

	#manager: Conversation;
	get manager() {
		return this.#manager;
	}

	get status() {
		return this.#session.status;
	}

	constructor(settings: ISessionSettings) {
		super();
		this.#session = new AgentSession(this, settings);
		this.#manager = new Conversation(this);
	}

	triger(event: AgentEventName, ...data: any[]) {
		return super.trigger(event, ...data);
	}

	async connect(): Promise<boolean> {
		return await this.#session.connect();
	}

	async close() {
		return await this.#session.close();
	}
}
