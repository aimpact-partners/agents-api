/**
 * Returned when an error occurs or used as the structure of the failed events as well.
 */
export /*bundle*/ interface IServerError {
	// The unique ID of the server event.
	// Can also be the event_id of the client event that caused the error, if applicable.
	event_id: string;

	// The type of error (e.g., "invalid_request_error", "server_error").
	type: string;

	// Error code, if any.
	code: string;

	// A human-readable error message.
	message: string;

	// Parameter related to the error, if any.
	param?: null;
}

/**
 * Event returned when an error occurs.
 */
export /*bundle*/ interface IErrorServerEvent extends IServerError {
	// The event type, must be "error".
	type: 'error';

	// Details of the error.
	error: IServerError;
}
