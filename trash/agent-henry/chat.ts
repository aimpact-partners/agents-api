import { Chat as ChatData } from '@aimpact/agents-api/business/chats';

// Does it make sense to use the Chat object from '@aimpact/ag÷ents-api/business/chats' ??

export class Chat {
	#id: string;
	get id() {
		return this.#id;
	}

	#data;

	get user() {
		return this.#data?.user;
	}

	get synthesis() {
		return this.#data?.synthesis;
	}

	get messages() {
		const msgs = this.#data.messages;

		const messages = {
			last: msgs && msgs.lastTwo ? msgs.lastTwo : [],
			count: msgs && msgs.count ? msgs.count : 0,
			user: msgs && msgs.user ? msgs.user : 0
		};
		++messages.user; // add the user recent message
		++messages.count; // add the recent message

		return messages;
	}

	#error;
	get error() {
		return this.#error;
	}

	constructor(id: string) {
		this.#id = id;
	}

	async fetch() {
		let chat, error;
		({ chat, error } = await (async () => {
			const response = await Chat.get(chatId);
			if (response.error) return { error: response.error };
			chat = response.data;

			// Chat validations
			if (!chat) return { error: ErrorGenerator.chatNotValid(chatId) };

			const id = chat.user.uid ?? chat.user.id;
			if (id !== uid) return { error: ErrorGenerator.unauthorizedUserForChat() };

			if (!chat.language) return { error: ErrorGenerator.chatWithoutLanguages(chatId) };
			const language = chat.language.default;
			if (!language) return { error: ErrorGenerator.chatWithoutDefaultLanguage(chatId) };
			if (!chat.project) return { error: ErrorGenerator.chatWithoutDefaultLanguage(chatId) };

			return { chat };
		})());
		if (error) return { status: false, error };
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
