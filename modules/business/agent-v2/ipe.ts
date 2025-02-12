import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { ProjectsAgents } from '@aimpact/agents-api/business/projects';
import type { IPromptExecutionParams } from '@aimpact/agents-api/business/prompts';
import { PromptTemplateExecutor } from '@aimpact/agents-api/business/prompts';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { User } from '@aimpact/agents-api/business/user';
import * as dotenv from 'dotenv';
import { Chat } from './chat';

dotenv.config();
const { GPT_MODEL, USER_LOGS_PROMPTS } = process.env;

const defaultText = `The conversation hasn't started yet.`;

const LOGS = true;

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

	static async process(chat: Chat, message: string, answer: string, user: User) {
		const response = await IPE.get(chat, message);
		if (response.error) return { error: response.error };

		const last = chat.messages?.last ?? [];
		let lastMessage = {};
		for (let i = last.length - 1; i >= 0; i--) {
			if (last[i].role === 'assistant') lastMessage = last[i];
		}

		const { ipe } = response;
		const promises: Promise<any>[] = [];
		ipe.forEach(({ prompt, literals, key, reserved, format }) => {
			const reservedValues: Record<string, string> = {};
			reserved.forEach((literal: string) => {
				if (literal.toUpperCase() === 'PREVIOUS') {
					reservedValues[literal] = lastMessage?.content ?? '';
					return;
				}

				const summary = chat.ipe?.summary ?? defaultText;
				reservedValues.summary = summary;
				reservedValues.objectives = JSON.stringify(chat.metadata['activity-objectives']);
				if (key == 'progress') {
					const progress = chat.ipe?.progress ?? {};

					let objectiveProgress;

					if (progress.objectives) {
						objectiveProgress = progress.objectives?.map(obj => {
							return { name: obj.name, progress: obj.progress, status: obj.status };
						});

						objectiveProgress = JSON.stringify(objectiveProgress);
					} else objectiveProgress = defaultText;

					reservedValues.progress = objectiveProgress;
				}
			});

			const specs: IPromptExecutionParams = {
				category: prompt.category,
				name: prompt.name,
				model: GPT_MODEL,
				temperature: 1,
				language: chat.language,
				format: format ?? 'text',
				literals: { ...literals, ...reservedValues, prompt: chat.ipe ? message : '', answer }
			};

			if (LOGS && user.email === USER_LOGS_PROMPTS) {
				specs.store = true;
				specs.metadata = {
					key: `agent/${chat.metadata.activity.type}/${prompt.name}`,
					prompt: prompt.name
				};
			}
			const promptExecutor = new PromptTemplateExecutor(specs);
			promises.push(promptExecutor.execute());
		});

		let responseError;
		const responses = await Promise.all(promises);
		responses.forEach(({ data, error }, index) => {
			const entry = ipe[index];
			const { category, name } = entry.prompt;

			if (error) {
				responseError = new BusinessResponse({ error: ErrorGenerator.processingIPE(`${category}.${name}`) });
				return;
			}
			try {
				const content = entry.format === 'text' ? data?.content : JSON.parse(data?.content);
				if (ipe[index].key === 'summary') {
					ipe[index].response = content;
					return;
				}

				//
				const check = () => {
					const newIteration = content;

					let currentProgress = chat.ipe?.progress;
					if (!currentProgress) {
						const objectives = chat.metadata['activity-objectives']?.map(item => ({
							name: item.name,
							status: 'pending'
						}));
						currentProgress = { objectives, reached: [] };
					}

					if (!newIteration.objectives) {
						return { ...currentProgress, summary: newIteration.summary, alert: newIteration.alert };
					}

					const objectivesMap = new Map((currentProgress.objectives || []).map(obj => [obj.name, obj]));
					newIteration.objectives.forEach(obj => objectivesMap.set(obj.name, obj));
					const updatedObjectives = Array.from(objectivesMap.values());

					return {
						reached: newIteration.reached,
						objectives: updatedObjectives,
						summary: newIteration.summary,
						alert: newIteration.alert
					};
				};

				const progress = check();
				// console.log('_____________________________________');
				// console.log(progress);
				// console.log('_____________________________________');
				ipe[index].response = progress;
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
		let lastMessage;
		for (let i = last.length - 1; i >= 0; i--) {
			if (last[i].role === 'assistant') lastMessage = last[i];
		}

		const summary = lastMessage?.metadata.summary ?? defaultText;
		const progress = lastMessage?.metadata.progress ?? {};

		// new
		let objectiveProgress;
		if (progress.objectives) {
			objectiveProgress = progress.objectives?.map(obj => {
				return { name: obj.name, progress: obj.progress, status: obj.status };
			});
			objectiveProgress = JSON.stringify(objectiveProgress);
		} else objectiveProgress = defaultText;

		const specs = activity.resources?.specs ?? activity.specs;
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
			objectives: JSON.stringify(specs?.objectives), // NEW
			summary, // NEW
			progress: objectiveProgress, // NEW
			'activity-objectives': JSON.stringify(specs?.objectives), // OLD
			'activity-objectives-progress': objectiveProgress
				? JSON.stringify(objectiveProgress)
				: `The conversation hasn't started yet.` // OLD
		};

		const messages = [...last].reverse().map(({ role, content }) => ({ role, content }));
		messages.push({ role: 'user', content });

		const version = activity.type === 'content-theory' ? `v3` : `v2`;
		const promptName = `ailearn.activity-${activity.type}-${version}`;
		const response = {
			category: 'agents',
			name: promptName,
			language: activity.language,
			literals,
			messages: messages ?? [],
			model: GPT_MODEL,
			temperature: 1
		};

		if (LOGS && user.email === USER_LOGS_PROMPTS) {
			response.store = true;
			response.metadata = {
				key: `agent/${activity.type}/${promptName}`,
				prompt: promptName
			};
		}

		return response;
	}
}
