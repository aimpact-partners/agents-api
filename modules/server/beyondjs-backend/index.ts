import type { Express, NextFunction, Request, Response } from 'express';
import * as express from 'express';
import { middleware } from 'express-openapi-validator';
import * as http from 'http';
import * as socketio from 'socket.io';
import { Connections } from './connections';

declare const bimport: (module: string) => Promise<any>;

interface IHMR {
	on: (event: string, listener: () => any) => void;
	off: (event: string, listener: () => any) => void;
}

export /*bundle*/ class Server {
	#server: http.Server;
	get server() {
		return this.#server;
	}

	#app: Express;
	get app() {
		return this.#app;
	}

	#io: socketio.Server;
	get io() {
		return this.#io;
	}

	#connections: Connections;
	get connections() {
		return this.#connections;
	}

	#port: number | string;
	get port() {
		return this.#port;
	}

	#hmr: IHMR;
	#specs: string;
	#setup: (app: Express) => void;

	constructor(port: number | string) {
		this.#port = port;
	}

	_begin() {}

	start(module: string) {
		bimport(module)
			.then(
				({ setup, specs, hmr }: { setup: (app: Express) => void; specs: () => Promise<string>; hmr: IHMR }) => {
					this.#setup = setup;
					this.#hmr = hmr;

					return specs();
				}
			)
			.then(specs => {
				this.#specs = specs;
				this._setup();
			})
			.catch((exc: Error) => console.error(`Error importing module "${module}": ${exc.message}`));
	}

	_setup() {
		try {
			this.#app = express();
			const server = http.createServer(this.#app);
			this.#io = new socketio.Server(server);
			this.#app.use(express.json());
			this._setHeader();

			// Call static method `setup`, to set up the HTTP endpoint routes
			this.#setup(this.#app);

			// Setup middleware for OpenAPI specs validation
			this.#specs && this.#app.use(middleware({ apiSpec: this.#specs }));

			// Setup custom error handler
			this._setErrorHandler(this.#app);

			//subscription to listen routes module changes.
			this.#hmr.on('change', this.onChange);

			this.#server = server.listen(this.#port, () => {
				console.log(`HTTP API Server port: "${this.#port}"`);
			});

			this.#connections = new Connections(this.#server);

			this._begin();
		} catch (exc) {
			console.error('Error', exc);
		}
	}

	_setErrorHandler(app: Express) {
		app.use((error: any, req: Request, res: Response, next: NextFunction) => {
			if (!error) return next();
			res.status(error.status || 500).json({ message: error.message, errors: error.errors });
		});
	}

	_setHeader() {
		this.#app.use((req: Request, res: Response, next: NextFunction) => {
			res.header('Access-Control-Allow-Origin', '*');
			res.header(
				'Access-Control-Allow-Headers',
				'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method'
			);
			res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
			res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

			if (req.method === 'OPTIONS') {
				res.status(200).end();
				return;
			}

			return next();
		});
	}

	onChange = () => {
		this.#connections.destroy();
		this.#server.close(() => {
			this.#hmr.off('change', this.onChange);
			this._setup();
		});
	};
}
