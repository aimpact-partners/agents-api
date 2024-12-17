/**
 * Send this event to cancel an in-progress response.
 */
export /*bundle*/ interface IResponseCancelClientEvent {
	// Optional client-generated ID used to identify this event.
	event_id: string;

	// The event type, must be "response.cancel".
	type: 'response.cancel';
}
