import type { IChannelSettings } from '@aimpact/agents-api/realtime/channel';
import { RealtimeEventHandler } from '@aimpact/agents-api/realtime/event-handler';
import { RealtimeUtils } from '@aimpact/agents-api/realtime/utils';
import { RealtimeAPI } from '@aimpact/agents-api/realtime/ws';
import { RealtimeConversation } from './conversation';

// RealtimeClient Class to manage real-time communication
export /*bundle*/ class RealtimeClient extends RealtimeEventHandler {
	private defaultSessionConfig: SessionResourceType;
	private sessionConfig: SessionResourceType;
	private transcriptionModels: AudioTranscriptionType[];
	private defaultServerVadConfig: TurnDetectionServerVadType;
	private realtime: RealtimeAPI;
	private conversation: RealtimeConversation;
	private sessionCreated: boolean;
	private tools: { [key: string]: { definition: ToolDefinitionType; handler: Function } };
	private inputAudioBuffer: Int16Array;

	constructor({ url, apiKey, dangerouslyAllowAPIKeyInBrowser }: IChannelSettings) {
		super();

		// Initialize default session configuration
		this.defaultSessionConfig = {
			modalities: ['text', 'audio'],
			instructions: '',
			voice: 'alloy',
			input_audio_format: 'pcm16',
			output_audio_format: 'pcm16',
			input_audio_transcription: null,
			turn_detection: null,
			tools: [],
			tool_choice: 'auto',
			temperature: 0.8,
			max_response_output_tokens: 4096
		};

		this.sessionConfig = {};
		this.transcriptionModels = [{ model: 'whisper-1' }];
		this.defaultServerVadConfig = {
			type: 'server_vad',
			threshold: 0.5,
			prefix_padding_ms: 300,
			silence_duration_ms: 200
		};

		// Create RealtimeAPI instance with provided settings
		this.realtime = new RealtimeAPI({
			url,
			apiKey,
			dangerouslyAllowAPIKeyInBrowser
		});

		this.conversation = new RealtimeConversation();
		this._resetConfig();
		this._addAPIEventHandlers();
	}

	// Reset session configuration to default
	private _resetConfig(): true {
		this.sessionCreated = false;
		this.tools = {};
		this.sessionConfig = JSON.parse(JSON.stringify(this.defaultSessionConfig));
		this.inputAudioBuffer = new Int16Array(0);
		return true;
	}

	// Add event handlers for real-time API events
	private _addAPIEventHandlers(): true {
		// Handle client-side events and dispatch them for listeners
		this.realtime.on('client.*', event => {
			const realtimeEvent = {
				time: new Date().toISOString(),
				source: 'client',
				event: event
			};
			this.dispatch('realtime.event', realtimeEvent);
		});

		// Handle server-side events and dispatch them for listeners
		this.realtime.on('server.*', event => {
			const realtimeEvent = {
				time: new Date().toISOString(),
				source: 'server',
				event: event
			};
			this.dispatch('realtime.event', realtimeEvent);
		});

		// Set sessionCreated to true when session is successfully created
		this.realtime.on('server.session.created', () => (this.sessionCreated = true));

		return true;
	}

	// Check if WebSocket is connected
	isConnected(): boolean {
		return this.realtime.isConnected();
	}

	// Reset the client and clear configurations
	reset(): true {
		this.disconnect();
		this.clearEventHandlers();
		this.realtime.clearEventHandlers();
		this._resetConfig();
		this._addAPIEventHandlers();
		return true;
	}

	// Connect to the real-time API server
	async connect(): Promise<true> {
		if (this.isConnected()) {
			throw new Error(`Already connected, use .disconnect() first`);
		}

		await this.realtime.connect();
		this.updateSession();
		return true;
	}

	// Wait for session to be created
	async waitForSessionCreated(): Promise<true> {
		if (!this.isConnected()) {
			throw new Error(`Not connected, use .connect() first`);
		}
		while (!this.sessionCreated) {
			await new Promise<void>(r => setTimeout(() => r(), 1));
		}
		return true;
	}

	// Disconnect from the server and reset the conversation
	disconnect(): void {
		this.sessionCreated = false;
		this.realtime.isConnected() && this.realtime.disconnect();
		this.conversation.clear();
	}

	// Update session settings and notify the server
	updateSession(sessionConfig: SessionResourceType = {}): true {
		Object.assign(this.sessionConfig, sessionConfig);
		// Combine existing tools with new tools from sessionConfig
		const useTools = [].concat(
			(sessionConfig.tools || []).map(toolDefinition => {
				const definition = {
					type: 'function',
					...toolDefinition
				};
				if (this.tools[definition?.name]) {
					throw new Error(`Tool "${definition?.name}" has already been defined`);
				}
				return definition;
			}),
			Object.keys(this.tools).map(key => {
				return {
					type: 'function',
					...this.tools[key].definition
				};
			})
		);
		this.sessionConfig.tools = useTools;
		if (this.realtime.isConnected()) {
			this.realtime.send('session.update', { session: this.sessionConfig });
		}
		return true;
	}

	// Send user message content to the server
	sendUserMessageContent(content: ContentType[] = []): true {
		if (content.length) {
			for (const c of content) {
				if (c.type === 'input_audio') {
					if (c.audio instanceof ArrayBuffer || c.audio instanceof Int16Array) {
						c.audio = RealtimeUtils.arrayBufferToBase64(c.audio);
					}
				}
			}
			this.realtime.send('conversation.item.create', {
				item: {
					type: 'message',
					role: 'user',
					content
				}
			});
		}
		this.createResponse();
		return true;
	}

	// Create a response from the server
	createResponse(): true {
		if (this.getTurnDetectionType() === null && this.inputAudioBuffer.byteLength > 0) {
			this.realtime.send('input_audio_buffer.commit');
			this.conversation.queueInputAudio(this.inputAudioBuffer);
			this.inputAudioBuffer = new Int16Array(0);
		}
		this.realtime.send('response.create');
		return true;
	}

	// Get the type of turn detection being used
	getTurnDetectionType(): 'server_vad' | null {
		return this.sessionConfig.turn_detection?.type || null;
	}
}
