import type { IRealtimeResponse } from './response';

/**
 * Returned when a new Response is created.
 * The first event of response creation, where the response is in an initial state of "in_progress".
 */
export /*bundle*/ interface IResponseCreatedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "response.created".
	type: 'response.created';

	// The response resource.
	response: IRealtimeResponse & {
		status: 'in_progress';
	};
}
