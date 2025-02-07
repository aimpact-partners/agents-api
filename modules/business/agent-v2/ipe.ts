import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { ProjectsAgents } from '@aimpact/agents-api/business/projects';
import { PromptTemplateExecutor } from '@aimpact/agents-api/business/prompts';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { User } from '@aimpact/agents-api/business/user';
import * as dotenv from 'dotenv';
import { Chat } from './chat';

dotenv.config();
const { GPT_MODEL } = process.env;

export class IPE {
	static async get(chat: Chat, prompt: string) {
		const { project } = chat;
		const response = await ProjectsAgents.get(project.id, project.agent);
		if (response.error) return { error: response.error };

		const { metadata } = chat;
		const agentData = response.data;
		//
		const ipe = [];
		agentData.ipe.forEach(item => {
			const literals = {};
			item.literals.pure.forEach(literal => {
				literals[literal] =
					typeof metadata[literal] === 'object'
						? Object.entries(metadata[literal])
								.map((entry, index) => {
									return `  ${entry[0]}: ${entry[1]}`;
								})
								.join(`\n`)
						: metadata[literal];
			});

			const reserved = [];
			item.literals.reserved.forEach(literal => reserved.push(literal));

			ipe.push(Object.assign({}, item, { language: metadata.language, literals, reserved }));
		});

		return { ipe };
	}

	static async process(chat: Chat, message: string, answer: string) {
		const response = await IPE.get(chat, message);
		if (response.error) return { error: response.error };

		const { ipe } = response;
		const promises: Promise<any>[] = [];
		ipe.forEach(({ prompt, literals, key, reserved, format }) => {
			const reservedValues = {};
			reserved.forEach(literal => {
				if (literal.toUpperCase() === 'PREVIOUS') {
					const lastMessage = chat.messages?.last.find(messages => messages.role === 'assistant');
					reservedValues[literal] = lastMessage?.content ?? '';
					return;
				}

				const summary = chat.ipe?.summary;
				const progress = chat.ipe?.progress?.objectives;

				const objectiveProgress = chat.ipe
					? JSON.stringify([{ progress, summary }])
					: `The conversation hasn't started yet.`;

				reservedValues[literal] = objectiveProgress;
			});

			const specs = {
				category: prompt.category,
				name: prompt.name,
				model: GPT_MODEL,
				temperature: 1,
				language: chat.language,
				format: format ?? 'text',
				literals: { ...literals, ...reservedValues, prompt: message, answer }
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
				console.error('IPE', error);
				responseError = new BusinessResponse({ error: ErrorGenerator.processingIPE(`${category}.${name}`) });
				return;
			}
			try {
				const content = entry.format === 'json' ? JSON.parse(data?.content) : data?.content;
				ipe[index].response = content;
			} catch (exc) {
				responseError = new BusinessResponse({ error: ErrorGenerator.parsingIPE(`${category}.${name}`) });
			}
		});

		return { ipe, error: responseError };
	}

	// Assistant Mission
	static prepare(chat: Chat, content: string, user: User) {
		const { module, activity } = chat.metadata;

		const last = chat.messages?.last ?? [];
		const lastMessage = last.find(messages => messages.role === 'assistant');
		const synthesis = lastMessage?.metadata.synthesis ?? '';
		const progress = lastMessage?.metadata.progress ?? '';

		const objectiveProgress = progress?.objectives
			? JSON.stringify([{ ...synthesis, ...progress }])
			: `The conversation hasn't started yet.`;

		const specs = activity.resources?.specs ?? activity.specs;
		const objectives = specs?.objectives
			.map((objective: { name: string; objective: string }) => `* ${objective.name}: ${objective.objective}`)
			.join(`\n`);

		const { subject, role, topic, instructions } = specs;

		const audience = module.audience;

		const literals = {
			user: chat.user.displayName,
			age: audience,
			audience,
			topic: topic ?? '',
			role: role ?? '',
			subject: subject ?? '',
			instructions: instructions ?? '',
			objective: activity.objective ?? '',
			'activity-objectives': objectives,
			'activity-objectives-progress': objectiveProgress
		};

		const messages = last.map(message => ({ role: message.role, content: message.content }));
		messages.push({ role: 'user', content });

		const promptName = `ailearn.activity-${activity.type}-v2`;
		if (user.email === 'boxenrique@gmail.com') {
			specs.store = true;
			specs.metadata = {
				key: `agent/${activity.type}/${promptName}`,
				prompt: promptName
			};
		}

		return {
			category: 'agents',
			name: promptName,
			language: activity.language,
			literals,
			messages: messages ?? [],
			model: GPT_MODEL,
			temperature: 1
		};
	}
}
