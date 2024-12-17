/**
 * Send this event to clear the audio bytes in the buffer.
 */
export /*bundle*/ interface IInputAudioBufferClearClientEvent {
	// Optional client-generated ID used to identify this event.
	event_id: string;

	// The event type, must be "input_audio_buffer.clear"
	type: 'input_audio_buffer.clear';
}
