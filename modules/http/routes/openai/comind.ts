import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import * as dotenv from 'dotenv';

dotenv.config();
const { COMIND_TOKEN } = process.env;

export const _comind = async function (specs) {
	let response: any;
	try {
		const method = 'POST';
		const URL = `https://dev.co-mind.ai:44310/v1/chat/completions`;
		const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${COMIND_TOKEN}` };

		specs.model = `falcon3:3b`;
		const body = JSON.stringify(specs);
		response = await fetch(URL, { method, headers, body });
	} catch (exc) {
		return { error: ErrorGenerator.internalError('BA100', `Failed to post`, exc.message) };
	} finally {
		const json = await response.json();
		return json.error ? json : { data: json.data.message.content };
	}
};
