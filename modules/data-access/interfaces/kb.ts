export /*bundle*/ interface IKnowledgeBoxesBase {
	id: string;
	path: string;
	userId: string;
	prompt: string;
	documents: [];
}

export /*bundle*/ interface IKnowledgeBoxesData extends IKnowledgeBoxesBase {}
