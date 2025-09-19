import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { PromptTemplateExecutor } from '@aimpact/agents-api/business/prompts';
import { BusinessResponse } from '@aimpact/agents-api/business/response';
import * as dotenv from 'dotenv';

dotenv.config();
const { GPT_MODEL } = process.env;

export const splitter = async function (language: string, text: string) {
	const specs = {
		category: 'agents',
		name: `ailearn.kb-people`,
		language: language,
		temperature: 1,
		literals: { article: text },
		model: GPT_MODEL
	};

	const execute = await new PromptTemplateExecutor(specs).execute();
	if (execute.error) throw new BusinessResponse({ error: execute.error });

	let response;
	try {
		const content = execute.data?.content.replace(/```json|```/g, '');
		response = JSON.parse(content);
	} catch (exc) {
		return { error: ErrorGenerator.internalError(exc) };
	}

	return { splits: response, prompt: execute.data.prompt };
};
