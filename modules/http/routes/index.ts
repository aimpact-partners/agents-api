import type { Application, Response as IResponse, Request } from 'express';
import { join } from 'path';
import { AudiosRoutes } from './audios';
import { ChatsRoutes } from './chats';
import { ProjectsRoutes } from './projects';
import { PromptsRoutes } from './prompts';
import { UsersRoutes } from './users';

export /*bundle*/ function setup(app: Application) {
	try {
		app.get('/', (req: Request, res: IResponse) => {
			res.send('AImpact Agents http server');
		});

		AudiosRoutes.setup(app);
		ChatsRoutes.setup(app);
		ProjectsRoutes.setup(app);
		PromptsRoutes.setup(app);
		UsersRoutes.setup(app);
	} catch (exc) {
		console.error('setup', exc);
	}
}

export /*bundle*/ async function specs() {
	const { findUp } = await import('find-up');
	const root = await findUp('api', { cwd: __dirname, type: 'directory' });
	return join(root, 'openapi/merged.yaml');
}
