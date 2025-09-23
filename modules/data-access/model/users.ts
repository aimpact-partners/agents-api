import type { IPeopleData } from '@aimpact/agents-api/data/interfaces';
import { SubCollection } from '@beyond-js/firestore-collection/collection';
import { MSPUsers } from './kb/users';

class Users extends MSPUsers {
	#projects: SubCollection<IPeopleData>;
	get projects() {
		return this.#projects;
	}

	constructor() {
		super('Users'); // Call MSPUsers constructor with collection name
		this.#projects = new SubCollection('Projects', this);
	}
}

export /*bundle*/ const users: Users = new Users();
