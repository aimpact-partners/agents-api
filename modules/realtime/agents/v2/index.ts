import type { ISessionSettings } from '@aimpact/agents-api/realtime/agents/base';
import { BaseRealtimeAgent } from '@aimpact/agents-api/realtime/agents/base';
import { Chat } from '@aimpact/agents-api/business/agent-v2';

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
		const chatId = `a380e14a-5faf-459f-9a71-87fedd801162`;
		const chat = new Chat(chatId);
		await chat.fetch();
		if (chat.error) return new BusinessResponse({ error: chat.error });

		console.log(`\n`, chat.messages.last, `\n`, chat.system);

		// this.session.update();

		return true;
	}
}
