/**
 * Returned when an item in the conversation is deleted.
 */
export /*bundle*/ interface IConversationItemDeletedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "conversation.item.deleted".
	type: 'conversation.item.deleted';

	// The ID of the item that was deleted.
	item_id: string;
}
