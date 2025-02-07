import { VectorDBQAChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { Vector } from './vector';
import type { Documents } from './documents';

export /*bundle*/ class KB {
	static async update(documents: Documents) {
		return await Vector.update(documents);
	}

	/**
	 *
	 * @deprecated
	 */
	static async fromTexts(texts, metadata) {
		return await Vector.fromTexts(texts, metadata);
	}

	/**
	 *
	 * @deprecated
	 */
	static async search(input: string, filters, limit = 1) {
		const vector = await Vector.get();
		const results = await vector.similaritySearch(input, limit, filters);
		return { status: true, data: results[0]?.pageContent };
	}

	/**
	 *
	 * @deprecated
	 */
	static async similaritySearch(input: string, filters, limit = 1) {
		const vector = await Vector.get();
		const results = await vector.similaritySearch(input, limit, filters);
		return { status: true, data: results };
	}

	/**
	 *
	 * @deprecated
	 */
	static async query(question: string, filter = undefined) {
		const vector = await Vector.get(filter);

		const specs = {
			openAIApiKey: process.env.OPEN_AI_KEY,
			temperature: 0.2,
			language: 'es',
			modelName: 'gpt-3.5-turbo'
		};
		const model = new OpenAI(specs);
		const chain = VectorDBQAChain.fromLLM(model, vector, {
			k: 1,
			returnSourceDocuments: false
		});

		const response = await chain.call({ query: question });
		return { status: true, data: response.text };
	}

	/**
	 *
	 * @deprecated
	 */
	static async chain(model = undefined, filter = undefined) {
		const vector = await Vector.get(filter);

		if (!model) {
			const specs = {
				openAIApiKey: process.env.OPEN_AI_KEY,
				temperature: 0.2,
				language: 'es',
				modelName: 'gpt-3.5-turbo'
			};
			model = new OpenAI(specs);
		}

		return VectorDBQAChain.fromLLM(model, vector, { k: 1, returnSourceDocuments: false });
	}
}
