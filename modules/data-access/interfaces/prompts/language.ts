import type { IPromptLiterals } from './template';
import type { IProjectSpecification } from '../projects';

export /*bundle*/ interface IPromptOptionData {
	id: string;
	value: string;
}

export interface /*bundle*/ IPromptLanguageData {
	id: string; //name.language = header.es/header.en
	language: string;
	value?: string;
	literals?: IPromptLiterals;
	project: IProjectSpecification;
	options?: IPromptOptionData[];
}
