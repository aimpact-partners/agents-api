/**
 * Send this event to commit audio bytes to a user message.
 */
export /*bundle*/ interface IInputAudioBufferCommitClientEvent {
	// Optional client-generated ID used to identify this event.
	event_id: string;

	// The event type, must be "input_audio_buffer.commit"
	type: 'input_audio_buffer.commit';
}
