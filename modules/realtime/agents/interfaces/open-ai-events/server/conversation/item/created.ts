import type { IItem } from '@aimpact/agents-api/realtime/interfaces/item';

/**
 * Returned when a conversation item is created.
 */
export /*bundle*/ interface IConversationItemCreatedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "conversation.item.created".
	type: 'conversation.item.created';

	// The ID of the preceding item.
	previous_item_id: string;

	// The item that was created.
	item: IItem & {
		// The unique ID of the item.
		id: string;

		// The object type, must be "realtime.item".
		object: 'realtime.item';
	};
}
