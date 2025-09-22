import type { IKBObjectData } from '@aimpact/agents-api/data/interfaces';
import { Collection } from '@beyond-js/firestore-collection/collection';

export /*bundle*/ class KBObjects extends Collection<IKBObjectData> {
	constructor() {
		super('KBObjects');
	}
}

export /*bundle*/ const kbOjects = new KBObjects();
