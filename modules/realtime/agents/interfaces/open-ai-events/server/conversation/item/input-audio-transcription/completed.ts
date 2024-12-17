/**
 * Returned when input audio transcription is enabled and a transcription succeeds.
 */
export /*bundle*/ interface IConversationInputAudioTranscriptionCompletedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "conversation.item.input_audio_transcription.completed".
	type: 'conversation.item.input_audio_transcription.completed';

	// The ID of the user message item.
	item_id: string;

	// The index of the content part containing the audio.
	content_index: number;

	// The transcribed text.
	transcript: string;
}
