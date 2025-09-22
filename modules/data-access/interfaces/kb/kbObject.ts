import { IKBObjectArticleData } from './article';
import { IKBObjectSectionBase } from '../group/section';

export /*bundle*/ enum KBObjectTypes {
	Article = 'article',
	Module = 'module'
}

export interface IKBObjectTypes<T extends KBObjectTypes> {
	type: T;
}

export /*bundle*/ interface IKBObjectBase {
	id: string;
	section: IKBObjectSectionBase;
	article: IKBObjectArticleData;
}

export /*bundle*/ interface IKBObjectData extends IKBObjectBase {}

export /*bundle*/ interface IKBObjectListData extends IKBObjectBase {}

export /*bundle*/ interface IKBObjectListItem extends IKBObjectListData {}

/**
 * The assignment associated with a user, stored as a subcollection.
 */
export /*bundle*/ interface IKBObjectUserData {
	id: string;
	section: IKBObjectSectionBase;
	article: IKBObjectArticleData;
	archived?: boolean;
}
