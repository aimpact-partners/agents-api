import * as fs from 'fs';
import { join } from 'path';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import type { Credential } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const file = join(process.cwd(), './credentials/gcloud.json');

console.log('file en chatAPI');

// const specs: { credential?: Credential } = {};
// specs.credential = fs.existsSync(file) ? admin.credential.cert(file) : void 0;
// initializeApp(specs.credential ? specs : void 0);

// export /*bundle*/ const db = getFirestore();
