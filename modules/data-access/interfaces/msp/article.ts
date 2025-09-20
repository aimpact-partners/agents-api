import { IOwnerData } from './common/owner';
import { ITimeStamp } from './common/timeStamp';
import { IDraftBase, IDraftData, IDraftsTypes } from './draft';
import { IUserBase } from './user';

export /*bundle*/ interface IArticleDraftBase extends IArticleBase {}

export /*bundle*/ interface IArticleDraftData extends IArticleDraftBase {
	editors: IUserBase[];
}

export /*bundle*/ interface IArticleBase extends IDraftBase, ITimeStamp {
	/**
	 * @property {string} content - The main body or content of the object.
	 */
	content: string;

	owner?: IOwnerData;
}

export /*bundle*/ interface IArticleData extends IArticleBase, IDraftData {
	/**
	 * @property {string} slug - A unique and URL-friendly string (e.g., "my-first-article").
	 * Essential for SEO and for clean resource access.
	 */
	slug?: string;

	/**
	 * @property {string[]} [categories] - An array of strings for the categories.
	 * This supports multiple categories per object.
	 */
	categories?: string[];

	/**
	 * @property {string[]} [tags] - An array of strings for tags (keywords).
	 */
	tags?: string[];

	/**
	 * @property {number} [publicationDate] - The date and time when the object was published.
	 */
	publicationDate: number;

	/**
	 * @property {boolean} [isFeatured] - A boolean to feature the object. Useful for pinning articles or showcasing products on the main page.
	 */
	isFeatured?: boolean;

	specs?: any;

	kbObjects?: { id: string; section: { id: string; name: string; picture: string }; archived?: boolean }[];
}

export /*bundle*/ interface IArticleDraftUserData extends ITimeStamp, IDraftsTypes<'article'> {
	id: string;
	owner: IOwnerData;
	language?: string;
	title?: string;
	description?: string;
	picture?: string;
	ai?: boolean;
}

export /*bundle*/ interface IArticleListData {
	id: string;
	creator: IOwnerData;
	owner: IOwnerData;
	language: string;
	title: string;
	description: string;
	picture?: string;
}

export /*bundle*/ interface IArticleListItem extends IArticleListData, ITimeStamp {}

export /*bundle*/ interface IKBObjectArticleData extends IArticleListData, ITimeStamp {
	category?: string;

	tags?: string[];

	publicationDate: number;
}

/**
 * The documents of the articles associated with a user, stored as a subcollection.
 */

export /*bundle*/ interface IArticleUserData extends IArticleDraftUserData {
	kbObjects?: { id: string; section: { id: string; name: string; picture: string } }[];
	archived?: boolean;
}

export /*bundle*/ interface IVectorData {
	id: string;
	vector: string;
	context: string;
	organizationId: string;
	articleId: string;
	creator: string;
	owner: string;
	title: string;
	publicationDate: number;
	tags: string[];
}
export /*bundle*/ interface IArticleKBBase {
	id: string;
	prompt: string;
	vectors: IVectorData[];
}
export /*bundle*/ interface IArticleKBData extends IArticleKBBase {}
