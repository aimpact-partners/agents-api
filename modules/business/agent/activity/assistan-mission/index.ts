import { BusinessErrorManager } from '@aimpact/agents-api/business/errors';
import { MessagesType } from '@aimpact/agents-api/business/models/open-ai/caller';
import type { IPromptExecutionParams } from '@aimpact/agents-api/business/prompts';
import * as dotenv from 'dotenv';
import { Chat } from '@aimpact/agents-api/business/agent/chat';
import { v1 } from './v1';
import { v2 } from './v2';

dotenv.config();
const { GPT_MODEL, LOGS_PROMPTS } = process.env;
const USERS_LOGS = ['felix@beyondjs.com', 'julio@beyondjs.com', 'boxenrique@gmail.com'];

interface IResponse {
	error?: BusinessErrorManager;
	specs?: IPromptExecutionParams;
}
type ILanguage = 'es' | 'en' | 'de' | 'it' | 'pt';

const defaultTexts = {
	es: `La conversación aún no ha comenzado.`,
	en: `The conversation hasn't started yet.`,
	de: `Das Gespräch hat noch nicht begonnen.`,
	it: `La conversazione non è ancora iniziata.`,
	pt: `A conversa ainda não começou.`
};

export class AssistantMission {
	static async get(chat: Chat, prompt: string): Promise<IResponse> {
		const last = chat.messages?.last ?? [];
		let lastMessage;
		for (let i = last.length - 1; i >= 0; i--) {
			if (last[i].role === 'assistant') lastMessage = last[i];
		}
		const messages: Partial<MessagesType> = [...last].reverse().map(({ role, content }) => ({ role, content }));
		messages.push({ role: 'user', content: prompt });

		const { metadata } = chat;
		const activitySpecs = metadata.activity.specs ?? metadata.activity.resources.specs;
		const activityVersion = activitySpecs?.objectives ? v2 : v1;
		const response = await activityVersion(chat, lastMessage);
		if (response.error) return { error: response.error };

		const { activity } = chat.metadata;
		const store = LOGS_PROMPTS === 'true' && USERS_LOGS.includes(chat.user.email);
		const specs: IPromptExecutionParams = {
			language: activity.language,
			category: 'agents',
			name: response.prompt,
			literals: response.literals,
			messages: messages ?? [],
			model: GPT_MODEL,
			temperature: 1,
			store: store ? true : undefined,
			metadata: store ? { key: `agent/${activity.type}/${response.prompt}`, prompt: response.prompt } : undefined
		};

		return { specs };
	}
}
