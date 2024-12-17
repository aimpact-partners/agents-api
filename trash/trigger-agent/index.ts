import fetch from 'node-fetch';
import config from '@aimpact/chat-api/config';
import { ChatStore, KnowledgeBoxesStore } from '@aimpact/chat-api/backend-store';
import * as dotenv from 'dotenv';
dotenv.config();

interface IMessage {
	chatId: string;
	userId: string;
	content: string;
	role: string;
	timestamp: number;
}

export /*bundle*/ class TriggerAgent {
	#url = config.params.AGENT_API;
	#options = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	};

	async call(message: IMessage, chatId: string, knowledgeBoxId: string) {
		try {
			const chat = new ChatStore();
			var chatResponse = await chat.load({ id: chatId });
			if (!chatResponse.status) {
				return chatResponse;
			}

			let filter;
			if (!['default', undefined, 'undefined'].includes(knowledgeBoxId)) {
				const knowledgeBox = new KnowledgeBoxesStore();
				var KBResponse = await knowledgeBox.load({ id: knowledgeBoxId });
				if (!KBResponse.status) {
					return KBResponse;
				}
				filter = { container: KBResponse.data.path };
			}

			let { messages, system } = chatResponse.data;
			const items = messages.map(({ role, content }) => Object.assign({}, { role, content: content ?? '' }));

			items.push({ role: message.role, content: message.content });

			const options = {
				...this.#options,
				body: JSON.stringify({
					messages: items,
					prompt: system,
					filter,
					token: process.env.GCLOUD_INVOKER
				})
			};
			const response = await fetch(this.#url, options);
			const responseJson = await response.json();

			return responseJson;
		} catch (e) {
			console.error('trigger agent:', e);
			return { status: false, error: e.message };
		}
	}
}
