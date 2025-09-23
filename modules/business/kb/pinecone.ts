// import type { VectorOperationsApi } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
// import type { Vector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/models/Vector';
// import type { ScoredVector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/models/ScoredVector';
// import type { ScoredVector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/models/ScoredVector';
// import type { ScoredVector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/db_data';
// import type { VectorOperationsApi } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/db_data';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import { splitter } from './splitter';

dotenv.config();

const { PINECONE_API_KEY, PINECONE_INDEX_NAME, EMBEDDINGS_MODEL, OPENAI_API_KEY } = process.env;

export /*bundle*/ class Pinecone {
	static #error: string;
	static #initialization: Promise<{}>;
	// static #index: VectorOperationsApi;
	static #index;
	static #openai: OpenAI;

	static async #initialise(): Promise<{ error?: string }> {
		if (this.#error) return { error: this.#error };
		if (this.#initialization) {
			await this.#initialization;
			return this.#error ? { error: this.#error } : {};
		}

		let resolve: (value: {}) => void;
		this.#initialization = new Promise(r => (resolve = r));

		try {
			const pinecone = new PineconeClient({ apiKey: PINECONE_API_KEY });
			this.#index = pinecone.Index(PINECONE_INDEX_NAME);

			this.#openai = new OpenAI({ apiKey: OPENAI_API_KEY });
		} catch (exc) {
			const error = `Error on KB initialization`;
			this.#error = error;
			return { error };
		} finally {
			resolve({});
		}

		return {};
	}

	/**
	 * Split text by paragraph delimiter '\n\n' and filter out empty strings
	 * @param text
	 * @returns
	 */
	static #splitter(text: string): string[] {
		const cleaner = (text: string) => {
			// Remove leading and trailing whitespaces
			text = text.trim();
			// Remove extra whitespaces
			text = text.replace(/\s+/g, ' ');
			// Remove special characters
			text = text.replace(/[^\p{L}\p{N}\s\.,?!]/gu, '');
			// Convert to lowercase
			text = text.toLowerCase();

			return text;
		};

		return text.split(/\n\n+/).map(paragraph => cleaner(paragraph));
	}

	static async upsert(
		namespace: string,
		metadata: object,
		id: string,
		text: string,
		language: string,
		split: 'text' | 'prompt'
	): Promise<BusinessResponse<{ stored: boolean }>> {
		// Check parameters
		if (
			!namespace ||
			!metadata ||
			!id ||
			!text ||
			!language ||
			typeof namespace !== 'string' ||
			typeof metadata !== 'object' ||
			typeof id !== 'string' ||
			typeof text !== 'string' ||
			typeof language !== 'string'
		) {
			throw new Error('Invalid parameters');
		}

		if (split && !['text', 'prompt'].includes(split)) {
			throw new Error('Invalid parameter type, must be "text" or "prompt"');
		}

		// Initialise OpenAI & Pinecone
		const { error } = await this.#initialise();
		if (error) return new BusinessResponse({ error: ErrorGenerator.internalError(error) });

		// Split the text in paragraphs
		let prompt, splits;
		if (split) {
			if (split === 'text') {
				splits = this.#splitter(text);
			} else if (split === 'prompt') {
				const response = await splitter(language, text);
				if (response.error)
					return new BusinessResponse({ error: ErrorGenerator.internalError(response.error.text) });
				if (response.splits.error)
					return new BusinessResponse({ error: ErrorGenerator.internalError(response.splits.error) });

				splits = response.splits;
				prompt = response.prompt;
			}
		} else splits = [{ vector: text, context: '' }];

		// metadata.content = splits.map
		const vector = splits.map(p => p.vector);

		// Get the embeddings and create the vectors
		let embeddings: number[][] = [];
		try {
			const response = await this.#openai.embeddings.create({ input: vector, model: EMBEDDINGS_MODEL });
			response.data?.forEach(({ embedding, index }) => (embeddings[index] = embedding));
		} catch (exc) {
			const error = 'Error getting embeddings from OpenAI';
			console.error(error, exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(error) });
		}

		// const vectors: Vector[] = [];
		const vectors = [];
		splits.forEach((split, index) => {
			const values = embeddings[index];
			const vector = {
				id: `${id}:${index}`,
				values,
				metadata: Object.assign({ vector: split.vector, context: split.context }, metadata)
			};
			vectors.push(vector);
		});

		// Store the vectors in pinecone
		namespace = void 0; // Namespaces are not available in free tier
		const request = { vectors, namespace };
		try {
			await this.#index.upsert(vectors);
			// const namespace = await this.#index.namespace('');
			// await namespace.upsert(vectors);
		} catch (exc) {
			const error = 'Error storing embeddings in the knowledge base';
			console.error(error, exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(error) });
		}

		const parsedVector = vectors.map(v => ({ id: v.id, ...v.metadata }));
		return new BusinessResponse({ data: { stored: true, prompt, vectors: parsedVector } });
	}

	static async query(
		namespace: string,
		filter: object,
		query: string,
		topK?: number
		// ): Promise<{ status: boolean; error?: string; matches?: ScoredVector[] }> {
	): Promise<BusinessResponse<{ matches?: [] }>> {
		// Check parameters
		if (!query || typeof query !== 'string')
			throw new BusinessResponse({ error: ErrorGenerator.invalidParameters(['query']) });
		if (filter && typeof filter !== 'object')
			throw new BusinessResponse({ error: ErrorGenerator.invalidParameters(['filter']) });

		// Initialise OpenAI & Pinecone
		const { error } = await this.#initialise();
		if (error) return new BusinessResponse({ error: ErrorGenerator.internalError(error) });

		topK = !topK || typeof topK !== 'number' || topK > 30 ? 3 : topK;

		// Get the embedding of the query in place
		let vector: number[];
		try {
			const response = await this.#openai.embeddings.create({ input: query, model: EMBEDDINGS_MODEL });
			vector = response.data[0].embedding;
		} catch (exc) {
			const error = 'Error getting embeddings from OpenAI';
			console.error(error, exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(error) });
		}

		// let matches: ScoredVector[];
		let matches;
		try {
			namespace = void 0; // Namespaces are not available in free tier
			const request = {
				vector,
				topK,
				includeMetadata: true,
				filter: filter ?? undefined
			};

			// Store the vectors in pinecone
			// ({ matches } = await this.#index.namespace(namespace).query(request));
			({ matches } = await this.#index.query(request));
		} catch (exc) {
			const error = 'Error querying knowledge base';
			console.error(error, exc);
			return new BusinessResponse({ error: ErrorGenerator.internalError(error) });
		}

		return new BusinessResponse({ data: { matches } });
	}
}
