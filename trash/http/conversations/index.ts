import { UserMiddlewareHandler } from '@aimpact/chat-api/middleware';
import { Chat } from '@aimpact/chat-api/business/chats';
import type { Response, Application } from 'express';
import type { IChat } from '@aimpact/chat-api/business/chats';
import type { IAuthenticatedRequest } from '@aimpact/chat-api/middleware';
import { ChatMessagesRoutes } from './messages';

export class ConversationsRoutes {
	static setup(app: Application) {
		app.use((err, req, res, next) => {
			res.status(err.status || 500).json({
				message: err.message,
				errors: err.errors
			});
		});

		ChatMessagesRoutes.setup(app);

		app.get('/conversations/:id', UserMiddlewareHandler.validate, ConversationsRoutes.get);
		app.post('/conversations', UserMiddlewareHandler.validate, ConversationsRoutes.publish);
	}

	static async get(req: IAuthenticatedRequest, res: Response) {
		try {
			const { id } = req.params;
			const { uid } = req.user;

			// true for get messages
			const data = await Chat.get(id, uid, true);
			return res.json({ status: true, data });
		} catch (e) {
			console.error(e);
			res.json({ status: false, error: e.message });
		}
	}

	static async publish(req: IAuthenticatedRequest, res: Response) {
		try {
			const params: IChat = req.body;
			const data = await Chat.save(params);

			res.json({ status: true, data });
		} catch (e) {
			console.error(e);
			res.json({ status: false, error: e.message });
		}
	}
}
