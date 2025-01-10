import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { User } from '@aimpact/agents-api/business/user';
import * as dotenv from 'dotenv';
import { Chat } from './chat';

dotenv.config();
const { AGENT_API_TOKEN } = process.env;
const URL = 'http:localhost:5050/agent/hook';

export const hook = async (chat: Chat, user: User, params = {}) => {
	let response: any;
	try {
		const method = 'POST';
		const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${AGENT_API_TOKEN}` };

		// Prepare the parameters
		const specs = {
			metadata: chat.metadata,
			chatId: chat.id,
			user,
			messages: chat.messages,
			...params
		};

		const body = JSON.stringify(specs);
		response = await fetch(URL, { method, headers, body });
	} catch (exc) {
		return { error: ErrorGenerator.internalError('BA100', `Failed to post`, exc.message) };
	}

	const json = await response.json();
	return json;
};
