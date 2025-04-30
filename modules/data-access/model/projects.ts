import type { IAgentData, IPeopleData, IProjectData } from '@aimpact/agents-api/data/interfaces';
import { Collection, SubCollection } from '@beyond-js/firestore-collection/collection';

export /*bundle*/ class Projects extends Collection<IProjectData> {
	#people: SubCollection<IPeopleData>;
	get people() {
		return this.#people;
	}

	#agents: SubCollection<IAgentData>;
	get agents() {
		return this.#agents;
	}

	#apiKeys: SubCollection<IApiKeyData>;
	get apiKeys() {
		return this.#apiKeys;
	}

	constructor() {
		super('Projects');
		this.#agents = new SubCollection('Agents', this);
		this.#people = new SubCollection('People', this);
		this.#apiKeys = new SubCollection('ApiKeys', this);
	}
}

export /*bundle*/ const projects = new Projects();
