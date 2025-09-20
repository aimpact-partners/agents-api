import { IPeopleBase } from '../common/people';
import { IArticleListItem, IKBObjectArticleData } from './article';
import type { IOwnerData } from './common/owner';
import { ITimeStamp } from './common/timeStamp';

export interface IKBObjectSectionBase {
	id: string;
	name: string;
	picture: string;
}

export /*bundle*/ interface ISectionBase {
	id: string;
	name: string;
	description?: string;
	picture?: string;
	joinSpecs: { code: string };
	owner: {
		teacher?: { uid: string; name: string; photoUrl: string };
		organization?: { id: string; name: string; picture: string };
	};
}

/**
 * The classroom data as it is being stored in the firestore database
 */
export /*bundle*/ interface ISectionData extends ISectionBase {
	people: IPeopleBase[];
	kbObjects?: { id: string; article: IArticleListItem }[];
}

/**
 * Section objects subcollection
 */
export /*bundle*/ interface ISectionKBObjectsBase {
	id: string;
	archived?: boolean;
	// object: IKBObjectListItem;
	article: IKBObjectArticleData;
}

/**
 * Represents the base data of a classroom for a list/subcollection
 */
export /*bundle*/ interface ISectionItemBase extends ITimeStamp {
	id: string;
	code: string;
	name: string;
	picture?: string;
	external?: string;
}

/**
 * The documents of the section associated with a user, stored as a subcollection.
 */
export /*bundle*/ interface ISectionUserData extends ISectionItemBase {
	owner: IOwnerData;
}
