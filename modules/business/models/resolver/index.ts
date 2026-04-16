import { DeepSeekCaller } from '@aimpact/agents-api/business/models/deepseek/caller';
import type { IModelCaller } from '@aimpact/agents-api/business/models/types';
import { OpenAICaller } from '@aimpact/agents-api/business/models/open-ai/caller';

export /*bundle*/ class ModelResolver {
	static get(): IModelCaller {
		const provider = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();
		if (provider === 'deepseek') return DeepSeekCaller;
		return OpenAICaller;
	}
}
