/**
 * Returned when the input audio buffer is cleared by the client.
 */
export /*bundle*/ interface IInputAudioBufferClearedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "input_audio_buffer.cleared".
	type: 'input_audio_buffer.cleared';
}
