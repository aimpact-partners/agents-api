import type { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import * as admin from 'firebase-admin';
import { db } from '@beyond-js/firestore-collection/db';

interface IChat {
	id: string;
	userId: string;
	category: string;
	knowledgeBoxId: string;
}

export /*bundle*/ class ChatStore {
	socket: Server;
	private collection;
	private table = 'Conversations';

	constructor(socket: Server) {
		this.socket = socket;
		this.collection = db.collection(this.table);
	}

	async load({ id }: { id: string }) {
		try {
			if (!id) {
				return { status: false, error: 'id is required' };
			}

			const chatRef = await this.collection.doc(id);
			const doc = await chatRef.get();
			const messagesSnapshot = await chatRef.collection('messages').orderBy('timestamp').get();
			const messages = messagesSnapshot.docs.map(doc => doc.data());

			return {
				status: true,
				data: { ...doc.data(), messages }
			};
		} catch (e) {
			return { status: false, error: e.message };
		}
	}
}
