/**
 * Returned when the model-generated audio is updated.
 */
export /*bundle*/ interface IResponseAudioDeltaServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "response.audio.delta".
	type: 'response.audio.delta';

	// The ID of the response.
	response_id: string;

	// The ID of the item to which the content part was added.
	item_id: string;

	// The index of the output item in the response.
	output_index: number;

	// The index of the content part in the item's content array.
	content_index: number;

	// Base64-encoded audio data delta.
	delta: string;
}
