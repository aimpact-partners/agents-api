import { HTTPErrorManager } from './manager';

export /*bundle*/ enum ErrorCodes {
	internalError = 500,
	invalidParameters = 10500,
	userNotValid,
	invalidToken,
	testingError
}

export /*bundle*/ class ErrorGenerator {
	static internalError(log: string, exc?: Error) {
		return new HTTPErrorManager(ErrorCodes.internalError, `Internal server error [${log}]`, exc);
	}

	static invalidParameters(parameters: string[]) {
		return new HTTPErrorManager(ErrorCodes.invalidParameters, `Invalid parameters: ${JSON.stringify(parameters)}`);
	}

	static invalidToken() {
		return new HTTPErrorManager(ErrorCodes.invalidToken, `Invalid token`);
	}

	static userNotValid() {
		return new HTTPErrorManager(ErrorCodes.userNotValid, `User not valid`);
	}

	static testingError() {
		return new HTTPErrorManager(ErrorCodes.testingError, `Testing error message`);
	}
}
