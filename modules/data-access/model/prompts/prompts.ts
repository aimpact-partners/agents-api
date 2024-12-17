import type { IPromptTemplateData } from '@aimpact/agents-api/data/interfaces';
import { Collection } from '@beyond-js/firestore-collection/collection';
import { Languages } from './languages';

class Prompts extends Collection<IPromptTemplateData> {
	#languages: Languages;
	get languages() {
		return this.#languages;
	}

	constructor() {
		super('Prompts');
		this.#languages = new Languages(this);
	}
}

export /*bundle*/ const prompts = new Prompts();
