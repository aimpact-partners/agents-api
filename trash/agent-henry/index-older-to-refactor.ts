import { BusinessErrorManager, ErrorGenerator } from '@aimpact/agents-api/business/errors';
import type { RoleType } from '@aimpact/agents-api/data/interfaces';
import { v4 as uuid } from 'uuid';

const { AGENT_API_URL, AGENT_API_TOKEN } = process.env;

export /*bundle*/ class Agent {
	static async sendMessage(chatId: string, params, uid: string): Promise<ISendMessageResponse> {
		// const url = chat.project.agent?.url ?? AGENT_API_URL;
		// if (!url) return { status: false, error: ErrorGenerator.chatNotHasProjectUrlSet(chatId) };

		// Fetch the agent
		let response: any;
		try {
			const method = 'POST';
			const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${AGENT_API_TOKEN}` };

			// Prepare the parameters
			const body = JSON.stringify({
				metadata: chat.metadata,
				project: chat.project.identifier,
				chatId: chat.id,
				language: chat.language.default,
				user,
				messages,
				synthesis,
				prompt: params.content
			});
			response = await fetch(url, { method, headers, body });
		} catch (exc) {
			console.error(`BAG100`, exc);
			return {
				status: false,
				error: ErrorGenerator.internalError('BAG100', `Failed to post message`, exc.message)
			};
		}

		// Check if response is ok
		if (!response.ok) {
			const { status, statusText } = response;

			let error: BusinessErrorManager;
			if (status === 400) {
				const json = await response.json();
				const errors = json.errors.map(e => `${e.path} ${e.message}`);
				error = ErrorGenerator.invalidParameters(errors);
			} else {
				error = ErrorGenerator.internalError('BAG102', `Failed to post message (${status}): "${statusText}"`);
			}
			return { status: false, error };
		}

		const metadata: { started: boolean; value: string; parsed?: Record<string, any> } = {
			started: false,
			value: ''
		};

		// Define a function to read the stream incrementally
		async function* iterator(): AsyncIterable<{ chunk?: string; metadata?: IMetadata }> {
			// Use the response body as a stream
			const reader = response.body.getReader();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				// Process each chunk
				const chunk = new TextDecoder().decode(value);
				if (!metadata.started) {
					if (!chunk.includes('ÿ')) {
						yield { chunk };
					} else {
						metadata.started = true;
						const split = chunk.split('ÿ');
						metadata.value += split[1];
						if (split[0]) yield { chunk: split[0] };
					}
				} else {
					metadata.value += chunk;
				}
			}

			// Parse the metadata data
			try {
				metadata.parsed = JSON.parse(metadata.value);
				const { answer, summary } = metadata?.parsed;

				const promises = [];

				// set assistant message
				let progress = metadata?.parsed?.progress ? JSON.parse(metadata?.parsed?.progress) : {};
				const agentMessage = {
					id: params.systemId ?? undefined,
					content: answer,
					answer: answer,
					role: <RoleType>'assistant',
					synthesis: summary,
					metadata: { progress }
				};

				// store response
				promises.push(Chat.saveMessage(chatId, agentMessage, user));

				// update summary on chat
				promises.push(Chat.saveSynthesis(chatId, summary));

				// set last interaction on chat
				promises.push(Chat.setLastInteractions(chatId, 4));

				let error: any;
				const responses = await Promise.all(promises);
				responses.forEach(response => {
					if (response.error) {
						error = response.error;
						return;
					}
				});
				if (error) return { status: false, error };
			} catch (exc) {
				console.error(`HRC101`, exc);
				return { status: false, error: ErrorGenerator.internalError('HRC101') };
			}

			yield { metadata: <IMetadata>metadata.parsed };
		}

		return { status: true, iterator: iterator() };
	}
}
