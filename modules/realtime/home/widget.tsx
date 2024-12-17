import * as React from 'react';
import { Channel } from '@aimpact/agents-api/realtime/channel';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';

import { Header } from './header';
import { EventsLog } from './events-log';
import { ConversationLog } from './conversation-log';
import { ActionsPanel } from './actions-panel';
import { WeatherPanel } from './weather-panel';
import { MemoryPanel } from './memory-panel';

const { useRef, useState, useEffect, useCallback } = React;

const apiKey = localStorage.getItem('openai-key');
const channel = new Channel({ apiKey, dangerouslyAllowAPIKeyInBrowser: true });
channel.connect();

const Widget: React.FC = () => {
	const LOCAL_RELAY_SERVER_URL = process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';

	const [apiKey, setApiKey] = useState<string>(
		LOCAL_RELAY_SERVER_URL ? '' : localStorage.getItem('tmp::voice_api_key') || prompt('OpenAI API Key') || ''
	);

	const wavRecorderRef = useRef<WavRecorder>(new WavRecorder({ sampleRate: 24000 }));
	const wavStreamPlayerRef = useRef<WavStreamPlayer>(new WavStreamPlayer({ sampleRate: 24000 }));
	const clientRef = useRef<RealtimeClient>(
		new RealtimeClient(
			LOCAL_RELAY_SERVER_URL
				? { url: LOCAL_RELAY_SERVER_URL }
				: {
						apiKey: apiKey,
						dangerouslyAllowAPIKeyInBrowser: true
				  }
		)
	);

	const [items, setItems] = useState<any[]>([]);
	const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
	const [expandedEvents, setExpandedEvents] = useState<{ [key: string]: boolean }>({});
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [canPushToTalk, setCanPushToTalk] = useState<boolean>(true);
	const [isRecording, setIsRecording] = useState<boolean>(false);
	const [memoryKv, setMemoryKv] = useState<{ [key: string]: any }>({});
	const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 37.775593, lng: -122.418137 });
	const [marker, setMarker] = useState<{
		lat: number;
		lng: number;
		location?: string;
		temperature?: any;
		wind_speed?: any;
	} | null>(null);

	useEffect(() => {
		if (apiKey) {
			localStorage.setItem('tmp::voice_api_key', apiKey);
		}
	}, [apiKey]);

	const connectConversation = useCallback(async () => {
		const client = clientRef.current;
		const wavRecorder = wavRecorderRef.current;
		const wavStreamPlayer = wavStreamPlayerRef.current;

		setIsConnected(true);
		setRealtimeEvents([]);
		setItems(client.conversation.getItems());

		await wavRecorder.begin();
		await wavStreamPlayer.connect();
		await client.connect();
		client.sendUserMessageContent([{ type: `input_text`, text: `Hello!` }]);
	}, []);

	const disconnectConversation = useCallback(async () => {
		setIsConnected(false);
		setRealtimeEvents([]);
		setItems([]);
		setMemoryKv({});
		setCoords({ lat: 37.775593, lng: -122.418137 });
		setMarker(null);

		const client = clientRef.current;
		client.disconnect();

		const wavRecorder = wavRecorderRef.current;
		await wavRecorder.end();

		const wavStreamPlayer = wavStreamPlayerRef.current;
		await wavStreamPlayer.interrupt();
	}, []);

	const resetAPIKey = useCallback(() => {
		const newApiKey = prompt('OpenAI API Key');
		if (newApiKey !== null) {
			localStorage.clear();
			setApiKey(newApiKey);
			window.location.reload();
		}
	}, []);

	return (
		<div data-component="ConsolePage">
			<Header apiKey={apiKey} resetAPIKey={resetAPIKey} />
			<div className="content-main">
				<div className="content-logs">
					<EventsLog
						events={realtimeEvents}
						expandedEvents={expandedEvents}
						setExpandedEvents={setExpandedEvents}
					/>
					<ConversationLog items={items} deleteItem={id => clientRef.current.deleteItem(id)} />
					<ActionsPanel
						isConnected={isConnected}
						canPushToTalk={canPushToTalk}
						isRecording={isRecording}
						connectConversation={connectConversation}
						disconnectConversation={disconnectConversation}
						startRecording={() => setIsRecording(true)}
						stopRecording={() => setIsRecording(false)}
					/>
				</div>
				<div className="content-right">
					<WeatherPanel coords={coords} marker={marker} />
					<MemoryPanel memoryKv={memoryKv} />
				</div>
			</div>
		</div>
	);
};

export default Widget;
