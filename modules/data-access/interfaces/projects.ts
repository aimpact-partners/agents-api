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
