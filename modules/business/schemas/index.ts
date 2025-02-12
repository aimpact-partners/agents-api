import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { schemas } from '@aimpact/agents-api/data/model';
import { db } from '@beyond-js/firestore-collection/db';
import type { Transaction } from 'firebase-admin/firestore';

export /*bundle*/ class Schemas {
	static async get(id: string, lang: string) {
		try {
			const parents = { Schemas: id };
			const { data, error } = await schemas.languages.data({ id: lang, parents });
			if (error) return new BusinessResponse({ error });
			if (!data.exists) return new BusinessResponse({ error: data.error });

			return new BusinessResponse({ data: data.data });
		} catch (e) {
			return;
		}
	}

	static async set(params: { id: string; language: string; schema: string }) {
		return await db.runTransaction(async (transaction: Transaction) => {
			try {
				const { id, language, schema } = params;
				const response = await schemas.data({ id, transaction });
				if (response.error) throw new BusinessResponse({ error: response.error });
				if (!response.data.exists) {
					const schemaResponse = await schemas.set({ data: { id }, transaction });
					if (schemaResponse.error) throw new BusinessResponse({ error: schemaResponse.error });
				}

				const parents = { Schemas: id };
				const data = { id: `${id}.${language}`, language, schema };

				const languageResponse = await schemas.languages.set({ id: language, data, parents, transaction });
				if (languageResponse.error) throw new BusinessResponse({ error: languageResponse.error });

				return new BusinessResponse({ data });
			} catch (exc) {
				if (exc instanceof BusinessResponse) return exc;
				return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
			}
		});
	}
}
