import type { IPromptLanguageData } from '@aimpact/agents-api/data/interfaces';
import { FirestoreErrorManager } from '@beyond-js/firestore-collection/errors';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { prompts } from '@aimpact/agents-api/data/model';

export interface IPromptGenerationParams {
	category: string;
	name: string;
	language: string;
	options?: Record<string, string>;
	literals?: Record<string, string>;
}

export /*bundle*/ class PromptTemplateProcessor implements IPromptGenerationParams {
	#category: string;
	get category() {
		return this.#category;
	}

	#name: string;
	get name() {
		return this.#name;
	}

	#language: string;
	get language() {
		return this.#language;
	}

	#id: string;
	get id() {
		return this.#id;
	}

	#options: Record<string, string>;
	get options() {
		return this.#options;
	}

	#literals: Record<string, string>;
	get literals() {
		return this.#literals;
	}

	#data: IPromptLanguageData;
	get data() {
		return this.#data;
	}

	#value: string;
	get value() {
		return this.#value;
	}

	#dependencies: Record<string, string>[];
	get dependencies() {
		return this.#dependencies;
	}

	#processedValue: string;
	get processedValue() {
		return this.#processedValue;
	}

	#error: FirestoreErrorManager;
	get error() {
		return this.#error;
	}
	get valid() {
		return !this.#error;
	}

	constructor(params: IPromptGenerationParams) {
		this.#category = params.category;
		this.#name = params.name;
		this.#language = params.language;
		this.#options = params.options;

		if (!params.literals) return;

		// We uppercase the literal identifiers to handle them
		const literals: Record<string, string> = {};
		Object.keys(params.literals).forEach((key: string) => (literals[key.toUpperCase()] = params.literals[key]));
		this.#literals = literals;
	}

	async #load(): Promise<void> {
		const { name, language } = this;
		this.#id = `${name}.${language}`;

		// Get the prompt data
		await (async () => {
			const response = await prompts.languages.data({ id: language, parents: { Prompts: name } });
			if (response.error) {
				this.#error = ErrorGenerator.documentNotFound('Prompts', this.#id);
				return;
			}
			if (!response.data.exists) {
				this.#error = ErrorGenerator.documentNotFound('Prompts', this.#id);
				return;
			}
			this.#data = response.data.data;
		})();

		if (!this.valid) return;

		// The prompt cannot be an options prompt
		if (this.#data.options) {
			this.#error = ErrorGenerator.promptIsOptions(name);
			return;
		}

		this.#value = this.#data.value;
		// Get the prompts dependencies
		await (async (): Promise<any> => {
			if (!this.#data.literals?.dependencies?.length) return (this.#dependencies = []);

			const records: { id: string; parents?: Record<string, string> }[] = [];
			this.#data.literals.dependencies.forEach((dependency: string) => {
				const identifier = [this.#data.project.identifier, dependency.toLowerCase()].join('.');
				records.push({ id: this.#data.language, parents: { Prompts: identifier } });
			});

			const response = await prompts.languages.dataset({ records });
			const dependencies: IPromptLanguageData[] = (this.#dependencies = []);

			// Process the dependencies and check for possible errors
			for (const { error, data } of response) {
				if (error || !data.exists) {
					const parentId = data.doc.parent.parent?.id;
					return (this.#error = ErrorGenerator.promptDependenciesError(parentId, error ?? data.error));
				}
				dependencies.push(data.data);
			}

			records.length = 0;
			this.#dependencies = [];
			dependencies.forEach(dependency => {
				const [projectId, promptId, languageId] = dependency.id.split('.');
				if (dependency.value) {
					const specs: Record<string, string> = {};
					specs[promptId] = dependency.value;
					this.#dependencies.push(specs);
					return;
				}

				if (!(promptId in this.#options)) return;

				records.push({
					id: this.#options[promptId],
					parents: {
						Prompts: [this.#data.project.identifier, promptId].join('.'),
						Languages: this.#data.language
					}
				});
			});

			// const responseOptions = await prompts.languages.options.dataset({ records });
			// this.#data.options = [];
			// responseOptions.forEach(option => {
			// 	if (option.error) return (this.#error = ErrorGenerator.promptOptionsError(option.error));
			// 	if (option.data.error) return (this.#error = ErrorGenerator.promptOptionsError(option.data.error));

			// 	const specs: Record<string, string> = {};
			// 	specs[option.data.data.prompt] = option.data.data.value; //@ftovar8 agregar en del publish el prompt en el option
			// 	this.#data.options.push(specs);
			// });
		})();
	}

	async process() {
		await this.#load();
		if (!this.valid) return this.#error;

		// Check that all required pure literals has been received
		(() => {
			const received = this.literals; // The key/value literals received to be applied to the prompt
			const expected = this.#data?.literals?.pure; // The literals as specified in the database
			if (!expected) return;

			const notfound = expected.filter((pureLiteral: string) => !received.hasOwnProperty(pureLiteral));
			if (notfound.length) {
				this.#error = ErrorGenerator.promptLiteralsNotFound(notfound);
				return;
			}
		})();

		// Check that all required dependencies literals has been received
		(() => {
			const received = this.#data.literals?.dependencies?.map((d: string) => d.toLowerCase()); // The key/value literals received to be applied to the prompt
			const expected = this.#dependencies; // The literals as specified in the database
			if (!expected) return;

			const notfound = expected.filter(literal => !received.includes(Object.keys(literal)[0]));
			if (notfound.length) {
				this.#error = ErrorGenerator.promptDependenciesNotFound();
				return;
			}
		})();

		// Check that all required options has been received
		// (() => {
		// 	const received = this.options; // The key/value options received to be applied to the prompt
		// 	const expected = this.#data.options; // The options as specified in the database
		// 	if (!expected) return;

		// 	const notfound = expected.filter(option => {
		// 		return !received.hasOwnProperty(Object.keys(option)[0]);
		// 	});
		// 	if (notfound.length) {
		// 		this.#error = ErrorGenerator.promptOptionsNotFound();
		// 		return;
		// 	}
		// })();

		if (!this.valid) return this.#error;

		// Process the value of the prompt with the replacement of the received literals and options
		this.#processedValue = (() => {
			let value = this.#value;
			const replacement = (received: Record<string, string>, literal = false): void => {
				Object.entries(received).forEach(([name, val]) => {
					// Replace the dependencies and options literals
					if (!literal) {
						const regex = new RegExp(`{${name}}`, 'gi');
						value = value.replace(regex, val);
						return;
					}

					// Replace the Pure literal
					let screaming = `{${name}}`.replace(/{([a-z])([A-Z])}/g, '$1_$2');
					const regex = new RegExp(screaming, 'g');
					value = value.replace(regex, val);
				});
			};

			// Process the dependencies that are not options (ex: HEADER)
			this.#dependencies?.forEach(dependency => replacement(dependency));

			// Process the options
			// this.#data.options?.forEach(option => replacement(option));

			// Replace the pure literals
			this.literals && replacement(this.literals, true);

			// console.log('/-----------------------------------');
			// console.log(this.#name);
			// console.log(value);
			// console.log('----------------------------------- /');
			return value;
		})();
	}
}
