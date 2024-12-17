import type { Conversation } from '@aimpact/agents-api/realtime/client/conversation';
import type { ClientSessionBase } from '.';
import type {
	IAgentItemAudioDeltaEvent,
	IAgentItemCreatedEvent,
	IUserSpeechStartedEvent
} from '@aimpact/agents-api/realtime/interfaces/agent-events';
import { RealtimeUtils } from '@aimpact/agents-api/realtime/utils';

export /*bundle*/ class ActiveConversation {
	#session: ClientSessionBase;
	#conversation: Conversation;

	constructor(session: ClientSessionBase) {
		this.#session = session;
	}

	async set(conversation: Conversation) {
		this.#conversation = conversation;
	}

	#onItemAudioDelta(event: 'conversation.item.audio.delta', data: IAgentItemAudioDeltaEvent) {
		const buffer = RealtimeUtils.base64ToArrayBuffer(data.delta);
		const delta = new Int16Array(buffer);

		delta && this.#conversation._process(event, data, delta);
		delta && this.#session.player.add16BitPCM(delta, data.item.id);
	}

	#onSpeechStarted(event: 'user.speech.started', data: IUserSpeechStartedEvent) {
		this.#session.player.interrupt();
		this.#conversation._process(event, data);
	}

	process(event: string, data: any) {
		switch (event) {
			case 'conversation.item.created':
				this.#conversation._process(event, data);
				break;
			case 'conversation.item.audio.delta':
				this.#onItemAudioDelta(event, data);
				break;
			case 'user.speech.started':
				this.#onSpeechStarted(event, data);
				break;
		}
	}
}
