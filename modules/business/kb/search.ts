import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { Pinecone } from './pinecone';

export /*bundle*/ class KB {
	static async search(text: string, context) {
		try {
			// const { data, error } = await Organizations.get(organizationId, user);
			// if (error) return new BusinessResponse({ error });

			const response = await Pinecone.query(undefined, context, text, 10);
			if (response.error) return new BusinessResponse({ error: response.error });

			const items = response.data.matches.map(item => {
				item.metadata.tags = item.metadata.tags ? JSON.parse(item.metadata.tags) : [];
				return item;
			});

			return new BusinessResponse({ data: { items } });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	static async searchTool(text: string, context, topK = 10) {
		try {
			const response = await Pinecone.query(undefined, context, text, topK);
			if (response.error) return new BusinessResponse({ error: response.error });

			const items = response.data.matches.map(item => {
				item.metadata.tags = item.metadata.tags ? JSON.parse(item.metadata.tags) : [];
				return item;
			});

			return new BusinessResponse({ data: { items } });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}
}
