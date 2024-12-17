import { Collection, SubCollection } from '@beyond-js/firestore-collection/collection';
import type { IPromptTemplateData, IPromptOptionData, IPromptLanguageData } from '@aimpact/agents-api/data/interfaces';

export class Languages extends SubCollection<IPromptLanguageData> {
	#options: SubCollection<IPromptOptionData>;
	get options() {
		return this.#options;
	}

	constructor(parent: Collection<IPromptTemplateData>) {
		super('Languages', parent);
		this.#options = new SubCollection('Options', this);
	}
}
