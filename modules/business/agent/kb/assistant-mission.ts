import { Chat } from '@aimpact/agents-api/business/agent/chat';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { PromptTemplateProcessor } from '@aimpact/agents-api/business/prompts';
import { BusinessResponse } from '@aimpact/agents-api/business/response';

/**
 * TODO add logic
 * 
// // const last = params.messages.last.map(m => ({ content: m.content, role: m.role }));
// const messages = [{ content: params.prompt, role: 'user' }]
// // .concat(last)
// .map(item => (item.role === 'user' ? userAgent(item.content) : assistant(item.content)));
 *
 */

export /*bundle*/ class AssistantMission {
	static async get(chat: Chat, agent) {
		const literals: Record<string, string> = {};
		agent.literals.agent.pure.forEach((literal: string) => (literals[literal] = chat.metadata[literal]));

		const executor = new PromptTemplateProcessor({
			category: agent.prompt.category,
			language: chat.language,
			name: agent.prompt.name,
			literals
		});
		await executor.process();
		if (executor.error) {
			return new BusinessResponse({ error: ErrorGenerator.internalError('Processing agent prompt') });
		}

		console.log('executor.processedValue', executor.processedValue);
		return { data: { prompt: executor.processedValue, context: {} } }; // TODO context debe estar en los metadata del chat??
	}

	// static async process(params: IAgentRequestParams) {
	// 	const { user } = params;
	// 	const { organization, role } = <IKBChatMetadata>params.metadata;

	// 	// const response = await Organizations.get(organization.id, user);
	// 	// if (response.error) {
	// 	// 	return new BusinessResponse({ error: response.error });
	// 	// }

	// 	const messages = [{ content: params.prompt, role: 'user' }].map(item =>
	// 		item.role === 'user' ? userAgent(item.content) : assistant(item.content)
	// 	);

	// 	const executor = new PromptTemplateProcessor({
	// 		category: 'agents',
	// 		language: params.language ?? 'en',
	// 		name: `agents.kb-agent-it`,
	// 		literals: { role }
	// 	});
	// 	await executor.get();
	// 	if (executor.error) {
	// 		return new BusinessResponse({ error: ErrorGenerator.internalError('Processing agent prompt') });
	// 	}

	// 	const agent = new Agent({
	// 		name: 'Knowledge Base Bot',
	// 		instructions: executor.value,
	// 		model: 'gpt-4o-mini',
	// 		tools: [searcher]
	// 	});

	// 	const result = await run(agent, messages, { context: { organizationId: organization.id }, stream: true });

	// 	let streamingOutput = '';
	// 	try {
	// 		for await (const event of result) {
	// 			switch (event.type) {
	// 				case 'run_item_stream_event':
	// 					if (event.name === 'tool_called') {
	// 						// console.log('run_item_stream_event ⚡ Tool called:', event.name, event.item.rawItem);
	// 						// console.log(
	// 						// 	'⚡ Tool called:',
	// 						// 	event.item.rawItem,
	// 						// 	event.item.rawItem.arguments,
	// 						// 	event.item.rawItem.name
	// 						// );
	// 						// const chunk = part.chunk?.replace('ÿ', 'y').replace('😸', '😺').replace('🖋️', '✒️');
	// 					} else if (event.name === 'tool_output') {
	// 						// console.log('📄 Tool result:', event.name, event.item.output, event.item.name);
	// 						// console.log('metadata----------------', event.item.output);
	// 					} else if (event.name === 'message_output_created') {
	// 						// console.log('📄-----message_output_created', event.name);
	// 						// console.log('📄--------------:', event.item.content);
	// 					}
	// 					break;
	// 				case 'raw_model_stream_event':
	// 					// console.log(
	// 					// 	'🧠 Model output:',
	// 					// 	event.data,
	// 					// 	event.data.type,
	// 					// 	event.data.providerData,
	// 					// 	event.data.delta,
	// 					// 	`\n`
	// 					// );
	// 					// console.log('Streaming partial:', event.data.delta);
	// 					event.data.delta && (streamingOutput += event.data.delta);
	// 					break;
	// 				case 'agent_updated_stream_event':
	// 					// console.log('🤖 Agent updated:', event.agent.name);
	// 					break;
	// 				default:
	// 				// console.log('Unknown event type:', event.type);
	// 			}
	// 		}
	// 	} catch (err) {
	// 		console.error('❌ Streaming error:', err);
	// 		return new BusinessResponse({ error: ErrorGenerator.internalError('Streaming agent response') });
	// 	}
	// 	const finalOutput = result.finalOutput;

	// 	return new BusinessResponse({ data: { access: true, output: finalOutput } });
	// }
}
