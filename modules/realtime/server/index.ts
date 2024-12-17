import type { Express } from 'express';
import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { RealtimeConversationConnections } from './connections';
import { WebSocketServer } from 'ws';
import * as http from 'http';

export /*bundle*/ class RealtimeAgentsServer {
	#connections = new RealtimeConversationConnections();

	constructor(server: http.Server) {
		const wss = new WebSocketServer({ server });

		// Handle WebSocket connections
		wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
			this.#connections.create(ws, request);
		});
	}
}
