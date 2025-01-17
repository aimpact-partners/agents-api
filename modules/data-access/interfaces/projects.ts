export interface IProjectSpecification {
	id: string;
	name: string;
	identifier: string;
}

export /*bundle*/ interface IProjectBase {
	id: string;
	name: string;
	agent: { url: string };
}

export /*bundle*/ interface IProjectData extends IProjectBase {
	identifier: string;
	description: string;
}

export interface IPromptBase {
	model: string;
	temperature: number;
	format: string;
	prompt: { category: string; name: string };
	language: string;
}
export /*bundle*/ interface IIPEBase extends IPromptBase {}
export /*bundle*/ interface IIPEData extends IIPEBase {
	key: string;
	literals: Record<string, any>;
}

export /*bundle*/ interface IAgentsBase extends IPromptBase {
	literals: { agent: Record<string, any>; ipe: Record<string, any> };
	ipe?: IIPEData[];
}

export /*bundle*/ interface IAgentsData extends IAgentsBase {}
