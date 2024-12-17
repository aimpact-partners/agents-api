export /*bundle*/ interface IPromptCategoryBase {
	id: string;
	name: string;
	description: string;
}

export /*bundle*/ interface IPromptCategoryData extends IPromptCategoryBase {
	prompts: Record<string, string>;
	project: { id: string; name: string };
}
