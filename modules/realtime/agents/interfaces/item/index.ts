import type {
	IItemInputTextContent,
	IItemInputAudioContent,
	IItemTextContent,
	IItemAudioContent
} from './content-type';

// Define possible item statuses
export /*bundle*/ type ItemStatusType = 'completed' | 'in_progress' | 'incomplete';

// The type of the item ("message", "function_call", "function_call_output")
export /*bundle*/ type ItemType = 'message' | 'function_call' | 'function_call_output';

// The role of the message sender ("user", "assistant", "system").
export /*bundle*/ type MessageSenderType = 'user' | 'assistant' | 'system';

export /*bundle*/ interface IItemBase {
	// The unique ID of the item.
	id: string;

	// The status of the item ("completed", "in_progress", "incomplete").
	status: ItemStatusType;

	// The object type, must be "realtime.response".
	object?: 'realtime.item';
}

export /*bundle*/ interface ISystemItem extends IItemBase {
	type: 'message';
	role: 'system';
	content: IItemInputTextContent[];
}

export /*bundle*/ interface IUserItem extends IItemBase {
	type: 'message';
	role: 'user';
	content: (IItemInputTextContent | IItemInputAudioContent)[];
}

export /*bundle*/ interface IAssistantItem extends IItemBase {
	type: 'message';
	role: 'assistant';
	content: (IItemTextContent | IItemAudioContent)[];
}

export /*bundle*/ interface IFunctionCallItem extends IItemBase {
	type: 'function_call';

	// The ID of the function call (for "function_call" items).
	call_id: string;

	// The name of the function being called (for "function_call" items).
	name: string;

	// The arguments of the function call (for "function_call" items).
	arguments: string;
}

export /*bundle*/ interface IFunctionCallOutputItem extends IItemBase {
	type: 'function_call_output';

	// The ID of the function call (for "function_call" items).
	call_id: string;

	// The output of the function call (for "function_call_output" items).
	output: string;
}

export /*bundle*/ type IResponseItem = IAssistantItem | IFunctionCallItem;

export /*bundle*/ type IItem = ISystemItem | IUserItem | IFunctionCallOutputItem | IResponseItem;
