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
			return new BusinessResponse({
				error: ErrorGenerator.internalError('PromptTemplateProcessor', 'Processing Agent prompt')
			});
		}

		// TODO Que se debe tomar en cuenta para el contexto de cada agente en la tool
		const context = { projectId: chat.metadata.project.id };
		return new BusinessResponse({ data: { prompt: executor.processedValue, context } });
	}
}
