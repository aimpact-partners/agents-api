export /*bundle*/ interface ISchemaBase {
	id: string;
}
export /*bundle*/ interface ISchemaData extends ISchemaBase {}

export /*bundle*/ interface ISchemaLanguageBase {
	id: string;
}
export /*bundle*/ interface ISchemaLanguageData {
	id: string;
	schema: string;
}

export /*bundle*/ enum Status {
	pending = 'pending',
	inProgress = 'in-progress',
	completed = 'completed',
	outstanding = 'outstanding'
}
