import { v4 as uuid } from 'uuid';
import { db } from '@beyond-js/firestore-collection/db';
import { Timestamp } from '@aimpact/chat-api/utils/timestamp';

export interface IMessage {
	id: string;
	role: 'system' | 'user' | 'assistant' | 'function';
	content: string;
	conversationId: string;
	timestamp: number;
}

const MESSAGE_ROLE = ['system', 'user', 'assistant', 'function'];

export class Message {
	static async publish(conversationId: string, params: IMessage) {
		try {
			if (!conversationId) {
				throw new Error('conversationId is required');
			}
			if (!params.content) {
				throw new Error('message content is required');
			}

			if (!params.role) {
				throw new Error('role is required');
			}
			if (!MESSAGE_ROLE.includes(params.role)) {
				throw new Error('role not supported');
			}

			const collection = db.collection('Conversations');
			const conversation = await collection.doc(conversationId);
			const conversationDoc = await conversation.get();
			if (!conversationDoc.exists) {
				throw new Error('Conversation not exists');
			}

			const id = params.id ? params.id : uuid();
			delete params.id;

			const timestamp = Timestamp.set(params.timestamp);
			const specs = { id, conversationId, ...params, timestamp };
			await conversation.collection('messages').doc(id).set(specs);

			const data = conversationDoc.data();
			const count = (data.messages?.count || 0) + 1;

			await conversation.update({ messages: { count } }, { merge: true });

			const dataCollection = conversation.collection('messages').doc(id);
			const dataDoc = await dataCollection.get();
			const dataMessage = dataDoc.data();
			dataMessage.timestamp && (dataMessage.timestamp = Timestamp.format(dataMessage.timestamp));

			return { status: true, data: dataMessage };
		} catch (e) {
			console.error(e);
			return { status: false, error: e.message };
		}
	}
}
