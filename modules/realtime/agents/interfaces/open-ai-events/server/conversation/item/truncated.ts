/**
 * Returned when an earlier assistant audio message item is truncated by the client.
 */
export /*bundle*/ interface IConversationItemTruncatedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "conversation.item.truncated".
	type: 'conversation.item.truncated';

	// The ID of the assistant message item that was truncated.
	item_id: string;

	// The index of the content part that was truncated.
	content_index: 0;

	// The duration up to which the audio was truncated, in milliseconds.
	audio_end_ms: 1500;
}
