import type { ITimeStamp } from './common/timeStamp';
import type { IIPEData, IPromptBase } from './prompts';

export interface IProjectSpecification {
	id: string;
	name: string;
	identifier: string;
}

export /*bundle*/ interface IProjectBase extends IProjectSpecification {
	description: string;
}

export /*bundle*/ interface IProjectData extends IProjectBase {
	agent: { url: string };
}

export /*bundle*/ interface IAgentBase extends IPromptBase {
	literals: { agent: Record<string, any>; ipe: Record<string, any> };
	ipe?: IIPEData[];
}

export /*bundle*/ interface IAgentData extends IAgentBase {}

export /*bundle*/ interface IApiKeyBase extends ITimeStamp {
	creator: {
		id: string;
		name: string;
		email: string;
		photoURL: string;
	};
	key: string;
	name: string;
}

export /*bundle*/ interface IApiKeyData {}
