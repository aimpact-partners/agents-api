import type { IOrganizationData, IPeopleData, ISectionItemBase } from '@aimpact/agents-api/data/interfaces';
import { Collection, SubCollection } from '@beyond-js/firestore-collection/collection';

export /*bundle*/ class Organizations extends Collection<IOrganizationData> {
	#people: SubCollection<IPeopleData>;
	get people() {
		return this.#people;
	}

	#sections: SubCollection<ISectionItemBase>;
	get sections() {
		return this.#sections;
	}

	constructor() {
		super('Organizations');
		this.#people = new SubCollection('People', this);

		this.#sections = new SubCollection('Sections', this);
	}
}

export /*bundle*/ const organizations = new Organizations();
