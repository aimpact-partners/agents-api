import { FirestoreErrorManager } from '@beyond-js/firestore-collection/errors';
import { db } from '@beyond-js/firestore-collection/db';
import { v4 as uuid } from 'uuid';
import { Response } from '@beyond-js/response/main';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { Projects } from '@aimpact/agents-api/business/projects';
import { promptsCategories } from '@aimpact/agents-api/data/model';
import type { IPromptCategoryData } from '@aimpact/agents-api/data/interfaces';

interface IPromptCategorySpecs {
	projectId: string;
	id: string;
	name: string;
	description: string;
}

export /*bundle*/ class PromptCategories {
	static async data(id: string) {
		return await promptsCategories.data({ id });
	}

	static async save(params: IPromptCategorySpecs) {
		try {
			if (!params.projectId) {
				const error = ErrorGenerator.invalidParameters(['projectId']);
				return new Response({ error });
			}
			if (!params.name) {
				const error = ErrorGenerator.invalidParameters(['name']);
				return new Response({ error });
			}

			const { name, description, projectId } = params;
			const projectResponse = await Projects.data(projectId);
			if (projectResponse.error) {
				return projectResponse;
			}
			if (projectResponse.data.error) {
				return projectResponse;
			}

			const projectSpecs = {
				id: projectResponse.data.data.id,
				name: projectResponse.data.data.name,
				identifier: projectResponse.data.data.identifier
			};

			const id = params.id ?? uuid();
			const specs = { data: { id, name, description, project: projectSpecs } };
			const response = await promptsCategories.set(specs);

			if (response.error) return new FirestoreErrorManager(response.error.code, response.error.text);

			return await PromptCategories.data(id);
		} catch (exc) {
			const error = ErrorGenerator.internalError(exc);
			return new Response({ error });
		}
	}

	static async update(params: {}) {
		const specs = { data: params };
		try {
			const response = await promptsCategories.merge(specs);
			if (response.error) return new FirestoreErrorManager(response.error.code, response.error.text);

			return response.data;
		} catch (exc) {
			const error = ErrorGenerator.internalError(exc);
			return new Response({ error });
		}
	}

	static async byProject(project: string) {
		try {
			const categoriasRef = db.collection('PromptCategories');
			const snapshot = await categoriasRef.where('project.id', '==', project).get();

			const entries: IPromptCategoryData[] = [];
			snapshot.forEach(doc => entries.push(doc.data() as IPromptCategoryData));

			return { data: { entries } };
		} catch (exc) {
			const error = ErrorGenerator.internalError(exc);
			return new Response({ error });
		}
	}
}
