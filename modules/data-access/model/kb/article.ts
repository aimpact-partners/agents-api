import type { IArticleData, IArticleKBData } from '@aimpact/agents-api/data/interfaces';
import { Collection, SubCollection } from '@beyond-js/firestore-collection/collection';

export /*bundle*/ class Articles extends Collection<IArticleData> {
	#kb: SubCollection<IArticleKBData>;
	get kb() {
		return this.#kb;
	}

	constructor() {
		super('Articles');
		this.#kb = new SubCollection('KB', this);
	}
}

export /*bundle*/ const articles = new Articles();
