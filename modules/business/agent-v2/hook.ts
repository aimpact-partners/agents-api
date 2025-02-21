import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { User } from '@aimpact/agents-api/business/user';
import { ProjectsAgents } from '@aimpact/agents-api/business/projects';
import * as dotenv from 'dotenv';
import { Chat } from './chat';

dotenv.config();
const { AGENT_API_TOKEN } = process.env;

export const _hook = async (chat: Chat, user: User, params = {}) => {
	let response: any;
	try {
		const method = 'POST';
		const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${AGENT_API_TOKEN}` };

		let agent;
		if (typeof chat.project.agent === 'string') {
			const agentResponse = await ProjectsAgents.get(chat.project.id, chat.project.agent);
			if (agentResponse.error) return { error: agentResponse.error };
			agent = agentResponse.data;
		} else agent = { hook: `${chat.project.agent.url}/agent/hook` }; // OLD Chats
		const URL = agent.hook;

		// Prepare the parameters
		const specs = {
			...params,
			user,
			chatId: chat.id,
			metadata: chat.metadata,
			messages: chat.messages
		};

		const body = JSON.stringify(specs);
		response = await fetch(URL, { method, headers, body });
	} catch (exc) {
		return { error: ErrorGenerator.internalError('BA100', `Failed to post`, exc.message) };
	}

	const json = await response.json();
	return json;
};
