import { OpenAIBackend } from '@aimpact/agents-api/backend-openai';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { Projects } from '@aimpact/agents-api/business/projects';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type {
	IPromptLanguage,
	IPromptLiterals,
	IPromptTemplateBase,
	IPromptTemplateData,
	IPromptTemplateLanguageData
} from '@aimpact/agents-api/data/interfaces';
import { prompts } from '@aimpact/agents-api/data/model';
import { db } from '@beyond-js/firestore-collection/db';
import { FirestoreErrorManager } from '@beyond-js/firestore-collection/errors';
import { Response } from '@beyond-js/response/main';
import OpenAI from 'openai';
import { v4 as uuid } from 'uuid';

type PromptTemplateResponse = Promise<BusinessResponse<IPromptTemplateData & { value?: string }>>;

export /*bundle*/ class PromptsTemplate {
	static async data(id: string, language?: string): PromptTemplateResponse {
		try {
			const prompt = await prompts.data({ id });
			if (prompt.error) return new BusinessResponse({ error: prompt.error });
			if (!prompt.data.exists) {
				return new BusinessResponse({ error: ErrorGenerator.documentNotFound('Prompts', id) });
			}

			// If the language is not received, it is returned with the default language
			const promptData = prompt.data.data;
			if (!language) language = promptData.language.default;

			if (!promptData.language.languages.includes(language)) {
				const error = ErrorGenerator.languageNotSupport('Prompts', language);
				return new BusinessResponse({ error });
			}

			const languageDoc = await prompts.languages.data({ id: language, parents: { Prompts: id } });
			if (languageDoc.error) return new BusinessResponse({ error: languageDoc.error });
			if (!languageDoc.data.exists) return new BusinessResponse({ data: promptData });

			const value = Object.assign({}, promptData, { value: languageDoc.data.data.value });
			return new BusinessResponse({ data: value });

			// if (!option) {
			// const parents = { Prompts: id, Languages: language };
			// const subCollection = await prompts.languages.options.data({ id: option, parents });
			// const value = Object.assign({}, promptData, { ...{ language: languageDoc.data.data } });
			// value.option = subCollection.data.data;
			// return new BusinessResponse({ data: value });
			// }
		} catch (exc) {
			console.error(exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async identifier(identifier: string, language?: string) {
		try {
			const prompt = await db.collection('Prompts').where('identifier', '==', identifier).get();
			if (prompt.empty) {
				const error = ErrorGenerator.documentNotFound('Prompts', identifier);
				return new BusinessResponse({ error });
			}

			const id = prompt.docs[0].id;
			return await PromptsTemplate.data(id, language);
		} catch (exc) {
			console.error(exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async list(projectId: string, filter: string) {
		try {
			const dataProject = await Projects.data(projectId);
			if (dataProject.error) return new BusinessResponse({ error: dataProject.error });
			if (!dataProject.data.exists) return new BusinessResponse({ error: dataProject.data.error });

			let query = db.collection('Prompts').where('project.id', '==', projectId);
			if (filter) {
				query = <FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>>(
					query.where('is', '==', filter)
				);
			}

			const items = await query.get();
			const entries = items.docs.map(item => item.data());
			return new BusinessResponse({ data: { entries } });
		} catch (exc) {
			console.error(exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async process(content: string, model: string, temperature: number) {
		try {
			const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: 'user', content }];
			const openai = new OpenAIBackend();
			const response = await openai.chatCompletions(messages, model, temperature);

			const { error } = response;
			const data = response.data ? { output: response.data } : undefined;

			return new BusinessResponse({ error, data });
		} catch (exc) {
			console.error(exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async delete(id: string) {
		if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

		try {
			const response = await prompts.data({ id });
			if (response.error) return new BusinessResponse({ error: response.error });
			if (!response.data.exists) return new BusinessResponse({ error: response.data.error });

			const responseDelete = await prompts.delete({ id });
			if (responseDelete.error) return new BusinessResponse({ error: responseDelete.error });

			//FALTA eliminar las subcolecciones de languages

			return new BusinessResponse({ data: responseDelete.data });
		} catch (exc) {
			console.error(exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async update(params: any): PromptTemplateResponse {
		if (!params.id) return new Response({ error: ErrorGenerator.invalidParameters(['id']) });

		try {
			const dataResponse = await PromptsTemplate.data(params.id);
			if (dataResponse.error) return dataResponse;

			const { id, name, description, language, format, is, literals } = params;

			const specs: {
				id: string;
				name?: string;
				description?: string;
				format?: 'json' | 'text';
				is?: 'prompt' | 'function' | 'dependency';
				literals?: IPromptLiterals;
				language?: IPromptLanguage;
			} = { id: id };

			name && (specs.name = name);
			description && (specs.description = description);
			language && (specs.language = language);
			format && (specs.format = format);
			is && (specs.is = is);
			literals && (specs.literals = literals);

			const response = await prompts.merge({ data: specs });
			if (response.error) return new BusinessResponse({ error: response.error });

			return PromptsTemplate.data(id);
		} catch (exc) {
			const error = ErrorGenerator.internalError(exc);
			return new Response({ error });
		}
	}

	static async save(params: IPromptTemplateBase) {
		if (!params.projectId) return new Response({ error: ErrorGenerator.invalidParameters(['projectId']) });

		try {
			const dataProject = await Projects.data(params.projectId);
			if (dataProject.error) return dataProject;
			if (!dataProject.data.exists) {
				const error = ErrorGenerator.documentNotFound('projects', params.projectId);
				return new Response({ error });
			}

			const errors = [];
			if (!params.name) errors.push('name');
			if (!params.language || !params.language.languages || !params.language.default) errors.push('language');
			if (params.format !== 'text' && params.format !== 'json') errors.push('format');
			if (params.is !== 'prompt' && params.is !== 'function' && params.is !== 'dependency') {
				errors.push('is');
			}
			if (errors.length) return new Response({ error: ErrorGenerator.invalidParameters(errors) });

			const project = dataProject.data.data;
			const name = params.name.toLowerCase();
			const identifier = name.replace(/\s+/g, '-');
			const id = params.id ?? `${project.identifier}.${identifier}`;
			// const id = params.id ?? uuid();

			const toSave: IPromptTemplateData = {
				project: { id: project.id, name: project.name, identifier: project.identifier },
				id,
				name,
				identifier: `${project.identifier}.${identifier}`,
				language: params.language,
				format: params.format,
				is: params.is
			};
			params.value && (toSave.value = params.value);

			params.description && (toSave.description = params.description);
			params.literals && (toSave.literals = params.literals);

			const specs = { data: toSave };
			const response = await prompts.set(specs);
			if (response.error) return new BusinessResponse({ error: response.error });

			if (!params.value) {
				return new BusinessResponse({ data: toSave });
			}

			const data: IPromptTemplateLanguageData = {
				id: `${project.identifier}.${name}.${params.language.default}`,
				project: { id: project.id, name: project.name, identifier: project.identifier },
				language: params.language.default
			};
			params.value && (data.value = params.value);
			params.literals && (data.literals = params.literals);

			const parents = { Prompts: id };
			await prompts.languages.set({ id: params.language.default, parents, data });

			return await PromptsTemplate.data(id);
		} catch (exc) {
			console.error(exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}
}
