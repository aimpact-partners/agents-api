import type { Server } from 'socket.io';
import * as dayjs from 'dayjs';
import * as jwt from 'jsonwebtoken';
import * as admin from 'firebase-admin';
import { db } from '@beyond-js/firestore-collection/db';

export /*actions*/ /*bundle*/ class UserProvider {
	socket: Server;
	private collection;
	private table = 'Users';

	constructor(socket: Server) {
		this.socket = socket;
		this.collection = db.collection(this.table);
	}

	async updateUser(user) {
		try {
			const userRef = await this.collection.doc(user.id);
			const { exists } = await userRef.get();
			if (exists) {
				// If the user already exists in the database, update the lastLogin field
				await userRef.update({
					...user,
					lastLogin: dayjs().unix()
				});
			} else {
				// If the user doesn't exist in the database, create a new document for them
				await userRef.set({
					id: user.id,
					displayName: user.displayName,
					email: user.email,
					firebaseToken: user.firebaseToken,
					token: user.token,
					custom: user.token,
					photoURL: user.photoURL,
					phoneNumber: user.phoneNumber,
					createdOn: dayjs().unix(),
					lastLogin: dayjs().unix()
				});
			}

			const updatedUser = await userRef.get();
			return { status: true, data: { user: updatedUser.data() } };
		} catch (e) {
			console.error(e);
		}
	}

	async login(user) {
		try {
			if (!user.id || !user.firebaseToken) {
				throw new Error('INVALID_USER');
			}
			const decodedToken = await admin.auth().verifyIdToken(user.firebaseToken);
			const customToken = jwt.sign({ uid: decodedToken.uid }, process.env.SECRET_KEY);
			user.token = customToken;

			return this.updateUser(user);
		} catch (e) {
			console.error(e);
			return { status: false, error: 'INVALID_TOKEN' };
		}
	}
}
