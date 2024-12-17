import { Collection } from '@beyond-js/firestore-collection/collection';
import type { IPromptCategoryBase } from '@aimpact/agents-api/data/interfaces';

class PromptCategories extends Collection<IPromptCategoryBase> {
	constructor() {
		super('PromptCategories');
	}
}

export /*bundle*/ const promptsCategories: Collection<IPromptCategoryBase> = new PromptCategories();
