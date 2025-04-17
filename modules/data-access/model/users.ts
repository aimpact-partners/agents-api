import type { IUserData, IPeopleData } from '@aimpact/agents-api/data/interfaces';
import { Collection, SubCollection } from '@beyond-js/firestore-collection/collection';

class Users extends Collection<IUserData> {
	#projects: SubCollection<IPeopleData>;
	get projects() {
		return this.#projects;
	}

	constructor() {
		super('Users');
		this.#projects = new SubCollection('People', this);
	}
}

export /*bundle*/ const users: Collection<IUserData> = new Users();
