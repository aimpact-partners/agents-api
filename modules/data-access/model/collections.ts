import type { ICodeData } from '@aimpact/agents-api/data/interfaces';
import { Collection } from '@beyond-js/firestore-collection/collection';

export /*bundle*/ const codes = new Collection<ICodeData>('Codes');
export /*bundle*/ const metadata = new Collection<any>('Metadata');
