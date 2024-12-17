import * as admin from 'firebase-admin';

export /*bundle*/ class Timestamp {
	static set(value?: string | number): number | admin.firestore.FieldValue {
		if (!value) return admin.firestore.FieldValue.serverTimestamp();
		return typeof value === 'number' ? value : parseInt(value);
	}

	static format(value: any): number {
		if (typeof value === 'object' && value instanceof admin.firestore.Timestamp) {
			const date: Date = value.toDate();
			return date.getTime();
		}
		return typeof value === 'number' ? value : parseInt(value);
	}
}
