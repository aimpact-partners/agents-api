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
	static parsingIPE(name: string) {
		return new BusinessErrorManager(ErrorCodes.parsingIPE, `Error parsing IPE: "${name}"`);
	}
	static processingIPE(name: string) {
		return new BusinessErrorManager(ErrorCodes.processingIPE, `Error processing IPE: "${name}"`);
	}
	static invalidAccessToken() {
		return new BusinessErrorManager(
			ErrorCodes.invalidAccessToken,
			`Invalid Access token or Access token not provided`
		);
	}
	static insufficientCredits() {
		return new BusinessErrorManager(ErrorCodes.insufficientCredits, `insufficient credits`);
	}
	static ipeKeyNotDefined() {
		return new BusinessErrorManager(ErrorCodes.ipeKeyNotDefined, `IPE key not defined`);
	}

	static classroomAccessForbidden(user: User, classroomId: string) {
		return new BusinessErrorManager(
			ErrorCodes.classroomAccessForbidden,
			`User "${user.name} [${user.uid}]" does not have access to classroom "${classroomId}", or classroom not found`
		);
	}

	static joinWaitingToConfirm(email: string) {
		return new BusinessErrorManager(
			ErrorCodes.joinWaitingToConfirm,
			`The join request of user "${email}" is waiting to be confirmed.`
		);
	}

	static invitationAlreadyExists(email: string, entity: string, id: string) {
		return new BusinessErrorManager(
			ErrorCodes.invitationAlreadyExists,
			`There is already an invitation for "${email}" in the ${entity} "${id}".`
		);
	}

	static userAlreadyExistOnGroup(email: string, entity: string) {
		return new BusinessErrorManager(
			ErrorCodes.userAlreadyExistOnGroup,
			`User "${email}" is already authorized in the ${entity}.`
		);
	}

	static mailTemplatesNotDefined(template: string) {
		return new BusinessErrorManager(
			ErrorCodes.mailTemplatesNotDefined,
			`Could not send email to user. "${template}" not defined`
		);
	}

	static mailNotSend() {
		return new BusinessErrorManager(ErrorCodes.mailNotSend, `Could not send email to user.`);
	}

	static invitationNotValid(email: string, entity: string) {
		return new BusinessErrorManager(
			ErrorCodes.invitationNotValid,
			`The "${email}" invitation in the ${entity} is inactive or not exist.`
		);
	}

	static codeNotFound(code: string, entity: string) {
		return new BusinessErrorManager(
			ErrorCodes.codeNotFound,
			`Code "${code}" not valid for ${entity}. Please check the code and try again.`
		);
	}

	static userNotAuthorizedOnGroup(group: { entity: { name: string }; id: string }) {
		return new BusinessErrorManager(
			ErrorCodes.userNotAuthorizedOnGroup,
			`User not authorized on ${group.entity.name} "${group.id}".`
		);
	}

	static entityNotValid(entity: string) {
		return new BusinessErrorManager(ErrorCodes.entityNotValid, `Entity "${entity}" not valid for Code collection.`);
	}

	static noAdministratorsToNotify() {
		return new BusinessErrorManager(ErrorCodes.noAdministratorsToNotify, `No admins to notify free trial`);
	}

	static userPendingRequestOnGroup(userId: string, groupId: string) {
		return new BusinessErrorManager(
			ErrorCodes.userPendingRequestOnGroup,
			`User "${userId}" has a pending request in the group "${groupId}"`
		);
	}

	static userInvitePendingOnGroup(userId: string, groupId: string) {
		return new BusinessErrorManager(
			ErrorCodes.userInvitePendingOnGroup,
			`User "${userId}" has a pending invitation in the group "${groupId}"`
		);
	}

	static invalidToDelete(collection: string, id: string, entities: string[]) {
		return new BusinessErrorManager(
			ErrorCodes.invalidToDelete,
			`${collection} "${id}" cannot be deleted because it has associated data from the following entities: ${entities.join(
				', '
			)}`
		);
	}

}
