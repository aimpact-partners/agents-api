import * as dotenv from 'dotenv';
import OpenAI from 'openai';

import { kb } from '@aimpact/chat-api/data/model';
import { DocumentsV2 } from './documents';

dotenv.config();

export /*bundle*/ class KB {
	static async storeDocuments(id: string, path: string, metadata) {
		const response = await kb.data({ id });
		if (response.error) {
			//BusinessError
		}

		const { data, error } = new DocumentsV2.get(path, metadata);

		const statusKB = !error ? 'failed' : 'processed';

		const documents = response.data.data;

		const parents = { KB: id };
		// await kb.set({ data });

		documents.push(data.items);
		await kb.documents.set({ data: { id, documents }, parents });

		// const collection = db.collection('KnowledgeBoxes');
		// await collection.doc(id).update({ status: statusKB });
	}
}
