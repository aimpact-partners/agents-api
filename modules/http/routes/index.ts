import type { Application, Response as IResponse, Request } from 'express';
import { join } from 'path';
import { AppointmentsRoutes } from './appointments';
import { ArticlesRoutes } from './articles';
import { AudiosRoutes } from './audios';
import { ChatsRoutes } from './chats';
import { CompletionsRoutes } from './completions';
import { DraftsRoutes } from './drafts';
import { KBRoutes } from './kb';
import { ProjectsRoutes } from './projects';
import { PromptsRoutes } from './prompts';
import { SchemasRoutes } from './schemas';
import { SectionsRoutes } from './sections';
import { TicketsRoutes } from './tickets';
import { UsersRoutes } from './users';

export /*bundle*/ function setup(app: Application) {
	try {
		app.get('/', (req: Request, res: IResponse) => {
			res.send('AImpact Agents http server');
		});

		AppointmentsRoutes.setup(app);
		ArticlesRoutes.setup(app);
		AudiosRoutes.setup(app);
		ChatsRoutes.setup(app);
		CompletionsRoutes.setup(app);
		DraftsRoutes.setup(app);
		KBRoutes.setup(app);
		ProjectsRoutes.setup(app);
		PromptsRoutes.setup(app);
		SchemasRoutes.setup(app);
		SectionsRoutes.setup(app);
		TicketsRoutes.setup(app);
		UsersRoutes.setup(app);
	} catch (exc) {
		console.error('setup', exc);
	}
}

export /*bundle*/ async function specs() {
	const { findUp } = await import('find-up');
	const root = await findUp('app', { cwd: __dirname, type: 'directory' });
	return join(root, 'openapi/merged.yaml');
}
