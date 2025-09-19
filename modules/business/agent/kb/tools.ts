import { KB } from '@aimpact/agents-api/business/kb';
import { tool } from '@openai/agents';
import { z } from 'zod';

export interface ISearcherParameters {
	query: string;
}

export /*bundle*/ const searcher = tool({
	name: 'search_knowledge_base',
	description: 'Searches the internal knowledge base for relevant information about a given topic.',
	parameters: z.object({
		query: z.string().describe('The topic or question to look up in the knowledge base.')
	}),
	async execute({ query }: ISearcherParameters, runContext) {
		try {
			const organizationId = (runContext?.context as { organizationId: string }).organizationId;

			const results = await KB.searchTool(query, organizationId, 5);
			if (results.error) return results.error;

			return results.data.items;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			return `Error searching knowledge base: ${errorMessage}`;
		}
	}
});

export const tools = [searcher];
