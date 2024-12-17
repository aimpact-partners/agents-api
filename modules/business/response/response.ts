import { BusinessErrorManager } from '@aimpact/agents-api/business/errors';
import { Response, ErrorManager } from '@beyond-js/response/main';

export /*bundle*/ class BusinessResponse<DATA> extends Response<DATA, BusinessErrorManager> {
	constructor(params: { error?: ErrorManager; data?: DATA }) {
		const error: BusinessErrorManager = (() => {
			const { error } = params;
			if (!error) return;

			return (<BusinessErrorManager>error).is === 'chat-business-error'
				? <BusinessErrorManager>error
				: new BusinessErrorManager(error.code, error.text);
		})();

		super({ data: params.data, error });
	}
}
