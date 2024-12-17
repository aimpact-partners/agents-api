/**
 * Send this event when you want to remove any item from the conversation history.
 */
export /*bundle*/ interface IConversationItemDeleteClientEvent {
	// Optional client-generated ID used to identify this event.
	event_id: string;

	// The event type, must be "conversation.item.delete".
	type: 'conversation.item.delete';

	// The ID of the assistant message item to truncate.
	item_id: string;
}
