import { ErrorManager } from '@beyond-js/response/main';
import { BusinessErrorManager } from './manager';
import { ErrorCodes } from './codes';

export /*bundle*/ class ErrorGenerator {
	static internalError(log?: string, message?: string, exc?: Error) {
		return new BusinessErrorManager(ErrorCodes.internalError, `Internal server error [${log}]: ${message}`, exc);
	}
	static documentNotFound(collectionName: string, documentId: string, exc?: Error) {
		return new BusinessErrorManager(
			ErrorCodes.documentNotFound,
			`Error getting document id "${documentId}" from "${collectionName}" collection`,
			exc
		);
	}
	static documentNotSaved(collectionName: string, documentId: string, exc?: Error) {
		return new BusinessErrorManager(
			ErrorCodes.documentNotSaved,
			`Error storing document id "${documentId}" on "${collectionName}" collection`,
			exc
		);
	}
	static documentAlreadyExist(collectionName: string, documentId: string, exc?: Error) {
		return new BusinessErrorManager(
			ErrorCodes.documentAlreadyExist,
			`Error storing document id "${documentId}" on "${collectionName}" collection`,
			exc
		);
	}
	static invalidParameters(parameters: string[]) {
		return new BusinessErrorManager(ErrorCodes.invalidParameters, `Invalid parameters: ${parameters.join(', ')}`);
	}
	static projectNotFound(id: string) {
		return new BusinessErrorManager(ErrorCodes.projectNotFound, `Project "${id}" not found`);
	}
	static languageNotSupport(collectionName: string, parameter: string, exc?: Error) {
		return new BusinessErrorManager(
			ErrorCodes.languageNotSupport,
			`${collectionName} not support "${parameter}" language`,
			exc
		);
	}
	static promptOptionsError(error: ErrorManager) {
		return new BusinessErrorManager(ErrorCodes.promptOptionsError, error.text);
	}
	static promptDependenciesError(dependency: string, error: ErrorManager) {
		return new BusinessErrorManager(
			ErrorCodes.promptDependenciesError,
			`${error.text} on dependency: ${dependency}`
		);
	}
	static promptLiteralsNotFound(items: string[]) {
		return new BusinessErrorManager(
			ErrorCodes.promptLiteralsNotFound,
			`Error/s found in at least one literals pure of the requested prompt, literals: ${items.join(', ')}`
		);
	}
	static promptDependenciesNotFound() {
		return new BusinessErrorManager(
			ErrorCodes.promptDependenciesNotFound,
			`Error/s found in at least one dependency of the requested prompt`
		);
	}
	static promptOptionsNotFound() {
		return new BusinessErrorManager(
			ErrorCodes.promptOptionsNotFound,
			`Error/s found in at least one dependency of the requested prompt`
		);
	}
	static userAlreadyExists(id: string, exc?: Error) {
		return new BusinessErrorManager(
			ErrorCodes.userAlreadyExists,
			`The user "${id}" is already registered in the application`,
			exc
		);
	}
	static roleNotSupported(role: string, exc?: Error) {
		return new BusinessErrorManager(ErrorCodes.roleNotSupported, `Role not "${role}" supported`, exc);
	}
	static unauthorizedUserForChat(exc?: Error) {
		return new BusinessErrorManager(
			ErrorCodes.unauthorizedUserForChat,
			`Unauthorized user to send messages in chat`,
			exc
		);
	}
	static chatNotValid(id: string) {
		return new BusinessErrorManager(ErrorCodes.chatNotValid, `chatId "${id}" not valid`);
	}
	static chatWithoutLanguages(id: string) {
		return new BusinessErrorManager(ErrorCodes.chatWithoutLanguages, `Chat "${id}" has no established language`);
	}
	static chatWithoutDefaultLanguage(id: string) {
		return new BusinessErrorManager(
			ErrorCodes.chatWithoutDefaultLanguage,
			`Chat "${id}" has no established default language`
		);
	}
	static chatWithoutAssociatedProject(id: string) {
		return new BusinessErrorManager(
			ErrorCodes.chatWithoutAssociatedProject,
			`Chat "${id}" does not have an established project`
		);
	}
	static chatNotHasProjectUrlSet(id: string) {
		return new BusinessErrorManager(
			ErrorCodes.chatNotHasProjectUrlSet,
			`Chat ${id} does not have a project url set`
		);
	}
	static notLanguagesToUpdate(id: string) {
		return new BusinessErrorManager(ErrorCodes.notLanguagesToUpdate, `Prompt ${id} does not have languages to set`);
	}
	static promptIsOptions(id: string) {
		return new BusinessErrorManager(ErrorCodes.promptIsOptions, `The prompt ${id} cannot be an options prompt`);
	}
	static llmGenerationError(exc?: Error) {
		return new BusinessErrorManager(ErrorCodes.llmGenerationError, 'Error on LLM generation response', exc);
	}
	static functionExecutionError(tool: { name: string }) {
		return new BusinessErrorManager(
			ErrorCodes.functionExecutionError,
			`The response processing was canceled because the "${tool.name}" tool did not complete.`
		);
	}
}
