import { Chat } from '@aimpact/agents-api/business/agent/chat';
import { hook } from '@aimpact/agents-api/business/agent/hook';
import { ProjectsAgents } from '@aimpact/agents-api/business/projects';
import { Agent, assistant, run, user as userAgent } from '@openai/agents';
import { AssistantMission } from './assistant-mission';
import { tools } from './tools';

interface IParams {
	content: string;
	id?: string;
	systemId?: string;
}

interface IMetadata {
	summary?: string;
	objectives?: [];
	credits?: { total: number; consumed: number };
	error?: { code: number; text: string };
}

export /*bundle*/ class KBAgent {
	// PreProcessor
	static async pre(chat: Chat, prompt: string) {
		// Fetch the agent
		const response = await hook(chat, { prompt, language: chat.language });
		if (response.error) return { error: response.error };

		console.log('hook response ', response.data);

		const agentResponse = await KBAgent.get(chat);
		if (agentResponse.error) return { error: agentResponse.error };
		const agent = agentResponse.data;

		const { data, error } = await AssistantMission.get(chat, agent);
		if (error) return { error };

		console.log('Assistant Mission response', data);

		return { specs: data };
	}

	// PostProcessor
	static async post(chat: Chat, prompt: string, answer: string) {
		// const response = await IPE.process(chat, prompt, answer);
		// if (response.error) return { error: response.error };

		// const { ipe } = response;
		// const hookSpecs = { ipe, prompt, answer, testing: chat.testing };
		// const hookResponse = await hook(chat, hookSpecs);
		// if (hookResponse.error) return { error: hookResponse.error };

		// Store messages
		console.log('store ', prompt, answer);
		await chat.storeInteration({ prompt, answer, ipe: [] });
		if (chat.error) return { error: chat.error };

		return { credits: { total: 100, consumed: 1 } };
	}

	// GetAgent
	static async get(chat: Chat) {
		const { project } = chat;
		const response = await ProjectsAgents.get(project.id, project.agent);
		return response;
	}

	static async processIncremental(chat: string, params: IParams) {
		const prompt = params.content;
		console.log(1, 'processIncremental', prompt);
		console.log('response AGENT 2', chat.project.agent);

		// Call preProcessor
		const { specs, error } = await KBAgent.pre(chat, prompt);
		if (error) return { status: false, error };

		//
		// Aqui Deberia obtener el get de AssistantMission
		// y luego en el post ejecuto los IPE
		//
		console.log('specs_______________', specs);
		/**
		 *
		 */
		const messages = [{ content: prompt, role: 'user' }].map(item =>
			item.role === 'user' ? userAgent(item.content) : assistant(item.content)
		);
		const agent = new Agent({
			name: 'Knowledge Base Agent',
			instructions: specs.prompt,
			model: 'gpt-4o-mini',
			tools
		});

		async function* iterator(): AsyncIterable<{ chunk?: string; metadata?: IMetadata }> {
			const result = await run(agent, messages, { context: specs.context, stream: true });

			console.log('Run result', result);

			let answer = '';
			const metadata: IMetadata = {};
			for await (const event of result) {
				switch (event.type) {
					case 'run_item_stream_event':
						if (event.name === 'tool_called') {
							console.log('run_item_stream_event ⚡ Tool called:', event.name, event.item.rawItem);
							// console.log(
							// 	'⚡ Tool called:',
							// 	event.item.rawItem,
							// 	event.item.rawItem.arguments,
							// 	event.item.rawItem.name
							// );
							// const chunk = part.chunk?.replace('ÿ', 'y').replace('😸', '😺').replace('🖋️', '✒️');
						} else if (event.name === 'tool_output') {
							console.log('📄 Tool result:', event.name, event.item.output, event.item.name);
							// console.log('metadata----------------', event.item.output);
						} else if (event.name === 'message_output_created') {
							console.log('📄-----message_output_created', event.name);
							// console.log('📄--------------:', event.item.content);
						}
						break;
					case 'raw_model_stream_event':
						console.log(
							'🧠 Model output:',
							event.data,
							event.data.type,
							event.data.providerData,
							event.data.delta,
							`\n`
						);
						console.log('Streaming partial:', event.data.delta);
						if (event.data.delta) {
							answer += event.data.delta;
							yield { chunk: event.data.delta };
						}
						break;
					case 'agent_updated_stream_event':
						console.log('🤖 Agent updated:', event.agent.name);
						break;
					default:
						console.log('Unknown event type:', event.type);
				}
			}
			yield { chunk: 'ÿ' };

			const finalOutput = result.finalOutput;

			// 	// Call postProcessor
			// const response = await KBAgent.post(chat, prompt, answer);
			// if (response.error) metadata.error = response.error;
			// response.credits && (metadata.credits = response.credits);
			yield { metadata };
		}
		return { status: true, iterator: iterator() };

		/**
		 *
		 */

		// OLD CODE ----------------------------------------------------------------------
		// async function* iterator(): AsyncIterable<{ chunk?: string; metadata?: IMetadata }> {
		// 	let answer = '';
		// 	const metadata: IMetadata = {};

		// 	// Dividir el texto en chunks de tamaño fijo
		// 	for (let i = 0; i < outputText.length; i += chunkSize) {
		// 		const chunk = outputText.slice(i, i + chunkSize);

		// 		// Aplicar los mismos reemplazos que en el código original
		// 		const processedChunk = chunk.replace('ÿ', 'y').replace('😸', '😺').replace('🖋️', '✒️');

		// 		// Simular un pequeño delay para mantener la experiencia incremental
		// 		await new Promise(resolve => setTimeout(resolve, 10));

		// 		// Yield el chunk procesado
		// 		yield { chunk: processedChunk };

		// 		answer += processedChunk;
		// 	}

		// 	yield { chunk: 'ÿ' };

		// 	// Call postProcessor
		// 	const response = await KBAgent.post(chat, prompt, outputText, user);
		// 	if (response.error) metadata.error = response.error;

		// 	response.credits && (metadata.credits = response.credits);
		// 	yield { metadata };
		// }
		// return { status: true, iterator: iterator() };
	}
}
