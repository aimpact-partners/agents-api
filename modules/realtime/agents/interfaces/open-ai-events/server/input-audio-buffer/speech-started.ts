/**
 * Returned in server turn detection mode when speech is detected.
 */
export /*bundle*/ interface IInputAudioBufferSpeechStartedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "input_audio_buffer.speech_started".
	type: 'input_audio_buffer.speech_started';

	// Milliseconds since the session started when speech was detected.
	audio_start_ms: number;

	// The ID of the user message item that will be created when speech stops.
	item_id: string;
}
