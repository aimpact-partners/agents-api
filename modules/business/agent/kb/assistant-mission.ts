import { Chat } from '@aimpact/agents-api/business/agent/chat';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { PromptTemplateProcessor } from '@aimpact/agents-api/business/prompts';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { ILanguage, defaultTexts } from './common';

export /*bundle*/ class AssistantMission {
	static async get(chat: Chat, agent) {
		const literals: Record<string, string> = {};

		agent.literals.agent.pure.forEach((literal: string) => (literals[literal] = chat.metadata[literal]));

		const defaultText = defaultTexts[<ILanguage>chat.language];

		const last = chat.messages?.last ?? [];
		let lastMessage;
		for (let i = last.length - 1; i >= 0; i--) last[i].role === 'assistant' && (lastMessage = last[i]);

		const summary = lastMessage?.metadata.summary ?? defaultText;
		literals.summary = summary;

		let objectiveProgress;
		const progress = lastMessage?.metadata.progress ?? {};
		if (progress.objectives) {
			objectiveProgress = progress.objectives?.map(obj => ({
				name: obj.name,
				progress: obj.progress,
				status: obj.status
			}));
			objectiveProgress = JSON.stringify(objectiveProgress);
		} else objectiveProgress = defaultText;
		literals.progress = objectiveProgress;

		const executor = new PromptTemplateProcessor({
			category: agent.prompt.category,
			language: chat.language,
			name: agent.prompt.name,
			literals
		});
		await executor.process();
		if (executor.error) {
			return new BusinessResponse({
				error: ErrorGenerator.internalError('Processing Agent prompt', executor.error.text)
			});
		}

		// TODO Que se debe tomar en cuenta para el contexto de cada agente en la tool
		const context = { projectId: chat.metadata.project.id };
		return new BusinessResponse({ data: { prompt: executor.processedValue, context } });
	}
}
