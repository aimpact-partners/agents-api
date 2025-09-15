import * as dotenv from 'dotenv';

dotenv.config();
const { COMIND_TOKEN } = process.env;

export /*bundle*/ class Comind {
	static async fecth(specs) {
		let response: any;
		try {
			const method = 'POST';
			const URL = `https://dev.co-mind.ai:44310/v1/chat/completions`;
			const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${COMIND_TOKEN}` };

			const body = JSON.stringify(specs);
			response = await fetch(URL, { method, headers, body });
		} catch (exc) {
			return { error: { code: 'BA100', text: `Failed to post` } };
		} finally {
			const json = await response.json();
			return json.error ? json : { data: json.data.message.content };
		}
	}
}
