import {initializeApp, applicationDefault} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';

export /*bundle*/ class Fire {
	#db;

	constructor() {
		initializeApp({credential: applicationDefault()});
		this.#db = getFirestore();
		console.log('init firestore');
	}

	async collection(name: string) {
		console.log('collection db', this.#db.collection(name));
		return this.#db.collection(name);
	}
}
