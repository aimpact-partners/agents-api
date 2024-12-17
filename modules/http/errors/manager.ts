import { ErrorManager } from '@beyond-js/response/main';

export /*bundle*/ class HTTPErrorManager extends ErrorManager {
	get is(): 'agents-api-http-error' {
		return 'agents-api-http-error';
	}
}
