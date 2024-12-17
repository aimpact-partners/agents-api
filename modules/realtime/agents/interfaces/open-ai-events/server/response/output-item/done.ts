import type { IResponseItem } from '@aimpact/agents-api/realtime/interfaces/item';

/**
 * Returned when an Item is done streaming.
 * Also emitted when a Response is interrupted, incomplete, or cancelled.
 */
export /*bundle*/ interface IResponseOutputItemDoneServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "response.output_item.done".
	type: 'response.output_item.done';

	// The ID of the response to which the item belongs.
	response_id: string;

	// The index of the output item in the response.
	output_index: number;

	// The completed item.
	item: IResponseItem & {
		// The final status of the item ("completed", "incomplete").
		status: 'completed' | 'incomplete';
	};
}
