import { ActivityAgent } from '@aimpact/agents-api/business/agent/activity';
import { BusinessErrorManager } from '@aimpact/agents-api/business/errors';
import { PromptTemplateProcessor } from '@aimpact/agents-api/business/prompts';
import { User } from '@aimpact/agents-api/business/user';
import config from '@aimpact/agents-api/config';
import { metadata } from '@aimpact/agents-api/data/model';
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

	private async validateUser(token: string) {
		const userResponse = await User.verifyToken(token);
		if (userResponse.error) {
			this.#error = userResponse.error;
			return false;
		}
		const user = userResponse.data;
		const authorizations = await metadata.data({ id: 'authorizations' });
		if (authorizations.error) {
			this.#error = authorizations.error;
			return false;
		}
		const userRealtime = authorizations.data.exists ? authorizations.data.data.realtime : [];

		if (!userRealtime.includes(user.email)) {
			this.#error = userResponse.error;
			return false;
		}

		return user;
	}

	async update(params: ISpecs): Promise<boolean> {
		const project = <'rvd' | 'better-mind'>config.params.project;

		let user;
		if (project === 'rvd') {
			user = await this.validateUser(params.token);
			if (!user) return false;
		}

		// Call preProcessor
		const { conversation } = params;
		const { specs, error } = await ActivityAgent.pre(conversation.id, '', user);
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

		// voice = 'alloy' | 'shimmer' | 'echo';
		this.session.update({ voice: 'alloy', instructions: prompt.processedValue });

		return true;
	}
}
