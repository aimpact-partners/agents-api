import type { IPeopleData, ISectionData, ISectionKBObjectsBase } from '@aimpact/agents-api/data/interfaces';
import { Collection, SubCollection } from '@beyond-js/firestore-collection/collection';

export /*bundle*/ class Sections extends Collection<ISectionData> {
	#people: SubCollection<IPeopleData>;
	get people() {
		return this.#people;
	}

	#kbObjects: SubCollection<ISectionKBObjectsBase>;
	get kbObjects() {
		return this.#kbObjects;
	}

	constructor() {
		super('Sections');
		this.#people = new SubCollection('People', this);
		this.#kbObjects = new SubCollection('KBObjects', this);
	}
}

export /*bundle*/ const sections = new Sections();
