import { Chat } from '@aimpact/agents-api/business/agent-v2';
import { BusinessErrorManager } from '@aimpact/agents-api/business/errors';
import type { ISessionSettings } from '@aimpact/agents-api/realtime/agents/base';
import { BaseRealtimeAgent } from '@aimpact/agents-api/realtime/agents/base';

export /*bundle*/ class AgentV2 extends BaseRealtimeAgent {
	#error: BusinessErrorManager;
	get error() {
		return this.#error;
	}

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
		if (chat.error) {
			this.#error = chat.error;
			return false;
		}

		// console.log(`\n`, chat.messages.last, chat.system);
		const specs = { instructions: chat.system };
		this.session.update(specs);

		return true;
	}
}
