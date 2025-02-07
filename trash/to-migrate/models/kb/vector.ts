import { PineconeClient } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import type { Documents } from './documents';

export class Vector {
	static async init() {
		const client = new PineconeClient();

		try {
			await client.init({
				apiKey: process.env.PINECONE_API_KEY,
				environment: process.env.PINECONE_ENVIRONMENT
			});
		} catch (e) {
			console.error(e);
			throw Error(`Pinecode Client not init ${e.message}`);
		}

		return client;
	}

	static async get(metadata: {} | undefined = undefined) {
		const client = await Vector.init();

		try {
			const pineconeIndex = client.Index(process.env.PINECONE_INDEX_NAME);
			const embedding = new OpenAIEmbeddings({ openAIApiKey: process.env.OPEN_AI_KEY });

			const specs = { pineconeIndex, filter: undefined };
			metadata && (specs.filter = metadata);
			return await PineconeStore.fromExistingIndex(embedding, specs);
		} catch (e) {
			console.error(e);
		}
	}

	static async update(documents: Documents) {
		const client = await Vector.init();

		const indexes = await client.listIndexes();
		if (!indexes.length && !indexes.includes(process.env.PINECONE_INDEX_NAME)) {
			return { status: false, error: `Embedding index "${process.env.PINECONE_INDEX_NAME}" not found` };
		}

		const specs = { openAIApiKey: process.env.OPEN_AI_KEY };
		const embeddings = new OpenAIEmbeddings(specs);

		const pineconeIndex = client.Index(process.env.PINECONE_INDEX_NAME);
		await PineconeStore.fromDocuments(documents.items, embeddings, { pineconeIndex });

		return { status: true, data: { message: 'Embeddings updated' } };
	}

	static async fromTexts(texts: string[], metadata) {
		if (!texts) {
			throw new Error('no texts to embed');
		}

		const client = await Vector.init();
		const specs = { openAIApiKey: process.env.OPEN_AI_KEY };
		const embeddings = new OpenAIEmbeddings(specs);

		const pineconeIndex = client.Index(process.env.PINECONE_INDEX_NAME);
		const dbConfig = {
			pineconeIndex
			// namespace: 'chats', //check namespaces
		};

		try {
			const pineconeStore = await PineconeStore.fromTexts(texts, metadata, embeddings, dbConfig);
			return { status: true, data: { message: 'Texts inserted successfully!' } };
		} catch (e) {
			console.error('Error[m/kb/fromTexts] :', e);
			return { status: false, error: e.message };
		}
	}
}
