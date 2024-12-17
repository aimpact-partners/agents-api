/**
 * Send this event to append audio bytes to the input audio buffer.
 */
export /*bundle*/ interface IInputAudioBufferAppendClientEvent {
	// Optional client-generated ID used to identify this event.
	event_id: string;

	// The event type, must be "input_audio_buffer.append"
	type: 'input_audio_buffer.append';

	// Base64-encoded audio bytes.
	audio: string;
}
