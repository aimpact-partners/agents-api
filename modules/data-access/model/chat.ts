import { Collection, SubCollection } from '@beyond-js/firestore-collection/collection';
import type { IChatData, IMessageData } from '@aimpact/agents-api/data/interfaces';

class Chats extends Collection<IChatData> {
	#messages: SubCollection<IMessageData>;
	get messages() {
		return this.#messages;
	}

	constructor() {
		super('Chats');
		this.#messages = new SubCollection('messages', this);
	}
}

export /*bundle*/ const chats = new Chats();
