import { Collection } from '@beyond-js/firestore-collection/collection';
import type { IKnowledgeBoxesData } from '@aimpact/agents-api/data/interfaces';

class KB extends Collection<IKnowledgeBoxesData> {
	constructor() {
		super('KB');
	}
}

export /*bundle*/ const kb: Collection<IKnowledgeBoxesData> = new KB();
