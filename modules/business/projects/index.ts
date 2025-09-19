import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { Group } from '@aimpact/agents-api/business/group';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import type { IProjectData } from '@aimpact/agents-api/data/interfaces';
import { projects } from '@aimpact/agents-api/data/model';
import type { CollectionResponseType } from '@beyond-js/firestore-collection/collection';
import { db } from '@beyond-js/firestore-collection/db';
import { FirestoreErrorManager } from '@beyond-js/firestore-collection/errors';
import { Response } from '@beyond-js/response/main';
import { v4 as uuid } from 'uuid';

export /*bundle*/ class Projects extends Group {
	static async data(id?: string): Promise<CollectionResponseType<IProjectData>> {
		return await projects.data({ id });
	}

	static async save(params: IProjectData) {
		if (!params.name) {
			return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['name']) });
		}

		try {
			const id = params.id ?? uuid();
			const { name } = params;
			const description = params.description ?? '';
			const agent = params.agent ?? { url: '' };

			const project = await Projects.data(id);
			if (project.error) return project;
			if (project.data.exists) return Projects.update(params);

			const identifier = name.toLowerCase().replace(/\s+/g, '-');
			const data = { id, name, identifier, description, agent };

			const response = await projects.set({ data });
			if (response.error) return new FirestoreErrorManager(response.error.code, response.error.text);

			return Projects.data(id);
		} catch (exc) {
			const error = ErrorGenerator.internalError(exc);
			return new Response({ error });
		}
	}

	static async update(params) {
		try {
			const { id, name, description, agent } = params;

			const dataResponse = await Projects.data(id);

			if (dataResponse.error) return dataResponse;
			if (!dataResponse.data.exists) return dataResponse;

			const data: { name?: string; description?: string; agent?: Record<string, any> } = {};
			name && (data.name = name);
			description && (data.description = description);
			agent && (data.agent = agent);

			const response = await projects.merge({ id, data });
			if (response.error) return new BusinessResponse({ error: response.error });

			return Projects.data(id);
		} catch (exc) {
			const error = ErrorGenerator.internalError(exc);
			return new Response({ error });
		}
	}

	static async list() {
		try {
			const projectsRef = db.collection('Projects');
			const snapshot = await projectsRef.get();

			const items = [];
			snapshot.forEach(doc => {
				const item = doc.data();
				delete item.apiKey;
				items.push(item);
			});

			return { data: { items } };
		} catch (exc) {
			const error = ErrorGenerator.internalError(exc);
			return new Response({ error });
		}
	}

	static async delete(id) {}
}
