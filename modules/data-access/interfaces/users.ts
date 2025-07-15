export /*bundle*/ interface IUserBase {
	id?: string;
	uid: string;
	name: string;
	email: string;
	photoUrl: string;
	phoneNumber: number;
	displayName?: string;
}

export /*bundle*/ interface IUserData extends IUserBase {
	firebaseToken: string;
	token: string;
	custom: string;
	createdOn: number;
	lastLogin: number;
}
