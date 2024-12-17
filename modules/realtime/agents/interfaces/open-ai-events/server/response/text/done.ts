/**
 * Returned when the text value of a "text" content part is done streaming.
 * Also emitted when a Response is interrupted, incomplete, or cancelled.
 */
export /*bundle*/ interface IResponseTextDoneServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "response.text.done".
	type: 'response.text.done';

	// The ID of the response.
	response_id: string;

	// The ID of the item to which the content part was added.
	item_id: string;

	// The index of the output item in the response.
	output_index: number;

	// The index of the content part in the item's content array.
	content_index: number;

	// The final text content.
	text: string;
}
