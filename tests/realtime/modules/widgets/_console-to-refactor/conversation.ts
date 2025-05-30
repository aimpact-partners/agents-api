export class Conversation {
	/**
	 * Connect to conversation:
	 * WavRecorder taks speech input, WavStreamPlayer output, client is API client
	 */
	connectConversation = useCallback(async () => {
		const client = clientRef.current;
		const wavRecorder = wavRecorderRef.current;
		const wavStreamPlayer = wavStreamPlayerRef.current;

		// Set state variables
		startTimeRef.current = new Date().toISOString();
		setIsConnected(true);
		setRealtimeEvents([]);
		setItems(client.conversation.getItems());

		// Connect to microphone
		await wavRecorder.begin();

		// Connect to audio output
		await wavStreamPlayer.connect();

		// Connect to realtime API
		await client.connect();
		client.sendUserMessageContent([
			{
				type: `input_text`,
				text: `Hello!`
				// text: `For testing purposes, I want you to list ten car brands. Number each item, e.g. "one (or whatever number you are one): the item name".`
			}
		]);

		if (client.getTurnDetectionType() === 'server_vad') {
			await wavRecorder.record(data => client.appendInputAudio(data.mono));
		}
	}, []);

	/**
	 * Disconnect and reset conversation state
	 */
	disconnectConversation = useCallback(async () => {
		setIsConnected(false);
		setRealtimeEvents([]);
		setItems([]);
		setMemoryKv({});
		setCoords({
			lat: 37.775593,
			lng: -122.418137
		});
		setMarker(null);

		const client = clientRef.current;
		client.disconnect();

		const wavRecorder = wavRecorderRef.current;
		await wavRecorder.end();

		const wavStreamPlayer = wavStreamPlayerRef.current;
		await wavStreamPlayer.interrupt();
	}, []);

	deleteConversationItem = useCallback(async (id: string) => {
		const client = clientRef.current;
		client.deleteItem(id);
	}, []);
}
