// The content type ("input_text", "input_audio", "text", "audio").
export /*bundle*/ type ItemContentType = 'input_text' | 'input_audio' | 'text' | 'audio';

export /*bundle*/ interface IItemInputTextContent {
	type: 'input_text';
	text: string;
}

export /*bundle*/ interface IItemInputAudioContent {
	type: 'input_audio';
	audio?: string; // base64-encoded audio data
	transcript?: string | null;
}

export /*bundle*/ interface IItemTextContent {
	type: 'text';
	text: string;
}

export /*bundle*/ interface IItemAudioContent {
	type: 'audio';
	audio?: string; // base64-encoded audio data
	transcript?: string | null;
}

export /*bundle*/ type IItemContentType =
	| IItemInputTextContent
	| IItemInputAudioContent
	| IItemTextContent
	| IItemAudioContent;
