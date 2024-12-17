// Define settings for turn detection using server-side Voice Activity Detection (VAD)
export /*bundle*/ interface ITurnDetectionServer {
	type: 'server_vad' | 'none';
	threshold?: number;
	prefix_padding_ms?: number;
	silence_duration_ms?: number;
}
