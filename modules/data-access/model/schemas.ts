import type { ISchemaData, ISchemaLanguageData } from '@aimpact/agents-api/data/interfaces';
import { Collection, SubCollection } from '@beyond-js/firestore-collection/collection';

class Schemas extends Collection<ISchemaData> {
	#languages: SubCollection<ISchemaLanguageData>;
	get languages() {
		return this.#languages;
	}

	constructor() {
		super('Schemas');
		this.#languages = new SubCollection('Languages', this);
	}
}

export /*bundle*/ const schemas = new Schemas();
