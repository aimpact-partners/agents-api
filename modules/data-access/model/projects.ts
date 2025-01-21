import { Collection, SubCollection } from '@beyond-js/firestore-collection/collection';
import type { IProjectData, IAgentsData } from '@aimpact/agents-api/data/interfaces';

class Projects extends Collection<IProjectData> {
	#agents: SubCollection<IAgentsData>;
	get agents() {
		return this.#agents;
	}

	constructor() {
		super('Projects');
		this.#agents = new SubCollection('Agents', this);
	}
}

export /*bundle*/ const projects = new Projects();
