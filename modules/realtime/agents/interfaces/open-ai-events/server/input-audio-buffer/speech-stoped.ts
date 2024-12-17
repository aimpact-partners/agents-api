/**
 * Returned in server turn detection mode when speech stops.
 */
export /*bundle*/ interface IInputAudioBufferSpeechStoppedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "input_audio_buffer.speech_stopped".
	type: 'input_audio_buffer.speech_stopped';

	// Milliseconds since the session started when speech stopped.
	audio_end_ms: number;

	// The ID of the user message item that will be created.
	item_id: string;
}
