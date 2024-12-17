export /*bundle*/ interface IUserBase {
	uid: string;
	id: string;
	name: string;
	displayName: string;
	email: string;
	photoURL: string;
	phoneNumber: number;
}

export /*bundle*/ interface IUserData extends IUserBase {
	firebaseToken: string;
	token: string;
	custom: string;
	createdOn: number;
	lastLogin: number;
}
