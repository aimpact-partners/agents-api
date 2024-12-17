/**
 * Returned when a conversation is created. Emitted right after session creation.
 */
export /*bundle*/ interface IConversationCreatedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "conversation.created".
	type: 'conversation.created';

	// The conversation resource.
	conversation: {
		// The unique ID of the conversation.
		id: string;

		// The object type, must be "realtime.conversation".
		object: 'realtime.conversation';
	};
}
