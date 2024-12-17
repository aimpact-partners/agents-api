import type { IItem } from '@aimpact/agents-api/realtime/interfaces/item';

/**
 * Send this event when adding an item to the conversation.
 */
export /*bundle*/ interface IConversationItemCreateClientEvent<IItemType extends IItem> {
	// Optional client-generated ID used to identify this event.
	event_id?: string;

	// The event type, must be "conversation.item.create".
	type: 'conversation.item.create';

	// The ID of the preceding item after which the new item will be inserted.
	previous_item_id?: string;

	// The item to add to the conversation.
	item: IItemType;
}
