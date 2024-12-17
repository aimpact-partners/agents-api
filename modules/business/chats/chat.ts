import type { IChatData, IUserBase, ILastIterationsData, IChatDataSpecs } from '@aimpact/agents-api/data/interfaces';
import type { IMessageSpecs } from './message';
import type { firestore } from 'firebase-admin';
import type { Transaction } from 'firebase-admin/firestore';
import { v4 as uuid } from 'uuid';
import { db } from '@beyond-js/firestore-collection/db';
import { Message } from './message';
import { Timestamp } from '@aimpact/agents-api/utils/timestamp';
import { BatchDeleter } from './firestore/delete';
import { FirestoreService } from './firestore/service';
import { User } from '@aimpact/agents-api/business/user';
import { chats, projects } from '@aimpact/agents-api/data/model';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';

export /*bundle*/ class Chat {
	private collection: firestore.CollectionReference;
	private table = 'Chats';
	firestoreService: FirestoreService;
	#deleter;

	constructor() {
		this.collection = db.collection(this.table);
		this.#deleter = new BatchDeleter(this.collection);
		this.firestoreService = new FirestoreService(this.table);
	}

	static async get(id: string, uid?: string, showMessages: boolean = false): Promise<BusinessResponse<IChatData>> {
		if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

		try {
			const response = await chats.data({ id });
			if (response.error) return new BusinessResponse({ error: response.error });
			if (!response.data.exists) return new BusinessResponse({ error: response.data.error });

			const { data } = response.data;
			if (!showMessages) return new BusinessResponse({ data });

			const collection = await chats.doc({ id }).collection('messages').orderBy('timestamp').get();
			const messages = collection.docs.map(doc => {
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

			return new BusinessResponse({ data: Object.assign({}, data, { messages }) });
		} catch (exc) {
			console.error(exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async save(data: IChatDataSpecs) {
		try {
			const id = data.id ?? uuid();

			const response = await chats.data({ id });
			if (response.error) return new BusinessResponse({ error: response.error });

			const specs = <IChatData>{ id: id };
			data.name && (specs.name = data.name);
			data.parent && (specs.parent = data.parent);
			data.children && (specs.children = data.children);
			data.language && (specs.language = data.language);

			specs.metadata = data.metadata ? data.metadata : {};

			if (!response.data.exists) {
				// if the parent is not received, we set it to root by default
				!data.parent && (specs.parent = '0');
			}

			if (data.projectId) {
				const response = await projects.data({ id: data.projectId });
				if (response.error) return new BusinessResponse({ error: response.error });
				if (!response.data.exists) return new BusinessResponse({ error: response.data.error });

				const project = response.data.data;
				specs.project = {
					id: project.id,
					name: project.name,
					identifier: project.identifier,
					agent: project.agent
				};
			}

			if (data.uid) {
				const model = new User(data.uid);
				await model.load();
				specs.user = model.toJSON();
			}

			await chats.merge({ id, data: specs });
			const chatResponse = await chats.data({ id });
			if (chatResponse.error) return new BusinessResponse({ error: response.error });

			return new BusinessResponse({ data: chatResponse.data.data });
		} catch (exc) {
			console.error(exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	/**
	 *
	 * @param id
	 * @param message
	 * @returns
	 */
	static async saveMessage(ChatId: string, params: IMessageSpecs, user: IUserBase) {
		return Message.publish(ChatId, params, user);
	}

	/**
	 * saves the chat summary according to the last interaction made
	 * assuming an interaction is the message/response pair
	 * taking message(role:user)/response(role:system)
	 * @param id
	 * @param synthesis
	 */
	static async saveSynthesis(id: string, synthesis: string) {
		return await db.runTransaction(async (transaction: Transaction) => {
			try {
				const response = await chats.data({ id, transaction });
				if (response.error) return new BusinessResponse({ error: response.error });
				if (!response.data.exists) return new BusinessResponse({ error: response.data.error });

				const { error } = await chats.merge({ id, data: { synthesis }, transaction });
				if (error) return new BusinessResponse({ error });

				return new BusinessResponse({ data: synthesis });
			} catch (exc) {
				return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
			}
		});
	}

	/**
	 * sets the last interaction made in the Chat
	 * assuming an interaction is the message/response pair
	 * taking message(role:user)/response(role:system)
	 * @param id
	 * @param limit
	 */
	static async setLastInteractions(id: string, limit: number = 2) {
		if (!id) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });

		return await db.runTransaction(async (transaction: Transaction) => {
			try {
				const chat = await chats.data({ id, transaction });
				if (chat.error) return new BusinessResponse({ error: chat.error });
				if (!chat.data.exists) return new BusinessResponse({ error: chat.data.error });

				const collection = await chats
					.doc({ id })
					.collection('messages')
					.orderBy('timestamp', 'desc')
					.limit(limit)
					.get();

				const messages = collection.docs.map(doc => doc.data());
				const lastTwo = messages.map(message => {
					const { role, content, answer, synthesis, metadata } = message;
					const data: ILastIterationsData = {
						role,
						content: role === 'assistant' ? answer : content
					};

					synthesis && (data.synthesis = synthesis);
					metadata && (data.metadata = metadata);

					return data;
				});

				const count = chat.data.data?.messages?.count ?? 0;
				const data = { messages: { count, lastTwo } };

				const response = await chats.merge({ id, data, transaction });
				if (response.error) return new BusinessResponse({ error: response.error });

				return new BusinessResponse({ data });
			} catch (exc) {
				return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
			}
		});
	}

	/**
	 * Functions migradas del objeto Chat inicial
	 * @TODO validar funcionamiento
	 */
	async saveAll(items: IChatData[]) {
		if (!items.length) throw new Error('items are required');

		const batch = db.batch();
		const collection = this.collection;
		const persisted = [];
		items.forEach(item => {
			const id = item.id ?? uuid();
			const persistedItem = { ...item, id };
			batch.set(collection.doc(id), persistedItem);
			persisted.push(persistedItem);
		});

		await batch.commit();

		return persisted;
	}

	async delete(id: string) {
		try {
			if (!id) return { status: false, error: 'id is required' };

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

	validate(item) {
		return true;
	}
}
