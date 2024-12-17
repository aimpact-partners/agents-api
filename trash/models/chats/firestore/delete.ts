import type { firestore } from 'firebase-admin';
// jircdev id  > OQ1RCIvQxUhozvpO6hCLYDfS0Bw2
export class BatchDeleter {
	constructor(private collectionRef: FirebaseFirestore.CollectionReference) {}

	async deleteAll(property?: string, value?: any | any[]): Promise<any> {
		let query: firestore.Query<firestore.DocumentData> = this.collectionRef;

		if (property && value !== undefined) {
			query = Array.isArray(value)
				? this.collectionRef.where(property, 'in', value)
				: this.collectionRef.where(property, '==', value);
		}

		const snapshot = await query.get();
		const batch = this.collectionRef.firestore.batch();
		const ids = [];
		snapshot.docs.forEach(doc => {
			ids.push(doc.id);
			batch.delete(doc.ref);
		});

		await batch.commit();
		return ids;
	}
}
