import {db} from '../db';

interface Chat {
	id: string;
	userId: number;
	category: string;
}

interface LoadAllOptions {
	filter?: string;
	limit?: number;
}

console.log('update chatStore');
export /*bundle*/ class ChatStore {
	private collection;
	private table = 'chat';

	constructor() {
		this.collection = db.collection(this.table);
	}

	async loadChat(id: number): Promise<Chat> {
		const chat = await this.collection.doc(id).get();
		return chat.data() as Chat;
	}

	async storeChat(data: Chat): Promise<any> {
		const item = await this.collection.add(data);
		const chat = await this.loadChat(item.id);
		return chat;
	}

	// TODO @ftovar
	// agregar las clausulas de las opciones en la respuesta
	async loadAll(options?: LoadAllOptions): Promise<Chat[]> {
		const entries = await this.collection.get();
		const items = [];
		entries.forEach(entry => items.push(entry.data()));

		return items;
	}

	async bulkSave(chats: Chat[]) {
		const items = [];
		const promises = [];
		chats.forEach(chat => promises.push(this.collection.add(chat)));
		await Promise.all(promises).then(i => i.map((chat, i) => items.push({id: chat.id, ...chats[i]})));
		return items;
	}

	// TODO @ftovar
	async clear(): Promise<void> {
		console.log('not implemented');
		// await this.conn.connect();
		// const db = this.conn.connection;
		// const query = `DELETE FROM users`;
		// await db.run(query);
		// await this.conn.disconnect();
	}
}
