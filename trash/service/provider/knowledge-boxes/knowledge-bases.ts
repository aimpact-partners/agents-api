import type { Server } from 'socket.io';
import { db } from '@beyond-js/firestore-collection/db';

interface KnowledgeBases {
	id: string;
	userId: number;
	category: string;
}

export /*actions*/ /*bundle*/ class KnowledgeBasesProvider {
	socket: Server;
	private collection;
	private table = 'KnowledgeBases';

	constructor(socket: Server) {
		this.socket = socket;
		this.collection = db.collection(this.table);
	}

	async load(id: string) {
		try {
			if (!id) {
				return { status: false, error: 'id is required' };
			}
			const response = await this.collection.doc(id).get();
			return { status: true, data: response.data() as KnowledgeBases };
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

	async list() {
		try {
			const entries = [];
			const items = await this.collection.get();
			items.forEach(item => entries.push(item.data()));
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
