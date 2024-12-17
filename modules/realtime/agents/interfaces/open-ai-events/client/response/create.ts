import type { IResponse } from '../../session';

/**
 * Send this event to trigger a response generation.
 */
export /*bundle*/ interface IResponseCreateClientEvent {
	// Optional client-generated ID used to identify this event.
	event_id: string;

	// The event type, must be "response.create".
	type: 'response.create';

	// Configuration for the response.
	response: IResponse;
}
