import { Chat as ChatData } from '@aimpact/agents-api/business/chats';
import { BusinessErrorManager, ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { PromptTemplateProcessor } from '@aimpact/agents-api/business/prompts';
import { User } from '@aimpact/agents-api/business/user';
import type { IChatData } from '@aimpact/agents-api/data/interfaces';

export /*bundle*/ class Chat {
	#id: string;
	get id() {
		return this.#id;
	}

	#data: IChatData;

	#user: User;
	get user() {
		return this.#data?.user;
	}

	get project() {
		return this.#data?.project;
	}

	get synthesis() {
		return this.#data?.synthesis;
	}

	get language() {
		return this.#data?.language?.default;
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
			interactions: msgs && msgs.interactions ? msgs.interactions : 0
		};

		return messages;
	}

	get testing() {
		return !this.metadata?.assignment;
	}

	get metadata(): Record<string, any> {
		return this.#data?.metadata;
	}

	get ipe() {
		return this.#data?.ipe;
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

		if (!chat) return (this.#error = ErrorGenerator.chatNotValid(this.#id));
		const id = chat.user.uid ?? chat.user.id;
		if (id !== this.#user.uid) return (this.#error = ErrorGenerator.unauthorizedUserForChat());
		if (!chat.language) return (this.#error = ErrorGenerator.chatWithoutLanguages(this.#id));

		const language = chat.language.default;
		if (!language) return (this.#error = ErrorGenerator.chatWithoutDefaultLanguage(this.#id));
		if (!chat.project) return (this.#error = ErrorGenerator.chatWithoutDefaultLanguage(this.#id));

		if (this.#error) return;
		this.#data = chat;
	}

	async storeInteration(params) {
		try {
			const promises: Promise<any>[] = [];

			const { prompt, answer, ipe } = params;

			const metadata: Record<string, any> = {};
			let summary = '';
			ipe.forEach(item => {
				metadata[item.key] = item.response;
				if (item.key === 'summary') {
					summary = item.response.summary;
					metadata[item.key] = item.response.summary;
				}
			});

			let response;

			// store user's message
			const userData = { content: prompt, role: 'user' };
			response = await ChatData.saveMessage(this.id, userData, this.user);
			if (response.error) throw response.error;

			// store assistant's message
			const assistantData = { answer, content: answer, role: 'assistant', metadata, synthesis: summary };
			response = await ChatData.saveMessage(this.id, assistantData, this.user);
			if (response.error) throw response.error;

			// set last interaction on chat
			promises.push(ChatData.setLastInteractions(this.id, 4));

			// update summary on chat
			// promises.push(ChatData.saveSynthesis(this.id, summary));

			// update summary on chat
			promises.push(ChatData.saveIPE(this.id, metadata));

			const responses = await Promise.all(promises);
			responses.forEach(response => {
				if (!response.error) return;
				this.#error = response.error;
			});
		} catch (exc) {
			if (exc instanceof BusinessErrorManager) return exc;
			this.#error = ErrorGenerator.internalError('BAG102', `Failed to store message`, exc.message);
		}
	}
}
