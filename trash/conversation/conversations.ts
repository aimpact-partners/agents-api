import { v4 as uuidv4 } from 'uuid';
import type { firestore } from 'firebase-admin';
import { db } from '@beyond-js/firestore-collection/db';
import type { IMessage } from './message';
import { Message } from './message';
import { Messages } from './messages';

export /*bundle*/ interface IConversation {
	id: string;
	name: string;
	metadata: {};
	parent: string;
	children: string;
	language: { default: string };
	user: { id: string; name: string };
	usage: { completionTokens: number; promptTokens: number; totalTokens: number };
	messages?: {};
}

export /*bundle*/ class Conversations {
	static async byUser(specs) {
		try {
			if (!specs.userId) {
				throw new Error('userId is required');
			}

			let query = db.collection('Conversations');
			query = query.where('userId', '==', specs.userId);

			const limit = specs.limit ? specs.limit : 30;

			query = query.limit(limit);
			const items = await query.get();
			const entries = items.map(item => item.data());

			return entries;
		} catch (e) {
			throw Error(e.message);
		}
	}
}
