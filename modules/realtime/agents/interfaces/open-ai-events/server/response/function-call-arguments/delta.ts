/**
 * Returned when the model-generated function call arguments are updated.
 */
export /*bundle*/ interface IResponseFunctionCallArgumentsDeltaServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "response.function_call_arguments.delta".
	type: 'response.function_call_arguments.delta';

	// The ID of the response.
	response_id: string;

	// The ID of the item to which the content part was added.
	item_id: string;

	// The index of the output item in the response.
	output_index: number;

	// The ID of the function call.
	call_id: number;

	// The arguments delta as a JSON string.
	delta: string;
}
