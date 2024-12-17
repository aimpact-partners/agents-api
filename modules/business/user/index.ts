import type { IUserData, IUserBase } from '@aimpact/agents-api/data/interfaces';
import type { Transaction } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';
import * as dayjs from 'dayjs';
import { users } from '@aimpact/agents-api/data/model';
import { db } from '@beyond-js/firestore-collection/db';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import { BusinessResponse } from '@aimpact/agents-api/business/response';

export /*bundle*/ interface IUser extends IUserBase {}

export /*bundle*/ class User implements IUser {
	#accessToken: string;

	#valid: boolean;
	get valid() {
		return this.#valid;
	}

	#uid: string;
	get uid() {
		return this.#uid;
	}

	#id: string;
	get id() {
		return this.#id;
	}

	#name: string;
	get name() {
		return this.#name;
	}

	#displayName: string;
	get displayName() {
		return this.#displayName;
	}

	#email: string;
	get email() {
		return this.#email;
	}

	#phoneNumber: number;
	get phoneNumber() {
		return this.#phoneNumber;
	}

	#photoURL: string;
	get photoURL() {
		return this.#photoURL;
	}

	private collection;
	private table = 'Users';
	constructor(id: string) {
		this.#id = id;
		this.collection = db.collection(this.table);
	}

	async load(): Promise<BusinessResponse<IUserData>> {
		try {
			if (!this.#id) {
				this.#valid = false;
				return new BusinessResponse({ error: ErrorGenerator.invalidParameters(['id']) });
			}

			const response = await users.data({ id: this.#id });
			if (response.error) return new BusinessResponse({ error: response.error });
			const { data } = response.data;

			this.#valid = true;

			this.#uid = this.#id;
			this.#email = data.email;
			this.#name = data.displayName;
			this.#displayName = data.displayName;
			this.#phoneNumber = data.phoneNumber;
			this.#photoURL = data.photoURL;

			return new BusinessResponse({ data });
		} catch (exc) {
			this.#valid = false;
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	async register(user: IUserData) {
		try {
			return await db.runTransaction(async (transaction: Transaction) => {
				const decodedToken = await admin.auth().verifyIdToken(user.firebaseToken);
				const customToken = jwt.sign({ uid: decodedToken.uid }, process.env.SECRET_KEY);
				user.token = customToken;

				const response = await users.data({ id: user.id, transaction });
				if (response.error) throw new BusinessResponse({ error: response.error });
				if (response.data.exists)
					throw new BusinessResponse({ error: ErrorGenerator.userAlreadyExists(user.id) });

				const data: IUserData = {
					id: user.id,
					uid: user.id,
					name: user.displayName,
					displayName: user.displayName,
					email: user.email,
					firebaseToken: user.firebaseToken,
					token: customToken,
					custom: customToken,
					photoURL: user.photoURL,
					phoneNumber: user.phoneNumber,
					createdOn: dayjs().unix(),
					lastLogin: dayjs().unix()
				};
				const { error } = await users.set({ data, transaction });
				if (error) throw new BusinessResponse({ error });

				return new BusinessResponse({ data });
			});
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	async login(user: IUserData): Promise<BusinessResponse<IUserData>> {
		const errors = [];
		!user.id && errors.push('id');
		!user.firebaseToken && errors.push('firebaseToken');
		if (errors.length) return new BusinessResponse({ error: ErrorGenerator.invalidParameters(errors) });

		const login = async (transaction: Transaction) => {
			const decodedToken = await admin.auth().verifyIdToken(user.firebaseToken);
			const customToken = jwt.sign({ uid: decodedToken.uid }, process.env.SECRET_KEY);
			user.token = customToken;

			const response = await users.data({ id: user.id, transaction });
			if (response.error) return { error: response.error };

			// If the user already exists in the database, update the lastLogin field
			if (response.data.exists) {
				const data = { ...user, lastLogin: dayjs().unix() };
				await users.merge({ data, transaction });

				return { data: Object.assign({}, response.data.data, { lastLogin: dayjs().unix() }) };
			}

			// If the user doesn't exist in the database, create a new document for them
			const date = dayjs().unix();
			const data = {
				id: user.id,
				uid: user.id,
				name: user.displayName,
				displayName: user.displayName,
				email: user.email,
				firebaseToken: user.firebaseToken,
				token: customToken,
				custom: customToken,
				photoURL: user.photoURL,
				phoneNumber: user.phoneNumber,
				createdOn: date,
				lastLogin: date
			};
			const r = await users.set({ data, transaction });

			return r.error ? { error: r.error } : { data };
		};

		try {
			const { data, error } = await db.runTransaction(login);
			return new BusinessResponse({ data, error });
		} catch (exc) {
			return new BusinessResponse({ error: ErrorGenerator.internalError(exc) });
		}
	}

	toJSON(): IUser {
		return {
			uid: this.#uid,
			id: this.#id,
			name: this.#name,
			displayName: this.#displayName,
			email: this.#email,
			photoURL: this.#photoURL,
			phoneNumber: this.#phoneNumber
		};
	}
}
