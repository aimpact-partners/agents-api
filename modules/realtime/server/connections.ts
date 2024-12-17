import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { RealtimeConversationConnection } from './connection';

export class RealtimeConversationConnections {
	create(ws: WebSocket, request: IncomingMessage) {
		const connection = new RealtimeConversationConnection(ws, request);
	}
}
