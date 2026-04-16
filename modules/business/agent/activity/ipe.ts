import { Chat } from '@aimpact/agents-api/business/agent/chat';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { ProjectsAgents } from '@aimpact/agents-api/business/projects';
import type { IPromptExecutionParams } from '@aimpact/agents-api/business/prompts';
import { PromptTemplateExecutor } from '@aimpact/agents-api/business/prompts';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import * as dotenv from 'dotenv';
import { ILanguage, defaultTexts } from './common';

dotenv.config();
const { GPT_MODEL, LLM_MODEL, LLM_PROVIDER, LOGS_PROMPTS } = process.env;
const USERS_LOGS = ['felix@beyondjs.com', 'julio@beyondjs.com', 'boxenrique@gmail.com'];
const model = LLM_MODEL ?? GPT_MODEL;
const temperature = (LLM_PROVIDER ?? 'openai').toLowerCase() === 'deepseek' ? 0.3 : 1;

function toKebabCase(text: string) {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/\s+/g, '-')
		.replace(/_/g, '-')
		.toLowerCase();
}

export class IPE {
	static async get(chat: Chat, prompt: string) {
		const { project, metadata } = chat;

		const specs = metadata.activity.specs ?? metadata.activity.resources?.specs;
		if (!specs.objectives) {
			const previous = chat.synthesis ?? defaultTexts[<ILanguage>metadata.activity.language];
			const ipe = [
				{
					key: 'summary',
					format: 'json',
					language: metadata.activity.language,
					prompt: { category: 'agents', name: 'ailearn.agent-synthesis' },
					literals: { user: chat.user.displayName, prompt, previous }
				}
			];
			return { ipe };
		}

		const agentName = typeof project.agent === 'string' ? project.agent : metadata.activity?.type;
		const response = await ProjectsAgents.get(project.id, agentName);
		if (response.error) return { error: response.error };
		const agent = response.data;

		const ipe = agent.ipe.map(item => {
			const literals: Record<string, string> = {};
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
			literals.user && (literals.user = literals.user.replace(/^(\S+).*/, '$1'));

			const reserved = item.literals.reserved.map(literal => literal);
			return { ...item, language: metadata.language, literals, reserved };
		});

		return { ipe };
	}

	static async process(chat: Chat, message: string, answer: string) {
		const response = await IPE.get(chat, message);
		if (response.error) return { error: response.error };

		let lastMessage = {};
		const last = chat.messages?.last ?? [];
		for (let i = last.length - 1; i >= 0; i--) {
			if (last[i].role === 'assistant') lastMessage = last[i];
		}

		const defaultText = defaultTexts[<ILanguage>chat.metadata.language];
		const { ipe } = response;

		const promises: Promise<any>[] = [];
		ipe.forEach(({ prompt, literals, key, reserved, format }) => {
			const reservedValues: Record<string, string> = {};

			const objectives = chat.metadata?.objectives ?? chat.metadata['activity-objectives'];
			reservedValues.objectives = JSON.stringify(objectives); // property backward support

			reserved?.forEach((literal: string) => {
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
				model,
				temperature,
				language: chat.language,
				format,
				literals: { ...literals, ...reservedValues, prompt: message, answer }
			};

			if (LOGS_PROMPTS === 'true' && USERS_LOGS.includes(chat.user.email)) {
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
				responseError = new BusinessResponse({ error: ErrorGenerator.processingIPE(name) });
				return;
			}

			try {
				const provider = process.env.LLM_PROVIDER ?? 'openai';
				console.log(`[IPE:${provider}][raw] key=${ipe[index].key} prompt=${name} ->`, data?.content);
				const iteration = entry.format === 'text' ? data?.content : JSON.parse(data?.content);
				console.log(`[IPE:${provider}][parsed] key=${ipe[index].key} prompt=${name} ->`, JSON.stringify(iteration, null, 2));
				if (ipe[index].key === 'summary') {
					ipe[index].response = iteration;
					return;
				}

				// Defensive normalization: some providers (e.g. DeepSeek without native json_schema support)
				// may return `objectives` as an object keyed by name instead of the expected array.
				// Convert to array so the downstream `.forEach` does not throw.
				if (
					iteration?.objectives &&
					!Array.isArray(iteration.objectives) &&
					typeof iteration.objectives === 'object'
				) {
					iteration.objectives = Object.entries(iteration.objectives).map(([name, value]) => ({
						name,
						...(value as object)
					}));
				}

				const progress = (() => {
					let current = chat.ipe?.progress;
					if (!current) {
						const objectives = chat.metadata?.objectives ?? chat.metadata['activity-objectives'];
						const items = objectives?.map(item => {
							return { id: toKebabCase(item.name), name: item.name, status: 'pending' };
						});
						current = { objectives: items ?? [], reached: [] };
					}

					if (!iteration.objectives) {
						return {
							...current,
							summary: iteration.summary,
							alert: iteration.alert,
							interaction: iteration.interaction,
							knowledge: iteration.knowledge
						};
					}

					const objectivesMap = new Map((current.objectives || []).map(obj => [toKebabCase(obj.name), obj]));
					iteration.objectives.forEach(obj => {
						obj = { ...obj, analysis: obj.progress, impact: obj.integration }; // property backward support
						objectivesMap.set(toKebabCase(obj.name), obj);
					});
					const updatedObjectives = Array.from(objectivesMap.values());

					return {
						reached: iteration.reached,
						objectives: updatedObjectives ?? [],
						summary: iteration.summary,
						alert: iteration.alert,
						interaction: iteration.interaction,
						knowledge: iteration.knowledge
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
