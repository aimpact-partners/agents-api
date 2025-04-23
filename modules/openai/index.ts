import * as dotenv from 'dotenv';
import * as FormData from 'form-data';
import fetch from 'node-fetch';
import OpenAI from 'openai';

const whisper = 'whisper-1';
const gptTurboPlus = 'gpt-3.5-turbo-0613';
const davinci3 = 'text-davinci-003';

dotenv.config();

export /*bundle*/ class OpenAIBackend {
	#openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

	async chatCompletions(
		messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
		model = gptTurboPlus,
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
				model: whisper,
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
		form.append('model', 'whisper-1');

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
