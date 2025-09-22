import { Chat } from '@aimpact/agents-api/business/agent/chat';
import { hook } from '@aimpact/agents-api/business/agent/hook';
import { ProjectsAgents } from '@aimpact/agents-api/business/projects';
import { Agent, assistant, run, user as userAgent } from '@openai/agents';
import { AssistantMission } from './assistant-mission';
import { IPE } from './ipe';
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
	static async pre(chat: Chat, prompt: string, agent) {
		// Fetch the agent
		const response = await hook(chat, { prompt, language: chat.language });
		if (response.error) return { error: response.error };

		const { data, error } = await AssistantMission.get(chat, agent);
		if (error) return { error };

		return { specs: data };
	}

	// PostProcessor
	static async post(chat: Chat, prompt: string, answer: string, agent) {
		const response = await IPE.process(chat, prompt, answer, agent);
		if (response.error) return { error: response.error };

		const { ipe } = response;
		const hookSpecs = { ipe, prompt, answer, testing: chat.testing };
		const hookResponse = await hook(chat, hookSpecs);
		if (hookResponse.error) return { error: hookResponse.error };

		// Store messages
		await chat.storeInteration({ prompt, answer, ipe });
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

		const agentResponse = await KBAgent.get(chat);
		if (agentResponse.error) return { error: agentResponse.error };
		const agentDocument = agentResponse.data;

		// Call preProcessor
		const { specs, error } = await KBAgent.pre(chat, prompt, agentDocument);
		if (error) return { status: false, error };

		const messages = [{ content: prompt, role: 'user' }].map(item =>
			item.role === 'user' ? userAgent(item.content) : assistant(item.content)
		);
		const agent = new Agent({
			name: 'Knowledge Base Agent',
			instructions: specs.prompt,
			model: 'gpt-4o-mini'
		});

		async function* iterator(): AsyncIterable<{ chunk?: string; metadata?: IMetadata }> {
			const result = await run(agent, messages, { context: specs.context, stream: true });

			let answer = '';
			const metadata: IMetadata = {};
			for await (const event of result) {
				switch (event.type) {
					case 'run_item_stream_event':
						if (event.name === 'tool_called') {
							// console.log('run_item_stream_event ⚡ Tool called:', event.name, event.item.rawItem);
							// const toolData = event.item.rawItem;
							// const toolArguments = JSON.parse(toolData.arguments);
							// const json = `😸{type: 'function', fnc: ${toolData.name}, params: {text: ${toolArguments.query}}🖋️`;
							// yield { chunk: json };
						} else if (event.name === 'tool_output') {
							// console.log('📄 Tool result:', event.name, event.item.output);
							// const toolData = event.item.rawItem;
							// const json = `😸{type: 'function', fnc: ${toolData.name}, params: {results: ${event.item.output.length}}🖋️`;
							// yield { chunk: json };
							// console.log('metadata----------------', event.item.output);
						} else if (event.name === 'message_output_created') {
							// console.log('📄-----message_output_created', event.name);
							// console.log('📄--------------:', event.item.content);
						}
						break;
					case 'raw_model_stream_event':
						// console.log('🧠 Model output:', event.data, event.data.type, event.data.providerData);
						if (event.data.delta) {
							// console.log('Streaming partial:', event.data.delta);
							answer += event.data.delta;
							yield { chunk: event.data.delta };
						}
						break;
					case 'agent_updated_stream_event':
						break;
					default:
				}
			}
			yield { chunk: 'ÿ' };
			// const finalOutput = result.finalOutput;

			// 	// Call postProcessor
			const response = await KBAgent.post(chat, prompt, answer, agentDocument);
			if (response.error) metadata.error = response.error;
			response.credits && (metadata.credits = response.credits);

			yield { metadata };
		}
		return { status: true, iterator: iterator() };
	}
}
