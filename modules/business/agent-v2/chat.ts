import { Chat as ChatData } from '@aimpact/agents-api/business/chats';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import type { IPromptExecutionParams } from '@aimpact/agents-api/business/prompts';
import { PromptTemplateProcessor } from '@aimpact/agents-api/business/prompts';
import { User } from '@aimpact/agents-api/business/user';
import type { IChatData } from '@aimpact/agents-api/data/interfaces';
import { prepare } from './prepare';

export /*bundle*/ class Chat {
	#id: string;
	get id() {
		return this.#id;
	}

	#data: IChatData;

	get metadata() {
		return this.#data?.metadata;
	}

	#user: User;
	get user() {
		return this.#data?.user;
	}

	get synthesis() {
		return this.#data?.synthesis;
	}

	#promptTemplate: PromptTemplateProcessor;
	get promptTemplate() {
		return this.#promptTemplate?.processedValue;
	}

	get messages() {
		const msgs = this.#data.messages;

		const messages = {
			last: msgs && msgs.lastTwo ? msgs.lastTwo : [],
			count: msgs && msgs.count ? msgs.count : 0,
			user: msgs && msgs.user ? msgs.user : 0
		};

		return messages;
	}

	#error;
	get error() {
		return this.#error;
	}

	constructor(id: string, user: User) {
		this.#id = id;
		this.#user = user;
	}

	async fetch() {
		const response = await ChatData.get(this.#id);
		if (response.error) {
			this.#error = response.error;
			return;
		}
		const chat = response.data;

		if (!chat) return { error: ErrorGenerator.chatNotValid(this.#id) };
		const id = chat.user.uid ?? chat.user.id;
		if (id !== this.#user.uid) return { error: ErrorGenerator.unauthorizedUserForChat() };

		if (!chat.language) return { error: ErrorGenerator.chatWithoutLanguages(this.#id) };
		const language = chat.language.default;
		if (!language) return { error: ErrorGenerator.chatWithoutDefaultLanguage(this.#id) };
		if (!chat.project) return { error: ErrorGenerator.chatWithoutDefaultLanguage(this.#id) };

		if (this.#error) return { status: false };

		this.#data = chat;
	}

	async processPrompt(content: string) {
		const specs: IPromptExecutionParams = prepare(this, content);

		this.#promptTemplate = new PromptTemplateProcessor(specs);
		await this.#promptTemplate.process();
	}

	async store(params) {
		try {
			const { id, content } = params;
			const userMessage = { id: id ?? uuid(), content, role: <RoleType>'user' };
			const response = await Chat.saveMessage(chatId, userMessage, user);
			if (response.error) return { status: false, error: response.error };
		} catch (exc) {
			console.error(`BAG102:`, exc);
			return {
				status: false,
				error: ErrorGenerator.internalError('BAG102', `Failed to store message`, exc.message)
			};
		}
	}
}
