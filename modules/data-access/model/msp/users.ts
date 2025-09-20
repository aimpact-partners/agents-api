import type {
	IArticleDraftUserData,
	IArticleUserData,
	IKBObjectUserData,
	ISectionUserData,
	IUserData
} from '@aimpact/agents-api/data/interfaces';
import { Collection, SubCollection } from '@beyond-js/firestore-collection/collection';

export abstract class MSPUsers extends Collection<IUserData> {
	// Drafts documents with minimal information to show the list of drafts of a user
	#drafts: SubCollection<IArticleDraftUserData>;
	get drafts() {
		return this.#drafts;
	}

	// Sections documents with minimal information to show the list of modules of a user
	#sections: SubCollection<ISectionUserData>;
	get sections() {
		return this.#sections;
	}

	// articles documents with minimal information to show the list of modules of a user
	#articles: SubCollection<IArticleUserData>;
	get articles() {
		return this.#articles;
	}
	// kbOjects documents with minimal information to show the list of modules of a user
	#kbOjects: SubCollection<IKBObjectUserData>;
	get kbOjects() {
		return this.#kbOjects;
	}

	constructor(collectionName: string) {
		super(collectionName);
		// Initialize the subcollections
		this.#drafts = new SubCollection('Drafts', this);
		this.#sections = new SubCollection('Sections', this);
		this.#articles = new SubCollection('Articles', this);
		this.#kbOjects = new SubCollection('KBObjects', this);
	}
}
