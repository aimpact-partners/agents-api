/**
 * Send this event when you want to truncate a previous assistant message’s audio.
 */
export /*bundle*/ interface IConversationItemTruncateClientEvent {
	// Optional client-generated ID used to identify this event.
	event_id: string;

	// The event type, must be "conversation.item.truncate".
	type: 'conversation.item.truncate';

	// The ID of the assistant message item to truncate.
	item_id: string;

	// The index of the content part to truncate.
	content_index: number;

	// Inclusive duration up to which audio is truncated, in milliseconds.
	audio_end_ms: number;
}
