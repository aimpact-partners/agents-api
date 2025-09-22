export /*bundle*/ interface IUserBase {
	id: string;
	uid?: string;
	name: string;
	displayName: string;
	photoUrl: string;
	email: string;
	phoneNumber: number;
}

export /*bundle*/ interface IUserData extends IUserBase {
	firebaseToken: string;
	createdOn?: number;
	lastLogin?: number;
}
