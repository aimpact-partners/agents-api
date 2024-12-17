export /*bundle*/ type AgentEventName =
	| 'session.created'
	| 'conversation.item.created'
	| 'conversation.item.audio.delta'
	| 'user.speech.started';

export /*bundle*/ interface IAgentItem {
	id: string;
	type: 'message' | 'function_call';
	role: 'user' | 'assistant' | 'function_call' | 'function_output';
}

export /*bundle*/ interface IAgentItemCreatedEvent {
	item: IAgentItem;
}

export /*bundle*/ interface IAgentItemAudioDeltaEvent {
	item: { id: string };
	delta: string;
}

export /*bundle*/ interface IUserSpeechStartedEvent {
	item: { id: string };
}
