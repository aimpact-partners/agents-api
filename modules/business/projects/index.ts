import type { CollectionResponseType } from '@beyond-js/firestore-collection/collection';
import type { IProjectData } from '@aimpact/agents-api/data/interfaces';
import { v4 as uuid } from 'uuid';
import { FirestoreErrorManager } from '@beyond-js/firestore-collection/errors';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { Response } from '@beyond-js/response/main';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { db } from '@beyond-js/firestore-collection/db';
import { projects } from '@aimpact/agents-api/data/model';

export /*bundle*/ class Projects {
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
			const { id, name, description } = params;

			const dataResponse = await Projects.data(id);
			if (dataResponse.error) return dataResponse;
			if (!dataResponse.data.exists) return dataResponse;

			const specs = { data: { id, name, description } };
			const response = await projects.merge(specs);
			if (response.error) return new FirestoreErrorManager(response.error.code, response.error.text);

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
			snapshot.forEach(doc => items.push(doc.data()));

			return { data: { items } };
		} catch (exc) {
			const error = ErrorGenerator.internalError(exc);
			return new Response({ error });
		}
	}
}
