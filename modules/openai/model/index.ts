import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import { models } from './utils/models';

dotenv.config();

if (!process.env.OPEN_AI_KEY) {
	console.log('process.env.OPEN_AI_KEY', process.env.OPEN_AI_KEY, process.env);
	throw new Error('The openAI key is missing');
}

interface ICompletionsParams {
	messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
	model?: string;
	temperature?: number;
}

export /*bundle*/ class OpenAIBackend {
	#openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

	async completions({ messages, model = models.GPT_3_5_TURBO, temperature = 0.2 }: ICompletionsParams) {
		try {
			const response = await this.#openai.chat.completions.create({ model, messages, temperature });

			return { status: true, data: response.choices[0].message.content };
		} catch (e) {
			return { status: false, error: e.message };
		}
	}
}
