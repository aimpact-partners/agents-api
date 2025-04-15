/**
 * entity = project
 */
export /*bundle*/ interface ICodeBase {
	id: string; // entity.code
	code: string;
	entity: {
		name: string; // 'project'
		id: string;
	};
}

export /*bundle*/ interface ICodeData extends ICodeBase {}
