export /*bundle*/ type RoleType = 'manager' | 'member';

export /*bundle*/ interface IPeopleBase {
	uid?: string;
	id?: string;
	role?: RoleType;
	name: string;
	photoUrl?: string;
}
export /*bundle*/ interface IPeopleData extends IPeopleBase {
	email: string;
	invited?: boolean;
	authorized?: boolean;
	notifications?: boolean;
}

export /*bundle*/ interface IInviteData {
	id: string; // email|entity|groupId
	email: string;
	role?: RoleType;
}
