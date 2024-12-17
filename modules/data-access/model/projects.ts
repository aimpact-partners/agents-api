import { Collection } from '@beyond-js/firestore-collection/collection';
import type { IProjectData } from '@aimpact/agents-api/data/interfaces';

class Projects extends Collection<IProjectData> {
	constructor() {
		super('Projects');
	}
}

export /*bundle*/ const projects: Collection<IProjectData> = new Projects();
