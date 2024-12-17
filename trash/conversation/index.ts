import { v4 as uuidv4 } from 'uuid';
import { db } from '@beyond-js/firestore-collection/db';
import type { IMessage } from './message';
import { Message } from './message';
import { Messages } from './messages';
import { Timestamp } from '@aimpact/chat-api/utils/timestamp';

export /*bundle*/ interface IConversation {
	id: string;
	name: string;
	metadata: {};
	parent: string;
	children: string;
	language: { default: string };
	user: { id: string; name: string };
	usage: { completionTokens: number; promptTokens: number; totalTokens: number };
	messages?: IMessage[];
}

export /*bundle*/ class Conversation {
	static async get(id: string, uid: string, messages: boolean = false) {
		if (!id) {
			throw new Error('id is required');
		}

		const conversationDoc = await db.collection('Conversations').doc(id);
		const doc = await conversationDoc.get();
		if (!doc.exists) {
			return { error: 'Conversation not exists' };
		}

		const conversationData: IConversation = doc.data();

		// if (conversationData.user.id !== uid) {
		// 	return { error: 'The user does not have access permissions on this conversation' };
		// }

		if (messages) {
			const messagesSnapshot = await conversationDoc.collection('messages').orderBy('timestamp').get();
			conversationData.messages = messagesSnapshot.docs.map(doc => {
				const data = doc.data();
				data.timestamp = Timestamp.format(data.timestamp);
				return data;
			});
			conversationData.messages.sort((a, b) => a.timestamp - b.timestamp);
		}

		return conversationData;
	}

	static async publish(data: IConversation) {
		try {
			const id = data.id ?? uuidv4();
			const collection = db.collection('Conversations');
			const conversationDoc = await collection.doc(id).get();
			if (!conversationDoc.exists) {
				// if the parent is not received, we set it to root by default
				data.parent === undefined && (data.parent = '0');
			}

			await collection.doc(id).set({ ...data, id }, { merge: true });

			return conversationDoc.data() as IConversation;
		} catch (e) {
			console.error(e);
			throw new Error('Error saving item');
		}
	}

	/**
	 *
	 * @param id
	 * @param message
	 * @returns
	 */
	static async saveMessage(conversationId: string, params: IMessage) {
		return Message.publish(conversationId, params);
	}

	/**
	 * sets the last interaction made in the conversation
	 * assuming an interaction is the message/response pair
	 * taking message(role:user)/response(role:system)
	 * @param id
	 * @param limit
	 */
	static async setLastInteractions(id: string, limit: number = 2) {
		if (!id) {
			throw new Error('id is required');
		}

		const collection = db.collection('Conversations');
		const conversationDoc = await collection.doc(id).get();
		if (!conversationDoc.exists) {
			throw new Error('conversationId not valid');
		}

		const messages = await Messages.getByLimit(id, limit);
		const lastTwo = messages.map(({ role, content, answer }) => ({
			role,
			content: role === 'assistant' ? answer : content
		}));

		await collection.doc(id).set({ messages: { lastTwo } }, { merge: true });
	}
}
