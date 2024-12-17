import { db } from '@beyond-js/firestore-collection/db';
import { BatchDeleter } from './firestore/delete';
import { FirestoreService } from './firestore/service';

interface IChat {
	id: string;
	name: string;
	usage: string;
	userId: string;
	parent: string;
	children: string;
	category: string;
	knowledgeBoxId: string;
}

class ChatAPI {
	private collection;
	private table = 'Conversations';
	firestoreService: FirestoreService;

	constructor() {
		this.collection = db.collection(this.table);
		this.firestoreService = new FirestoreService(this.table);
	}

	async get(id: string) {
		try {
			if (!id) {
				return { status: false, error: 'id is required' };
			}

			const chatRef = await this.collection.doc(id);
			const doc = await chatRef.get();

			// Chat not exists
			if (!doc.exists) return { status: true };

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

	async save(data: IChat) {
		try {
			// if the parent is not received, we set it to root by default
			data.parent === undefined && (data.parent = '0');

			await this.collection.doc(data.id).set(data);
			const item = await this.collection.doc(data.id).get();

			return { status: true, data: item.data() as IChat };
		} catch (e) {
			console.error(e);
			return { status: false, error: e.message };
		}
	}

	async delete(id: string) {
		try {
			if (!id) {
				return { status: false, error: 'id is required' };
			}

			const docRef = this.firestoreService.getDocumentRef(id);
			const subcollectionRef = docRef.collection('messages');
			const batchDeleter = new BatchDeleter(subcollectionRef);

			await batchDeleter.deleteAll();
			await docRef.delete();

			return { status: true, data: { id } };
		} catch (e) {
			return { status: false, error: e.message };
		}
	}
}

export /*bundle*/ const chatAPI = new ChatAPI();
