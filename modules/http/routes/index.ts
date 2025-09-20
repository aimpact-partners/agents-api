import type { Application, Response as IResponse, Request } from 'express';
import { join } from 'path';
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
import { UsersRoutes } from './users';

export /*bundle*/ function setup(app: Application) {
	try {
		app.get('/', (req: Request, res: IResponse) => {
			res.send('AImpact Agents http server');
		});

		ArticlesRoutes.setup(app);
		DraftsRoutes.setup(app);
		SectionsRoutes.setup(app);
		AudiosRoutes.setup(app);
		ChatsRoutes.setup(app);
		KBRoutes.setup(app);
		CompletionsRoutes.setup(app);
		ProjectsRoutes.setup(app);
		PromptsRoutes.setup(app);
		SchemasRoutes.setup(app);
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
