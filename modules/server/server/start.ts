import { Server as ServerBase } from '@aimpact/agents-api/beyond-js/backend';
import { RealtimeAgentsServer } from '@aimpact/agents-api/realtime/server';

import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8080;

class Server extends ServerBase {
	#realtime: RealtimeAgentsServer;

	/**
	 * The following mehods can now be overriden:
	 * _setErrorHandler
	 * _setHeader
	 */

	/**
	 * Once the server is initialised
	 */
	_begin() {
		// Attach the realtime agents server to the HTTP API server
		this.#realtime = new RealtimeAgentsServer(this.server);
	}

	constructor() {
		super(PORT);
	}
}

// Start the HTTP + socket.io realtime server
const server = new Server();
server.start('@aimpact/agents-api/http/routes');
