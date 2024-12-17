import { HTTPErrorManager } from '@aimpact/agents-api/http/errors';
import { Response, ErrorManager } from '@beyond-js/response/main';

export /*bundle*/ class HTTPResponse<DATA> extends Response<DATA, HTTPErrorManager> {
	constructor(params: { error?: ErrorManager; data?: DATA }) {
		const error: HTTPErrorManager = (() => {
			const { error } = params;
			if (!error) return;

			return (<HTTPErrorManager>error).is === 'agents-api-http-error'
				? <HTTPErrorManager>error
				: new HTTPErrorManager(error.code, error.text);
		})();

		super({ data: params.data, error });
	}
}
