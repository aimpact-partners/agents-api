import type {
	IConversationItemCreatedServerEvent,
	IResponseFunctionCallArgumentsDeltaServerEvent
} from '@aimpact/agents-api/realtime/interfaces/open-ai-events';

export class ConversationItemTool {
	#status: 'in_progress' | 'completed';
	get status() {
		return this.#status;
	}

	#caller: string;
	get caller() {
		return this.#caller;
	}

	#name: string;
	get name() {
		return this.#name;
	}

	#arguments: string;
	get arguments() {
		return this.#arguments;
	}

	#output: string;
	get output() {
		return this.#output;
	}

	constructor(data: { caller: string; name: string; arguments: string }) {
		this.#caller = data.caller;
		this.#name = data.name;
		this.#arguments = data.arguments;
	}

	/**
	 * When a conversation item is created.
	 * There are several scenarios that produce this event:
	 *
	 * @param event
	 */
	created(event: IConversationItemCreatedServerEvent) {
		// Set the item status based on the type and role
		if (event.item.type === 'function_call') {
			this.#status = 'in_progress';
		} else if (event.item.type === 'function_call_output') {
			this.#status = 'completed';
			this.#output = event.item.output;
		}
	}

	functionCallArgumentsDelta(event: IResponseFunctionCallArgumentsDeltaServerEvent) {
		this.#arguments += event.delta;
	}
}
