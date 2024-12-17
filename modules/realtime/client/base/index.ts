import type { IVoiceAudioDetection, AgentStatusType } from '@aimpact/agents-api/realtime/agents/base';
import { Events } from '@beyond-js/events/events';
import { VoiceAudioDetection } from './vad';
import { ActiveConversation } from './active-conversation';
import { Recorder } from './recorder';
import { StreamPlayer } from '@aimpact/agents-api/realtime/audio/player';
import { Router } from './router';

export /*bundle*/ abstract class ClientSessionBase extends Events {
	abstract get status(): AgentStatusType;

	#conversation: ActiveConversation;
	get conversation() {
		return this.#conversation;
	}

	#router: Router;
	get router() {
		return this.#router;
	}

	/**
	 * Voice Audio Detection
	 */
	#vad: VoiceAudioDetection;
	get vad() {
		return this.#vad;
	}

	#recorder: Recorder;
	get recorder() {
		return this.#recorder;
	}

	#player: StreamPlayer;
	get player() {
		return this.#player;
	}

	get valid() {
		return !this.#recorder.error && !this.#player.error;
	}

	#listeners = { listen: this.listen.bind(this) };

	constructor(agent: Events, session: Events, settings: { vad: IVoiceAudioDetection }) {
		super();
		this.#vad = new VoiceAudioDetection(this, settings.vad);
		this.#conversation = new ActiveConversation(this);
		this.#player = new StreamPlayer({ samplerate: 24000 });
		this.#recorder = new Recorder();

		this.#router = new Router(this, agent, session);
	}

	async connect(): Promise<boolean> {
		this.#router.initialise();
		await this.#player.connect();
		this.#recorder.on('chunk', this.#listeners.listen);
		return true;
	}

	async close(): Promise<void> {
		this.#router.release();
		this.#recorder.stop();
		this.#recorder.off('chunk', this.#listeners.listen);
		this.#player.disconnect();
	}

	abstract listen(data: { mono: Int16Array; raw: Int16Array }): void;
}
