import { db } from '@aimpact/chat-api/firestore';
export class FirestoreService {
	constructor(private collectionName: string) {}

	getCollectionRef() {
		return db.collection(this.collectionName);
	}

	getDocumentRef(id: string) {
		return this.getCollectionRef().doc(id);
	}
}
