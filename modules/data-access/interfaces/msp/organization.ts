import { IPeopleBase } from '../common/people';
import { ITimeStamp } from '../common/timeStamp';

export /*bundle*/ interface IOrganizationBase {
	id: string;
	name: string;
	description?: string;
	picture?: string;
	joinSpecs: { code: string };
	type: string;
	educationalLevel: string;
	address: string;
}

export /*bundle*/ interface IOrganizationData extends IOrganizationBase {
	people: IPeopleBase[];
}

/**
 * The documents of the organizations associated with a user, stored as a subcollection.
 */
export /*bundle*/ interface IOrganizationUserData extends ITimeStamp {
	id: string;
	code: string;
	name: string;
	picture?: string;
}
