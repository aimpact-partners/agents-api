import type { IServerError } from '../../../error';

/**
 * Returned when input audio transcription is configured, and a transcription request for a user message failed.
 */
export /*bundle*/ interface IConversationInputAudioTranscriptionFailedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "conversation.item.input_audio_transcription.failed".
	type: 'conversation.item.input_audio_transcription.failed';

	// The ID of the user message item.
	item_id: string;

	// The index of the content part containing the audio.
	content_index: number;

	error: IServerError;
}
