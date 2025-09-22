export interface IChat {
	uid: string;
	projectId: string;
	id?: string;
	name: string;
	parent: string;
	children: string;
	category?: string;
	metadata: any;
	language: { default: string };
}

export interface IMetadata {
	summary?: string;
	objectives?: [];
	credits?: { total: number; consumed: number };
	error?: IError;
}
export interface IError {
	code: number;
	text: string;
}
