import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { projects } from '@aimpact/agents-api/data/model';

export /*bundle*/ class ProjectsAgents {
	static async get(projectId: string, id: string) {
		try {
			const parents = { Projects: projectId };
			const response = await projects.agents.data({ id, parents });
			if (response.error) return new BusinessResponse({ error: response.error });

			return new BusinessResponse({ data: response.data.data });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async set(id: string, params) {
		try {
			const ipeLiterals = new Set();
			params.ipe.forEach(ipe => {
				ipe.literals?.pure.forEach(value => ipeLiterals.add(value));
				// ipe.literals?.reserved.forEach(value => ipeLiterals.add(value));
			});

			const literals = { agent: params.literals, ipe: [...ipeLiterals] };

			const { name } = params;
			const data = Object.assign({ ...params }, { id: name, literals });

			const parents = { Projects: id };
			const response = await projects.agents.set({ id: name, data, parents });
			if (response.error) return new BusinessResponse({ error: response.error });

			return new BusinessResponse({ data });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}
}
