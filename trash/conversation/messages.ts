import { db } from '@beyond-js/firestore-collection/db';

export class Messages {
	static async getByLimit(conversationId: string, limit: number) {
		try {
			const conversationDoc = await db.collection('Conversations').doc(conversationId).get();
			const messagesSnapshot = await conversationDoc.ref
				.collection('messages')
				.orderBy('timestamp', 'desc')
				.limit(limit)
				.get();

			const messages = messagesSnapshot.docs.map(doc => doc.data());
			messages.sort((a, b) => a.timestamp - b.timestamp);
			return messages;
		} catch (e) {
			console.error(e);
			throw new Error(e);
		}
	}
}
