import { Chat } from '@aimpact/agents-api/business/agent/chat';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { Projects, ProjectsAgents } from '@aimpact/agents-api/business/projects';
import type { User } from '@aimpact/agents-api/business/user';
import * as dotenv from 'dotenv';

dotenv.config();
const { AGENT_API_TOKEN } = process.env;

export /*bundle*/ const hook = async (chat: Chat, user: User, params = {}) => {
	let response: any;
	try {
		const method = 'POST';
		const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${AGENT_API_TOKEN}` };

		let URL;
		if (typeof chat.project.agent === 'string') {
			const agentResponse = await ProjectsAgents.get(chat.project.id, chat.project.agent);
			if (agentResponse.error) return { error: agentResponse.error };
			URL = agentResponse.data.hook;
		} else {
			// OLD Chats
			const response = await Projects.data(chat.project.id);
			if (response.error) return { error: response.error };
			URL = `${response.data.data.agent.url}/agent/hook`;
		}

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
