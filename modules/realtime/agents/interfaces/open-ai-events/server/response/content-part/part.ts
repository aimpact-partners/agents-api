export /*bundle*/ interface IPart {
	// The content type ("text", "audio").
	type: 'text' | 'audio';

	// The text content (if type is "text").
	text?: '';

	// Base64-encoded audio data (if type is "audio").
	audio?: string;

	// The transcript of the audio (if type is "audio").
	transcript: string;
}
