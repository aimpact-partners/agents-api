import type { IVoiceAudioDetection, AgentStatusType } from '@aimpact/agents-api/realtime/agents/base';
import { ClientSessionBase } from '@aimpact/agents-api/realtime/client/base';
import { BaseRealtimeAgent } from '@aimpact/agents-api/realtime/agents/base';

export /*bundle*/ class ClientSession extends ClientSessionBase {
	#agent: BaseRealtimeAgent;
	get agent() {
		return this.#agent;
	}

	get status(): AgentStatusType {
		return this.#agent.status;
	}

	constructor(settings: { vad: IVoiceAudioDetection }) {
		const key = localStorage.getItem('openai-key');
		if (!key) throw new Error('Open AI API key must be set as a localstorage item: `openai-key`');

		const agent = new BaseRealtimeAgent({ key });
		super(agent, agent.session, settings);
		this.#agent = agent;
	}

	async connect(): Promise<boolean> {
		super.connect();
		return await this.#agent.connect();
	}

	async close(): Promise<void> {
		const output = await this.#agent.close();
		super.close();
		return output;
	}

	listen(data: { mono: Int16Array; raw: Int16Array }): void {
		this.#agent.manager.listen(data.mono);
	}
}
