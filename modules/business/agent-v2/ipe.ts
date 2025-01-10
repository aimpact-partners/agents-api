import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { PromptTemplateExecutor } from '@aimpact/agents-api/business/prompts';
import * as dotenv from 'dotenv';
import { Chat } from './chat';

dotenv.config();
const { GPT_MODEL } = process.env;

export class IPE {
	// update for query DB
	static get(chat, prompt: string) {
		const { messages, user } = chat;
		const { module, activity } = chat.metadata;

		const lastMessage = messages?.last.find(messages => messages.role === 'assistant');
		const synthesis = lastMessage?.metadata.synthesis ?? '';
		const progress = lastMessage?.metadata.progress ?? '';

		const { type } = activity;

		const specs = activity.resources?.specs ?? activity.specs;
		console.log('activity', activity);
		console.log('specs____', specs);

		const { subject, role, instructions } = specs;

		const activityObjectives = specs?.objectives
			.map(objective => `* ${objective.name}: ${objective.objective}`)
			.join(`\n`);

		const objectiveProgress = progress?.objectives
			? JSON.stringify([{ ...synthesis, ...progress }])
			: `The conversation hasn't started yet.`;

		const ipe = [];
		ipe.push({
			format: 'json',
			language: activity.language,
			key: 'summary',
			prompt: { category: 'agents', name: `ailearn.${type}-summary` },
			literals: {
				user: user.displayName,
				age: module.audience ?? '',
				role: role ?? '',
				subject: subject ?? '',
				prompt,
				instructions: instructions ?? '',
				'activity-objectives-progress': objectiveProgress
			}
		});
		ipe.push({
			format: 'json',
			language: activity.language,
			key: 'progress',
			prompt: { category: 'agents', name: `ailearn.${type}-ipe` },
			literals: {
				user: user.displayName,
				age: module.audience ?? '',
				role: role ?? '',
				subject: subject ?? '',
				prompt,
				previous: lastMessage?.content ?? '',
				'activity-objectives': activityObjectives,
				'activity-objectives-progress': objectiveProgress
			}
		});

		return { ipe };
	}

	static async process(chat, prompt: string, answer: string) {
		const ipe = IPE.get(chat, prompt);

		const promises: Promise<any>[] = [];
		ipe.forEach(({ prompt, literals, format, language }) => {
			const specs = {
				category: prompt.category,
				name: prompt.name,
				model: GPT_MODEL,
				temperature: 1,
				language,
				format: format ?? 'text',
				literals: { answer, ...literals }
			};

			const promptExecutor = new PromptTemplateExecutor(specs);
			promises.push(promptExecutor.execute());
		});

		let responseError;
		const responses = await Promise.all(promises);
		responses.forEach(({ data, error }, index) => {
			const entry = ipe[index];
			const { category, name } = entry.prompt;

			if (error) {
				responseError = { error: ErrorGenerator.processingIPE(`${category}.${name}`) };
				return;
			}
			try {
				const content = entry.format === 'json' ? JSON.parse(data?.content) : data?.content;
				ipe[index].response = content;
			} catch (exc) {
				responseError = { error: ErrorGenerator.parsingIPE(`${category}.${name}`) };
			}
		});

		return { ipe, error: responseError };
	}

	static prepare(chat: Chat, content: string) {
		const { module, activity } = chat.metadata;

		const lastTwo = chat.messages?.lastTwo ?? [];

		const lastMessage = lastTwo.find(messages => messages.role === 'assistant');
		const synthesis = lastMessage?.metadata.synthesis ?? '';
		const progress = lastMessage?.metadata.progress ?? '';

		const objectiveProgress = progress?.objectives
			? JSON.stringify([{ ...synthesis, ...progress }])
			: `The conversation hasn't started yet.`;

		const specs = activity.resources?.specs ?? activity.specs;
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
	}
}
