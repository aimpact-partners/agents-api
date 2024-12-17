import type { IResponseItem } from '@aimpact/agents-api/realtime/interfaces/item';

/**
 * Returned when a new Item is created during response generation.
 */
export /*bundle*/ interface IResponseOutputItemAddedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "response.output_item.added".
	type: 'response.output_item.added';

	// The ID of the response to which the item belongs.
	response_id: string;

	// The index of the output item in the response.
	output_index: number;

	// The item that was added.
	item: IResponseItem & {
		// The status of the item ("in_progress", "completed").
		status: 'in_progress' | 'completed';
	};
}
