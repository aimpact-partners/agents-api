import type { IPart } from './part';

/**
 * Returned when a content part is done streaming in an assistant message item.
 * Also emitted when a Response is interrupted, incomplete, or cancelled.
 */
export /*bundle*/ interface IResponseContentPartDoneServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "response.content_part.done".
	type: 'response.content_part.done';

	// The ID of the response.
	response_id: string;

	// The ID of the item.
	item_id: string;

	// The index of the output item in the response.
	output_index: number;

	// The index of the content part in the item's content array.
	content_index: number;

	// The content part that is done.
	part: IPart;
}
