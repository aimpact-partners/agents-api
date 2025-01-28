import { Agent } from '@aimpact/agents-api/business/agent-v2';
import { BusinessErrorManager } from '@aimpact/agents-api/business/errors';
import { PromptTemplateProcessor } from '@aimpact/agents-api/business/prompts';
import { User } from '@aimpact/agents-api/business/user';
import type { ISessionSettings } from '@aimpact/agents-api/realtime/agents/base';
import { BaseRealtimeAgent } from '@aimpact/agents-api/realtime/agents/base';

interface ISpecs {
	conversation: { id: string };
	token: string;
}
export /*bundle*/ class AgentV2 extends BaseRealtimeAgent {
	#settings: ISessionSettings;
	get settings() {
		return this.#settings;
	}

	#error: BusinessErrorManager;
	get error() {
		return this.#error;
	}

	constructor(settings: ISessionSettings) {
		super(settings);

		this.#settings = settings;
	}
	async connect(): Promise<boolean> {
		const connected = super.connect();
		if (!connected) return false;
		return true;
	}

	async update(params: ISpecs): Promise<boolean> {
		const { conversation } = params;
		// console.log('connect', params);

		const userResponse = await User.verifyToken(params.token);
		if (userResponse.error) {
			this.#error = userResponse.error;
			console.error(this.#error);
			return false;
		}
		const user = userResponse.data;

		// Call preProcessor
		const { chat, specs, error } = await Agent.pre(conversation.id, '', user);
		if (error) {
			this.#error = error;
			console.error(this.#error);
			return false;
		}

		const prompt = new PromptTemplateProcessor(specs);
		await prompt.process();
		if (prompt.error) {
			this.#error = prompt.error;
			return false;
		}

		// console.log(`--------------\n`, chat.messages.last, `\n`, prompt.processedValue);

		this.session.update({ instructions: prompt.processedValue });

		return true;
	}
}
