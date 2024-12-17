import type { Server } from 'socket.io';
import { db } from '@beyond-js/firestore-collection/db';
// TODO [1] @ftovar integrar la llamada aqui para obtener los files de un KnowledgeBox
// esa llamada debe ir en la libreria de coumentos y debe poder recibir los parametros
// user y project
// import { Documents } from '@aimpact/ailearn-estrada/models/documents';

interface KnowledgeBox {
	id: string;
	path: string;
}

export /*actions*/ /*bundle*/ class KnowledgeBoxProvider {
	socket: Server;
	private collection;
	private table = 'KnowledgeBoxes';
	#documents;

	constructor(socket: Server) {
		this.socket = socket;
		this.socket = socket;
		this.collection = db.collection(this.table);
		// this.#documents = new Documents();
	}

	/**
	 * @todo validate if it's necessary to filter by user
	 * @param param
	 * @returns
	 */
	async load({ id }: { id: string; userId: string }) {
		try {
			if (!id) {
				return { status: false, error: 'id is required' };
			}

			const response = await this.collection.doc(id).get();

			return { status: true, data: response.data() as KnowledgeBox };
		} catch (e) {
			return { status: false, error: e.message };
		}
	}

	async publish(data) {
		try {
			const item = await this.collection.add(data);
			const response = await this.load(item.id);
			return response;
		} catch (e) {
			console.error(e);
			return { status: false, error: e.message };
		}
	}

	async list({ userId }) {
		if (!userId) return { statue: false, error: 'userId is required' };

		try {
			const entries = [];
			const items = await this.collection.where('userId', '==', userId).get();

			// Create an array of promises to fetch each subcollection
			const fetchPromises = items.docs.map(async item => {
				const itemData = item.data();

				// Start the fetch of the subcollection
				const documentsCollectionPromise = item.ref.collection('documents').get();

				// When the fetch is done, map the documents, add them to the item data, and push it to entries
				return documentsCollectionPromise.then(documentsCollection => {
					const documents = documentsCollection.docs.map(doc => doc.data());
					const itemWithDocuments = { ...itemData, documents };
					entries.push(itemWithDocuments);
				});
			});

			// Wait for all the fetches to complete
			await Promise.all(fetchPromises);

			return { status: true, data: { entries } };
		} catch (e) {
			return { status: false, error: e.message };
		}
	}

	async bulkSave(data) {
		try {
			const entries = [];
			const promises = [];
			data.forEach(item => promises.push(this.collection.add(item)));
			await Promise.all(promises).then(i => i.map((chat, j) => entries.push({ id: chat.id, ...data[j] })));

			return { status: true, data: { entries } };
		} catch (e) {
			return { status: false, error: e.message };
		}
	}
}
