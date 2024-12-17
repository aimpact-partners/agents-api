import type { IVoiceAudioDetection, AgentStatusType } from '@aimpact/agents-api/realtime/agents/base';
import { ClientSessionBase } from '@aimpact/agents-api/realtime/client/base';
import { Channel } from './channel';
import { RealtimeUtils } from '@aimpact/agents-api/realtime/utils';

export /*bundle*/ class ClientSession extends ClientSessionBase {
	#channel: Channel;

	get status(): AgentStatusType {
		return this.#channel.status;
	}

	get error() {
		return this.#channel.error;
	}

	constructor(settings: { vad: IVoiceAudioDetection }) {
		const channel = new Channel();
		super(channel, channel, settings);

		this.#channel = channel;
	}

	async connect(): Promise<boolean> {
		const ok = await this.#channel.connect();
		ok && (await super.connect());

		return ok;
	}

	async close() {
		this.#channel.close();
		return await super.close();
	}

	async update(settings: { conversation: { id: string } }): Promise<void> {}

	listen(data: { mono: Int16Array; raw: Int16Array }): void {
		const audio = RealtimeUtils.arrayBufferToBase64(data.mono);
		this.#channel.send('listen', { audio });
	}
}
