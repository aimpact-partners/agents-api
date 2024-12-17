/**
 * Returned when an input audio buffer is committed, either by the client or automatically in server VAD mode.
 */
export /*bundle*/ interface IInputAudioBufferCommitedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "input_audio_buffer.committed".
	type: 'input_audio_buffer.committed';

	// The ID of the preceding item after which the new item will be inserted.
	previous_item_id: string;

	// The ID of the user message item that will be created.
	item_id: string;
}
