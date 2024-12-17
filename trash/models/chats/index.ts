import { db } from '@aimpact/chat-api/firestore';
import { BatchDeleter } from './firestore/delete';
import { FirestoreService } from './firestore/service';
import { v4 as uuidv4 } from 'uuid';
import type { firestore } from 'firebase-admin';

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

export /*bundle*/ class Chats {
	private collection: firestore.CollectionReference;
	private table = 'Conversations';
	firestoreService: FirestoreService;
	#deleter;

	constructor() {
		this.collection = db.collection(this.table);
		this.#deleter = new BatchDeleter(this.collection);
		this.firestoreService = new FirestoreService(this.table);
	}

	async get(id: string) {
		try {
			const chatRef = await this.collection.doc(id);
			const doc = await chatRef.get();

			// Chat not exists
			if (!doc.exists) return false;

			const messagesSnapshot = await chatRef.collection('messages').orderBy('timestamp').get();
			const messages = messagesSnapshot.docs.map(doc => doc.data());

			return { ...doc.data(), messages };
		} catch (e) {
			return { status: false, error: e.message };
		}
	}

	async list(specs) {
		try {
			const entries = [];

			if (!specs.userId) {
				throw new Error('userId is required');
			}

			let query = this.collection;

			let limit = specs.limit ? specs.limit : 30;

			delete specs.limit;

			// TODO @ftovar8 @jircdev pendiente agregar condicion por cada parametro de filtro
			for (let [k, v] of Object.entries(specs)) {
				query = query.where(k, '==', v);
			}
			query = query.limit(limit);

			const items = await query.get();
			items.forEach(item => entries.push(item.data()));

			return entries;
		} catch (e) {
			throw Error(e.message);
		}
	}

	async save(data: IChat) {
		try {
			// if the parent is not received, we set it to root by default
			data.parent === undefined && (data.parent = '0');
			const id = data.id ?? uuidv4();

			const snapshot = this.collection.doc(id);

			await snapshot.set({ ...data, id }, { merge: true });

			const item = await this.collection.doc(id).get();

			return item.data() as IChat;
		} catch (e) {
			console.error(e);
			throw new Error('Error saving item');
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

			return true;
		} catch (e) {
			console.error(e);
			throw new Error('Error saving item');
		}
	}

	async deleteAll(field, values) {
		try {
			return this.#deleter.deleteAll(field, values);
		} catch (e) {
			console.error(e);
		}
	}

	async saveAll(items: IChat[]) {
		if (!items.length) {
			throw new Error('items are required');
		}

		const batch = db.batch();
		const collection = this.collection;
		const persisted = [];
		items.forEach(item => {
			const id = item.id ?? uuidv4();
			const persistedItem = { ...item, id };
			batch.set(collection.doc(id), persistedItem);
			persisted.push(persistedItem);
		});

		await batch.commit();

		return persisted;
	}

	validate(item) {
		return true;
	}
}
