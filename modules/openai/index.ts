import * as dotenv from 'dotenv';
import * as FormData from 'form-data';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { models } from './utils/models';

dotenv.config();

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

	async chatCompletions(
		messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
		model = models.GPT_3_5_TURBO,
		temperature = 0.2
	) {
		try {
			const response = await this.#openai.chat.completions.create({ model, messages, temperature });

			return { status: true, data: response.choices[0].message.content };
		} catch (e) {
			return { status: false, error: e.message };
		}
	}

	/**
	 *
	 * @param path
	 * @param lang
	 * @returns
	 */
	async transcription(file, lang = 'en'): Promise<any> {
		const prompt =
			lang === 'en'
				? 'Please, transcribe the following text in English'
				: 'Por favor, transcribe el siguiente texto en Español';

		try {
			const response = await this.#openai.audio.transcriptions.create({
				file,
				model: models.WHISPER_1,
				language: lang,
				prompt,
				response_format: 'json',
				temperature: 0.2
			});

			return { status: true, data: response.text };
		} catch (e) {
			const code = e.message.includes('401') ? 401 : 500;
			return { status: false, error: e.message, code };
		}
	}

	async transcriptionStream(buffer: Buffer, mimeType: string) {
		const form = new FormData();
		form.append('file', buffer, { filename: 'audio.mp4', contentType: 'audio/mp4' });
		form.append('model', models.WHISPER_1);

		try {
			const headers = { Authorization: `Bearer ${process.env.OPEN_AI_KEY}`, ...form.getHeaders() };
			const url = 'https://api.openai.com/v1/audio/transcriptions';
			const response = await fetch(url, { method: 'POST', body: form, headers });
			const json = await response.json();

			return { status: !!json.text, data: json, error: json.error?.message };
		} catch (e) {
			return { status: false, error: e.message };
		}
	}
}
