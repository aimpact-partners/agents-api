// import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
// import { BusinessResponse } from '@aimpact/agents-api/business/response';
// import type { IPromptTemplateLanguageData } from '@aimpact/agents-api/data/interfaces';
// import { prompts } from '@aimpact/agents-api/data/model';
// import { PromptTemplateExecutor } from '@aimpact/agents-client/prompts';
// import { PromptsTemplate } from './index';

// export /*bundle*/ class PromptTemplateLanguages {
// 	static async set(id: string, params: { language: string; text: string }) {
// 		const { language, text } = params;

// 		const errors = [];
// 		!id && errors.push('id');
// 		!text && errors.push('text');
// 		!language && errors.push('language');
// 		if (errors.length) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(errors) });

// 		try {
// 			const response = await prompts.data({ id });
// 			if (response.error) return new BusinessResponse({ error: response.error });
// 			if (!response.data.exists) {
// 				return new BusinessResponse({ error: ErrorGenerator.documentNotFound('Prompts', id) });
// 			}
// 			const prompt = response.data.data;

// 			const data: IPromptTemplateLanguageData = {
// 				id: `${prompt.identifier}.${language}`,
// 				language,
// 				value: text,
// 				literals: prompt.literals ?? {},
// 				project: prompt.project
// 			};
// 			// SET value on language subcollection
// 			const parents = { Prompts: id };
// 			const { error } = await prompts.languages.set({ id: language, parents, data });
// 			if (error) return new BusinessResponse({ error: error });

// 			if (!prompt.language.updated?.includes(language)) {
// 				const updatedLanguages = prompt.language;
// 				!prompt.language.languages.includes(language) && updatedLanguages.languages.push(language);
// 				!updatedLanguages.updated && (updatedLanguages.updated = []);
// 				updatedLanguages.updated.push(language);
// 				await prompts.merge({ id, data: { language: updatedLanguages } });
// 			}

// 			return new BusinessResponse({ data });
// 		} catch (exc) {
// 			console.error(exc);
// 			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
// 		}
// 	}

// 	static async update(id: string, language: string) {
// 		try {
// 			const response = await PromptsTemplate.data(id, language);
// 			if (response.error) {
// 				return new BusinessResponse({ error: response.error });
// 			}
// 			const prompt = response.data;
// 			if (!prompt.language.languages || !prompt.language.languages.length) {
// 				return new BusinessResponse({ error: ErrorGenerator.notLanguagesToUpdate(prompt.id) });
// 			}

// 			const promises: any[] = [];
// 			const supported = prompt.language.languages.filter((l: string) => l !== language);

// 			supported.forEach((lang: string) => {
// 				const promptExecutor = new PromptTemplateExecutor({
// 					category: 'helper',
// 					name: 'ailearn.prompts-translate',
// 					language: lang,
// 					model: 'gpt-4o-mini',
// 					temperature: 1,
// 					literals: { TEXT: prompt.value },
// 					responseFormat: 'text'
// 				});
// 				promises.push(promptExecutor.execute());
// 			});
// 			let responses = await Promise.all(promises);
// 			promises.length = 0;

// 			let error;
// 			responses.forEach((response, index) => {
// 				if (response.error) {
// 					error = response.error;
// 					return;
// 				}
// 				const text = response.data?.content;
// 				promises.push(PromptTemplateLanguages.set(id, { language: supported[index], text }));
// 			});
// 			if (error) return new BusinessResponse({ error });
// 			responses = await Promise.all(promises);

// 			responses.forEach(response => {
// 				if (!response.error) return;
// 				error = response.error;
// 			});
// 			if (error) return new BusinessResponse({ error });

// 			prompt.language.updated = [language].concat(supported);
// 			const specs = { id, language: prompt.language };
// 			const r = await PromptsTemplate.update(specs);
// 			if (r.error) return new BusinessResponse({ error: r.error });

// 			return new BusinessResponse({ data: prompt });
// 		} catch (exc) {
// 			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
// 		}
// 	}
// }
