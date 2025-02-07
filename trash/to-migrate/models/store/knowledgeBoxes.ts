import type { Server } from 'socket.io';
import { db } from '@beyond-js/firestore-collection/db';

interface IKnowledgeBoxes {
	id: string;
	path: string;
	userId: string;
	prompt: string;
	documents: [];
}

export /*bundle*/ class KnowledgeBoxesStore {
	socket: Server;
	private collection;
	private table = 'KnowledgeBoxes';

	constructor(socket: Server) {
		this.socket = socket;
		this.collection = db.collection(this.table);
	}

	async load({ id }: { id: string }) {
		try {
			if (!id) {
				return { status: false, error: 'id is required' };
			}
			const response = await this.collection.doc(id).get();
			return { status: true, data: response.data() as IKnowledgeBoxes };
		} catch (e) {
			return { status: false, error: e.message };
		}
	}
}
