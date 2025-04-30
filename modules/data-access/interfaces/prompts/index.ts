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
