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

	static async activities() {
		try {
			const promptActivities = {
				'character-talk': {
					id: 'character-talk',
					name: 'character talk',
					prompts: {
						system: 'ailearn.activity-character-talk-v2',
						ipe: 'ailearn.character-talk-ipe-v2',
						summary: 'ailearn.character-talk-summary'
					}
				},
				'content-theory': {
					id: 'content-theory',
					name: 'content theory',
					prompts: {
						system: 'ailearn.activity-content-theory-v2',
						ipe: 'ailearn.content-theory-ipe-v2',
						summary: 'ailearn.content-theory-summary'
					}
				},
				debate: {
					id: 'debate',
					name: 'debate',
					prompts: {
						system: 'ailearn.activity-debate-v2',
						ipe: 'ailearn.debate-ipe-v2',
						summary: 'ailearn.debate-summary'
					}
				},
				exercise: {
					id: 'exercise',
					name: 'exercise',
					prompts: {
						system: 'ailearn.activity-exercise-v2',
						ipe: 'ailearn.exercise-ipe-v2',
						summary: 'ailearn.exercise-summary'
					}
				},
				'free-conversation': {
					id: 'free-conversation',
					name: 'free conversation',
					prompts: {
						system: 'ailearn.activity-free-conversation-v2',
						ipe: 'ailearn.free-conversation-ipe-v2',
						summary: 'ailearn.free-conversation-summary'
					}
				},
				'self-service': {
					id: 'self-service-agent',
					name: 'self service agent',
					prompts: {
						system: 'itegrity.self-service-agent',
						ipe: 'itegrity.self-service-ipe',
						summary: 'itegrity.self-service-summary'
					}
				}
			};

			return new BusinessResponse({ data: promptActivities });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}
}
