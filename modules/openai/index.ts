import OpenAI from 'openai';
import fetch from 'node-fetch';
import * as FormData from 'form-data';
import { gptTurboPlus, davinci3, whisper } from './utils/models';
import * as dotenv from 'dotenv';

dotenv.config();

export /*bundle*/ class OpenAIBackend {
	#openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

	async completions(prompt: string, text: string) {
		const content: string = prompt + `\n` + text;

		try {
			const response = await this.#openai.completions.create({
				model: davinci3,
				prompt: content,
				temperature: 0.2
			});

			return { status: true, data: response.choices[0].text };
		} catch (e) {
			console.error(e.message);
			return { status: false, error: e.message };
		}
	}

	async chatCompletions(
		messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
		model = gptTurboPlus,
		temperature = 0.2
	) {
		try {
			const response = await this.#openai.chat.completions.create({ model, messages, temperature });

			return { status: true, data: response.choices[0].message.content };
		} catch (e) {
			console.error(e.message);
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
		//    const blob = await getFile(path);
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
			const code = e.message.includes('401' ? 401 : 500);
			return { status: false, error: e.message, code };
		}
	}

	async transcriptionStream(
		stream: NodeJS.ReadableStream,
		lang: string
	): Promise<{ status: boolean; data?: any; error?: string; code?: number }> {
		let form: FormData = new FormData();
		form.append('file', stream, 'audio.webm');
		form.append('model', 'whisper-1');

		let headers = {
			Authorization: `Bearer ${process.env.OPEN_AI_KEY}`,
			...form.getHeaders()
		};

		try {
			const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
				method: 'POST',
				body: form,
				headers
			});
			const data = await response.json();

			return { status: true, data };
		} catch (e) {
			console.error(e);
			const code = e.message.includes('401') ? 401 : 500;
			return { status: false, error: e.message, code };
		}
	}
}
