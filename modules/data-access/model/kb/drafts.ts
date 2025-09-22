import type { IArticleDraftData } from '@aimpact/agents-api/data/interfaces';
import { Collection } from '@beyond-js/firestore-collection/collection';

export /*bundle*/ const drafts: Collection<IArticleDraftData> = new Collection('Drafts');
