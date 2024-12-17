import { v4 as uuid } from 'uuid';
import { db } from '@beyond-js/firestore-collection/db';

const table = 'KnowledgeBoxes';
interface ISpecs {
	container: string;
	userId: string;
	kbId?: string;
	docs: any[];
}

export const setKnowledgeBox = async function (id: string, data) {
	const collection = db.collection(table);
	await collection.doc(id).update(data);
};

export const storeKnowledgeBox = async ({ container, userId, kbId, docs }: ISpecs) => {
	const collection = db.collection(table);

	if (!kbId) {
		const id = uuid();
		const timeCreated: number = new Date().getTime();
		const data = { id, userId, path: container, timeCreated, status: 'pending' };
		await collection.doc(id).set(data);
		kbId = id;
	}

	const batch = db.batch();
	const documentsSubcollection = collection.doc(kbId).collection('documents');

	for (let docData of docs) {
		let newDocRef = documentsSubcollection.doc();
		batch.set(newDocRef, docData);
	}

	await batch.commit();

	return kbId;
};
