import * as dotenv from 'dotenv';
import { Chat } from './chat';

dotenv.config();
const { GPT_MODEL } = process.env;

export const prepare = (chat: Chat, content: string) => {
	const { module, activity } = chat.metadata;

	const lastTwo = chat.messages?.lastTwo ?? [];

	const lastMessage = lastTwo.find(messages => messages.role === 'assistant');
	const synthesis = lastMessage?.metadata.synthesis ?? '';
	const progress = lastMessage?.metadata.progress ?? '';

	const objectiveProgress = progress?.objectives
		? JSON.stringify([{ ...synthesis, ...progress }])
		: `The conversation hasn't started yet.`;

	const { specs } = activity;
	const objectives = specs?.objectives.map(objective => `* ${objective.name}: ${objective.objective}`).join(`\n`);

	const { subject, role, topic, instructions } = specs;

	const audience =
		typeof module.audience === 'string'
			? module.audience
			: `${module.audience.category} level${module.audience.level}`;

	const literals = {
		user: chat.user.displayName,
		age: audience,
		topic: topic ?? '',
		role: role ?? '',
		subject: subject ?? '',
		instructions: instructions ?? '',
		objective: activity.objective ?? '',
		'activity-objectives': objectives,
		'activity-objectives-progress': objectiveProgress
	};

	const messages: MessagesType = lastTwo.map((message: ILastMessages) => {
		return { role: message.role, content: message.content };
	});
	messages.push({ role: 'user', content });

	return {
		category: 'agents',
		name: `ailearn.activity-${activity.type}-v2`,
		language: activity.language,
		literals,
		messages: messages ?? [],
		model: GPT_MODEL,
		temperature: 1
	};
};
