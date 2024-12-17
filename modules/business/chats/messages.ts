import { db } from '@beyond-js/firestore-collection/db';
import { Timestamp } from '@aimpact/agents-api/utils/timestamp';

export class Messages {
	static async getByLimit(chatId: string, limit: number) {
		try {
			const chatDoc = await db.collection('Chats').doc(chatId).get();
			const messagesSnapshot = await chatDoc.ref
				.collection('messages')
				.orderBy('timestamp', 'desc')
				.limit(limit)
				.get();

			const messages = messagesSnapshot.docs.map(doc => {
				const data = doc.data();
				return {
					id: data.id,
					content: data.content,
					chatId: data.chatId,
					chat: data.chat,
					role: data.role,
					timestamp: Timestamp.format(data.timestamp)
				};
			});
			messages.sort((a, b) => a.timestamp - b.timestamp);
			return messages;
		} catch (e) {
			console.error(e);
			throw new Error(e);
		}
	}
}
