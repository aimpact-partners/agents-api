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
