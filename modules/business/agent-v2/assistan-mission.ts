import { BusinessErrorManager } from '@aimpact/agents-api/business/errors';
import { ProjectsAgents } from '@aimpact/agents-api/business/projects';
import type { IPromptExecutionParams } from '@aimpact/agents-api/business/prompts';
import { User } from '@aimpact/agents-api/business/user';
import { MessagesType } from '@aimpact/agents-api/models/open-ai/caller';
import * as dotenv from 'dotenv';
import { Chat } from './chat';

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
	static async get(chat: Chat, prompt: string, user: User): Promise<IResponse> {
		const { project, metadata } = chat;
		const agentName = typeof project.agent === 'string' ? project.agent : metadata.activity?.type;
		const response = await ProjectsAgents.get(project.id, agentName);
		if (response.error) return { error: response.error };
		const agent = response.data;

		const last = chat.messages?.last ?? [];
		let lastMessage;
		for (let i = last.length - 1; i >= 0; i--) {
			if (last[i].role === 'assistant') lastMessage = last[i];
		}
		const messages: Partial<MessagesType> = [...last].reverse().map(({ role, content }) => ({ role, content }));
		messages.push({ role: 'user', content: prompt });

		const literals: Record<string, string> = {};
		agent.literals.agent.pure.forEach(literal => (literals[literal] = chat.metadata[literal]));

		const defaultText = defaultTexts[<ILanguage>chat.metadata.language];

		const objectives = metadata?.objectives ?? metadata['activity-objectives']; // property backward support
		literals.objectives = JSON.stringify(objectives);

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

		const { activity } = chat.metadata;
		const promptName = `ailearn.activity-${activity.type}-v2`;
		const specs: IPromptExecutionParams = {
			category: 'agents',
			name: promptName,
			language: activity.language,
			literals,
			messages: messages ?? [],
			model: GPT_MODEL,
			temperature: 1
		};

		if (LOGS_PROMPTS === 'true' && USERS_LOGS.includes(user.email)) {
			specs.store = true;
			specs.metadata = { key: `agent/${activity.type}/${promptName}`, prompt: promptName };
		}

		return { specs };
	}
}

// static prepare(chat: Chat, content: string, user: User) {
// 	const { module, activity } = chat.metadata;

// 	const last = chat.messages?.last ?? [];
// 	let lastMessage;
// 	for (let i = last.length - 1; i >= 0; i--) {
// 		if (last[i].role === 'assistant') lastMessage = last[i];
// 	}

// 	const defaultText = defaultTexts[chat.metadata.language];

// 	const summary = lastMessage?.metadata.summary ?? defaultText;
// 	const progress = lastMessage?.metadata.progress ?? {};

// 	// new
// 	let objectiveProgress;
// 	if (progress.objectives) {
// 		objectiveProgress = progress.objectives?.map(obj => ({
// 			name: obj.name,
// 			progress: obj.progress,
// 			status: obj.status
// 		}));
// 		objectiveProgress = JSON.stringify(objectiveProgress);
// 	} else objectiveProgress = defaultText;

// 	const specs = activity.resources?.specs ?? activity.specs;
// 	const { subject, role, topic, instructions } = specs;
// 	const { format, entity, level } = chat.metadata;

// 	const audience = module.audience;
// 	const literals = {
// 		user: chat.user.displayName,
// 		audience,
// 		topic: topic ?? '',
// 		role: role ?? '',
// 		subject: subject ?? '',
// 		instructions: instructions ?? '',
// 		objective: activity.objective ?? '',
// 		objectives: JSON.stringify(specs?.objectives), // NEW
// 		format, // NEW
// 		entity, // NEW
// 		level, // NEW
// 		summary, // NEW
// 		progress: objectiveProgress, // NEW
// 		age: audience, // OLD
// 		'activity-objectives': JSON.stringify(specs?.objectives), // OLD
// 		'activity-objectives-progress': objectiveProgress
// 			? JSON.stringify(objectiveProgress)
// 			: `The conversation hasn't started yet.` // OLD
// 	};

// 	const messages = [...last].reverse().map(({ role, content }) => ({ role, content }));
// 	messages.push({ role: 'user', content });

// 	const promptName = `ailearn.activity-${activity.type}-v2`;
// 	const response = {
// 		category: 'agents',
// 		name: promptName,
// 		language: activity.language,
// 		literals,
// 		messages: messages ?? [],
// 		model: GPT_MODEL,
// 		temperature: 1
// 	};

// 	if (LOGS && user.email === USER_LOGS_PROMPTS) {
// 		response.store = true;
// 		response.metadata = {
// 			key: `agent/${activity.type}/${promptName}`,
// 			prompt: promptName
// 		};
// 	}

// 	return response;
// }
