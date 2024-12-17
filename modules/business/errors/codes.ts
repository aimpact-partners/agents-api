export /*bundle*/ enum ErrorCodes {
	internalError = 500,
	documentNotFound = 404,
	documentNotSaved = 800,
	documentAlreadyExist,
	invalidParameters,
	projectNotFound,
	languageNotSupport,
	promptLiteralsNotFound,
	promptDependenciesNotFound,
	promptOptionsNotFound,
	promptDependenciesError,
	promptOptionsError,
	promptIsOptions,
	userAlreadyExists,
	roleNotSupported,
	unauthorizedUserForChat,
	chatNotValid,
	chatWithoutLanguages,
	chatWithoutDefaultLanguage,
	chatWithoutAssociatedProject,
	chatNotHasProjectUrlSet,
	notLanguagesToUpdate,
	llmGenerationError,
	functionExecutionError
}
