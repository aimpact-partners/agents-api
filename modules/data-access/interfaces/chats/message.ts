import type { firestore } from 'firebase-admin';

export /*bundle*/ type RoleType = 'system' | 'user' | 'assistant' | 'function';

export /*bundle*/ interface IMessageBase {
	id: string;
	role: RoleType;
	content: string;
	timestamp: number | firestore.FieldValue;
}

export /*bundle*/ interface IMessageData extends IMessageBase {
	chatId: string;
	chat: { id: string };
	synthesis?: string;
}
