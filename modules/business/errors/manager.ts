import { ErrorManager } from '@beyond-js/response/main';

export /*bundle*/ class BusinessErrorManager extends ErrorManager {
	get is() {
		return 'agents-api';
	}
}
