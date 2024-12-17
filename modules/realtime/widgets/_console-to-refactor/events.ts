/**
 * Core RealtimeClient and audio capture setup
 * Set all of our instructions, tools, events and more
 */
useEffect(() => {
	// Get refs
	const wavStreamPlayer = wavStreamPlayerRef.current;
	const client = clientRef.current;

	// Set instructions
	client.updateSession({ instructions });
	// Set transcription, otherwise we don't get user transcriptions back
	client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });

	// handle realtime events from client + server for event logging
	client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
		setRealtimeEvents(realtimeEvents => {
			const lastEvent = realtimeEvents[realtimeEvents.length - 1];
			if (lastEvent?.event.type === realtimeEvent.event.type) {
				// if we receive multiple events in a row, aggregate them for display purposes
				lastEvent.count = (lastEvent.count || 0) + 1;
				return realtimeEvents.slice(0, -1).concat(lastEvent);
			} else {
				return realtimeEvents.concat(realtimeEvent);
			}
		});
	});
	client.on('error', (event: any) => console.error(event));
	client.on('conversation.interrupted', async () => {
		const trackSampleOffset = await wavStreamPlayer.interrupt();
		if (trackSampleOffset?.trackId) {
			const { trackId, offset } = trackSampleOffset;
			await client.cancelResponse(trackId, offset);
		}
	});
	client.on('conversation.updated', async ({ item, delta }: any) => {
		const items = client.conversation.getItems();
		if (delta?.audio) {
			wavStreamPlayer.add16BitPCM(delta.audio, item.id);
		}
		if (item.status === 'completed' && item.formatted.audio?.length) {
			const wavFile = await WavRecorder.decode(item.formatted.audio, 24000, 24000);
			item.formatted.file = wavFile;
		}
		setItems(items);
	});

	setItems(client.conversation.getItems());

	return () => {
		// cleanup; resets to defaults
		client.reset();
	};
}, []);
