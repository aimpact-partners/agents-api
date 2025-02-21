import { Chat } from './chat';
import * as dotenv from 'dotenv';
import { cached } from '@aimpact/agents-api/cached';

dotenv.config();

const { OPENAI_KEY } = process.env;

export /*bundle*/ interface IMetadata {
	answer: string;
	summary?: string;
	progress?: string;
	error?: { code: number; text: string };
}

export /*bundle*/ interface ISendMessageResponse {
	status: boolean;
	error?: { code: number; text: string };
	iterator?: AsyncIterable<{ chunk?: string; metadata?: IMetadata }>;
}

export /*bundle*/ class Agent {
	static async sendMessage(chatId: string, params, uid: string): Promise<ISendMessageResponse> {
		const chat = new Chat(chatId);
		await chat.fetch();
		if (chat.error) return new HTTPResponse({ error: chat.error });

		const project = cached.projects.get(chat.project.id);
		await project.fetch();
		if (project.error) return new HTTPResponse({ error: project.error });

		// Store the user message as soon as it arrives
		const error = await chat.store();

		// Fetch the hook

		// Define a function to read the stream incrementally
		async function* iterator(): AsyncIterable<{ chunk?: string; metadata?: IMetadata }> {}

		return;
	}
}
