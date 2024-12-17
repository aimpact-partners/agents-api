import type { IUserBase } from '@aimpact/agents-api/data/interfaces';
import type { Transaction } from 'firebase-admin/firestore';
import { chats } from '@aimpact/agents-api/data/model';
import { v4 as uuid } from 'uuid';
import { db } from '@beyond-js/firestore-collection/db';
import { Timestamp } from '@aimpact/agents-api/utils/timestamp';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';

const MESSAGE_ROLE = ['system', 'user', 'assistant', 'function'];

export interface IMessageSpecs {
	id: string;
	role: 'system' | 'user' | 'assistant' | 'function';
	content: string;
	answer?: string;
	synthesis?: string;
	timestamp?: number;
	metadata?: any;
}

export class Message {
	static async publish(chatId: string, params: IMessageSpecs, user: IUserBase) {
		try {
			if (!chatId) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['chatId']) });
			if (!params.content) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['content']) });
			if (!params.role) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['role']) });
			if (!MESSAGE_ROLE.includes(params.role)) {
				return new BusinessResponse({ error: ErrorGenerator.roleNotSupported(params.role) });
			}

			const { id, error } = await db.runTransaction(async (transaction: Transaction) => {
				const { data, error } = await chats.data({ id: chatId, transaction });
				if (error) return { error };
				if (!data.exists) return { error: data.error };
				const chat = data.data;

				if (user.id !== chat.user.uid) return { error: ErrorGenerator.unauthorizedUserForChat() };

				const id = params.id ? params.id : uuid();
				delete params.id;

				const timestamp = Timestamp.set();
				const specs = { ...params, id, chatId, chat: { id: chatId }, timestamp };

				const parents = { Chats: chatId };
				const messages = await chats.messages.set({ data: specs, parents, transaction });
				if (messages.error) return { error: messages.error };

				const count = (chat.messages?.count || 0) + 1;
				const userCount = params.role == 'user' ? (chat.messages?.user || 0) + 1 : chat.messages?.user;

				const merge = await chats.merge({
					id: chatId,
					data: { messages: { count, user: userCount } },
					transaction
				});
				if (merge.error) return { error: merge.error };

				return { id };
			});
			if (error) return new BusinessResponse({ error });

			const parents = { Chats: chatId };
			const messages = await chats.messages.data({ id, parents });
			if (messages.error) return new BusinessResponse({ error: messages.error });

			const { data } = messages.data;
			data.timestamp && (data.timestamp = Timestamp.format(data.timestamp));

			return new BusinessResponse({ data });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}
}
