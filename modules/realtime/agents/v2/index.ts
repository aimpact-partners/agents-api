import type { ISessionSettings } from '@aimpact/agents-api/realtime/agents/base';
import { BaseRealtimeAgent } from '@aimpact/agents-api/realtime/agents/base';

export /*bundle*/ class AgentV2 extends BaseRealtimeAgent {
	constructor(settings: ISessionSettings) {
		super(settings);
	}

	async connect(): Promise<boolean> {
		const connected = super.connect();
		if (!connected) return false;

		/**
		 * CONTINUE HERE!
		 */
		// await Chat.fetch();

		// this.session.update();

		return true;
	}
}
