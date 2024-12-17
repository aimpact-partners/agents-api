import { Collection } from '@beyond-js/firestore-collection/collection';
import type { IUserData } from '@aimpact/agents-api/data/interfaces';

class Users extends Collection<IUserData> {
	constructor() {
		super('Users');
	}
}

export /*bundle*/ const users: Collection<IUserData> = new Users();
