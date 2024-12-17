import type { IRealtimeResponse } from './response';

// The final status of the response ("completed", "cancelled", "failed", "incomplete").
export /*bundle*/ type IResponseDoneStatus = 'in_progress' | 'incomplete' | 'completed' | 'cancelled' | 'failed';

/**
 * Returned when a Response is done streaming. Always emitted, no matter the final state.
 */
export /*bundle*/ interface IResponseDoneServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "response.done".
	type: 'response.done';

	// The response resource.
	response: IRealtimeResponse & {
		status: IResponseDoneStatus;
	};
}
