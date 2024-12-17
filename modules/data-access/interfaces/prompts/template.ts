import type { IPromptCategoryData } from './category';
import type { IPromptOptionData } from './language';
import type { IProjectSpecification } from '../projects';

export /*bundle*/ interface IPromptLanguage {
	default: string;
	languages: string[];
	updated: string[];
}

export /*bundle*/ interface IPromptLiterals {
	pure?: string[];
	dependencies?: string[];
	metadata?: string[];
}

interface IBaseData {
	id: string;
	name: string;
	description?: string;
	format: 'json' | 'text';
	is: 'prompt' | 'function' | 'dependency';
	literals?: IPromptLiterals;
	language: IPromptLanguage;
}

export /*bundle*/ interface IPromptTemplateBase extends IBaseData {
	projectId: string;
	value?: string;
	options?: IPromptOptionData[];
}

export /*bundle*/ interface IPromptTemplateData extends IBaseData {
	identifier: string;
	project: IProjectSpecification;
	categories?: IPromptCategoryData[];
	value?: string;
}

export /*bundle*/ interface IPromptTemplateLanguageData {
	id: string;
	project: IProjectSpecification;
	language: string;
	value?: string;
	literals?: IPromptLiterals;
}
