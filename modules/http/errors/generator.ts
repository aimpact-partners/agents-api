import { HTTPErrorManager } from './manager';

export /*bundle*/ enum ErrorCodes {
	internalError = 500,
	invalidParameters = 10500,
	userNotValid,
	invalidToken,
	testing,
	transcribe
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

	static testing() {
		return new HTTPErrorManager(ErrorCodes.testing, `Testing error message`);
	}

	static transcribe(text: string) {
		return new HTTPErrorManager(ErrorCodes.transcribe, text);
	}
}
