import { IContributors } from './common/contributors';
import type { IOwnerData } from './common/owner';
import { IUserBase } from './user';

export /*bundle*/ type DraftType = 'article' | 'draft' | 'module' | 'community';

export /*bundle*/ enum DraftTypes {
	Article = 'article',
	Draft = 'draft',
	Module = 'module',
	Community = 'community'
}

export /*bundle*/ interface IDraftBase {
	type: DraftType;

	/**
	 * @property {string} id - The unique identifier of the object. This is mandatory.
	 */
	id: string;

	/**
	 * @property {DraftStatus} status - The current status of the object (e.g., 'draft', 'published').
	 */
	state: DraftStatus;

	/**
	 * @property {string} language - The language of the object.
	 */
	language: string;

	/**
	 * @property {string} title - The main title of the object.
	 */
	title?: string;

	/**
	 * @property {string} description - A brief summary or description of the object.
	 */
	description?: string;

	/**
	 * @property {string} [picture] - The picture of the object.
	 */
	picture?: string;

	creator: IOwnerData;

	ai?: boolean;
}

export /*bundle*/ interface IDraftData extends IDraftBase {
	owner?: IOwnerData;

	cloned?: { id: string; user: { uid: string; name: string }; created: number }[];

	/**
	 * @property {IUserBase} [lastModifiedBy] - The last user who edited the object. It is optional,
	 * as a newly created object won't have an editor different from the creator.
	 */
	lastModifiedBy?: IUserBase;

	editors: IUserBase[];

	contributors?: IContributors;
}

/**
 * @enum {string}
 * @description Defines the possible publication statuses of an object.
 * Using a string literal type prevents errors and maintains consistency.
 */
export /*bundle*/ type DraftStatus = 'draft' | 'blocked' | 'published';

export interface IDraftsTypes<T extends DraftType> {
	type: T;
}
