import { Agent } from '@aimpact/agents-api/business/agent-v2';
import { BusinessErrorManager } from '@aimpact/agents-api/business/errors';
import { metadata } from '@aimpact/agents-api/data/model';
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

		const userResponse = await User.verifyToken(params.token);
		if (userResponse.error) {
			this.#error = userResponse.error;
			console.error(this.#error);
			return false;
		}
		const user = userResponse.data;
		console.log('user', user);

		const authorizations = await metadata.data({ id: 'authorizations' });
		if (authorizations.error) {
			console.error(23, this.#error);
			this.#error = authorizations.error;
			return false;
		}
		const userRealtime = authorizations.data.exists ? authorizations.data.data.realtime : [];
		if (!!(userRealtime && userRealtime.includes(user.email))) {
			console.error(24, this.#error);
			this.#error = userResponse.error;
			return false;
		}

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

		console.log(1, chat, specs);
		console.log(2, prompt.processedValue);
		// voice = 'alloy' | 'shimmer' | 'echo';
		this.session.update({ voice: 'alloy', instructions: prompt.processedValue });

		return true;
	}
}
