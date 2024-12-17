import type { VectorOperationsApi } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
import type { Vector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/models/Vector';
import type { ScoredVector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/models/ScoredVector';
import { PineconeClient } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const { PINECONE_API_KEY, PINECONE_ENVIRONMENT, PINECONE_INDEX_NAME, OPEN_AI_KEY } = process.env;
const model = 'text-embedding-ada-002';

export /*bundle*/ class Pinecone {
	static #error: string;
	static #initialization: Promise<{}>;
	static #index: VectorOperationsApi;
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
			const pinecone = new PineconeClient();
			await pinecone.init({
				apiKey: PINECONE_API_KEY,
				environment: PINECONE_ENVIRONMENT
			});
			this.#index = pinecone.Index(PINECONE_INDEX_NAME);

			this.#openai = new OpenAI({ apiKey: OPEN_AI_KEY });
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
		text: string
	): Promise<{ status: boolean; error?: string }> {
		// Check parameters
		if (
			!namespace ||
			!metadata ||
			!id ||
			!text ||
			typeof namespace !== 'string' ||
			typeof metadata !== 'object' ||
			typeof id !== 'string' ||
			typeof text !== 'string'
		) {
			throw new Error('Invalid parameters');
		}

		// Initialise OpenAI & Pinecone
		const { error } = await this.#initialise();
		if (error) return { status: false, error };

		// Split the text in paragraphs
		const paragraphs = this.#splitter(text);

		console.log(1, paragraphs);

		// Get the embeddings and create the vectors
		let embeddings: number[][] = [];
		try {
			const response = await this.#openai.embeddings.create({ input: paragraphs, model });
			response.data?.forEach(({ embedding, index }) => (embeddings[index] = embedding));
		} catch (exc) {
			const error = 'Error getting embeddings from OpenAI';
			console.error(error, exc);
			return { status: false, error };
		}

		const vectors: Vector[] = [];
		paragraphs.forEach((paragraph, index) => {
			const values = embeddings[index];
			const vector = { id: `${id}:${index}`, values, metadata: Object.assign({ paragraph }, metadata) };

			vectors.push(vector);
		});

		// Store the vectors in pinecone
		namespace = void 0; // Namespaces are not available in free tier
		const request = { vectors, namespace };
		try {
			await this.#index.upsert({ upsertRequest: request });
		} catch (exc) {
			const error = 'Error storing embeddings in the knowledge base';
			console.error(error, exc);
			return { status: false, error };
		}

		return { status: true };
	}

	static async query(
		namespace: string,
		filter: object,
		query: string,
		topK?: number
	): Promise<{ status: boolean; error?: string; matches?: ScoredVector[] }> {
		// Check parameters
		if (
			!namespace ||
			!filter ||
			!query ||
			typeof namespace !== 'string' ||
			typeof filter !== 'object' ||
			typeof query !== 'string'
		) {
			throw new Error('Invalid parameters');
		}

		// Initialise OpenAI & Pinecone
		const { error } = await this.#initialise();
		if (error) return { status: false, error };

		topK = !topK || typeof topK !== 'number' || topK > 30 ? 3 : topK;

		// Get the embedding of the query in place
		let vector: number[];
		try {
			console.log(2, query, model);
			const response = await this.#openai.embeddings.create({ input: query, model });
			vector = response.data[0].embedding;
		} catch (exc) {
			const error = 'Error getting embeddings from OpenAI';
			console.error(error, exc);
			return { status: false, error };
		}

		let matches: ScoredVector[];
		try {
			namespace = void 0; // Namespaces are not available in free tier
			const request = { vector, topK, includeMetadata: true, filter, namespace };

			console.log(2.1, request);

			// Store the vectors in pinecone
			({ matches } = await this.#index.query({ queryRequest: request }));
		} catch (exc) {
			const error = 'Error querying knowledge base';
			console.error(error, exc);
			return { status: false, error };
		}

		return { status: true, matches };
	}
}
