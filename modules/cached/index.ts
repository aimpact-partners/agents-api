import { projects } from './projects';

export /*bundle*/ const cached = new (class Cached {
	get projects() {
		return projects;
	}
})();
