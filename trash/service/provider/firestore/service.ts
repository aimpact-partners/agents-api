import { db } from '@beyond-js/firestore-collection/db';
export class FirestoreService {
	constructor(private collectionName: string) {}

	getCollectionRef() {
		return db.collection(this.collectionName);
	}

	getDocumentRef(id: string) {
		return this.getCollectionRef().doc(id);
	}
}
