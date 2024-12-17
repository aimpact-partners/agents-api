import { WorkletBridge } from '@aimpact/agents-api/realtime/audio/worklet-bridge';

export /*bundle*/ interface IPlayerWorkletConfig {}

export /*bundle*/ class StreamWorkletBridge extends WorkletBridge {
	constructor(context: AudioContext, timeout?: number) {
		super(context, 'stream_processor', './realtime/audio/player/worklet/processor/index.js', timeout);
	}
}
