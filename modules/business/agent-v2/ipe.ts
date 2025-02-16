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

const LOGS = false;
type ILanguage = 'es' | 'en' | 'de' | 'it' | 'pt';

const defaultTexts = {
	es: `La conversación aún no ha comenzado.`,
	en: `The conversation hasn't started yet.`,
	de: `Das Gespräch hat noch nicht begonnen.`,
	it: `La conversazione non è ancora iniziata.`,
	pt: `A conversa ainda não começou.`
};

export class IPE {
	static async get(chat: Chat) {
		const { project, metadata } = chat;
		const response = await ProjectsAgents.get(project.id, project.agent);
		if (response.error) return { error: response.error };
		const agent = response.data;

		const ipe = [];
		agent.ipe.forEach(item => {
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

			const reserved: string[] = [];
			item.literals.reserved.forEach(literal => reserved.push(literal));

			ipe.push(Object.assign({}, item, { language: metadata.language, literals, reserved }));
		});

		return { ipe };
	}

	static async process(chat: Chat, message: string, answer: string, user: User) {
		const response = await IPE.get(chat);
		if (response.error) return { error: response.error };

		const last = chat.messages?.last ?? [];
		let lastMessage = {};
		for (let i = last.length - 1; i >= 0; i--) {
			if (last[i].role === 'assistant') lastMessage = last[i];
		}

		const defaultText = defaultTexts[<ILanguage>chat.metadata.language];

		const { ipe } = response;
		const promises: Promise<any>[] = [];
		ipe.forEach(({ prompt, literals, key, reserved, format }) => {
			const reservedValues: Record<string, string> = {};

			reservedValues.objectives = JSON.stringify(chat.metadata['activity-objectives']);
			reserved.forEach((literal: string) => {
				if (literal.toUpperCase() === 'PREVIOUS') {
					reservedValues[literal] = lastMessage?.content ?? '';
					return;
				}
				if (literal.toUpperCase() === 'SUMMARY') {
					reservedValues[literal] = chat.ipe?.summary ?? defaultText;
					return;
				}
				if (literal.toUpperCase() === 'PROGRESS') {
					const progress = chat.ipe?.progress ?? {};

					let objectiveProgress;
					if (progress.objectives) {
						objectiveProgress = progress.objectives?.map(obj => {
							return { name: obj.name, progress: obj.progress, status: obj.status };
						});

						objectiveProgress = JSON.stringify(objectiveProgress);
					} else objectiveProgress = defaultText;

					reservedValues[literal] = objectiveProgress;
					return;
				}
			});

			const specs: IPromptExecutionParams = {
				category: prompt.category,
				name: prompt.name,
				model: GPT_MODEL,
				temperature: 1,
				language: chat.language,
				format: format ?? 'text',
				literals: { ...literals, ...reservedValues, prompt: message, answer }
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

				let progress;
				progress = (() => {
					const newIteration = content;

					let currentProgress = chat.ipe?.progress;
					if (!currentProgress) {
						const objectives = chat.metadata['activity-objectives']?.map(item => ({
							name: item.name,
							status: 'pending'
						}));
						currentProgress = { objectives: objectives ?? [], reached: [] };
					}

					if (!newIteration.objectives) {
						return { ...currentProgress, summary: newIteration.summary, alert: newIteration.alert };
					}

					const objectivesMap = new Map((currentProgress.objectives || []).map(obj => [obj.name, obj]));
					newIteration.objectives.forEach(obj => {
						obj = { ...obj, analysis: obj.progress, impact: obj.integration }; // property backward support
						objectivesMap.set(obj.name, obj);
					});
					const updatedObjectives = Array.from(objectivesMap.values());

					return {
						reached: newIteration.reached,
						objectives: updatedObjectives ?? [],
						summary: newIteration.summary,
						alert: newIteration.alert
					};
				})();

				ipe[index].response = progress;
			} catch (exc) {
				responseError = new BusinessResponse({ error: ErrorGenerator.parsingIPE(`${category}.${name}`) });
			}
		});

		return { ipe, error: responseError };
	}
}
