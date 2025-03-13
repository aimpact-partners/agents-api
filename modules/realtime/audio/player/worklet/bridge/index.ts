import { WorkletBridge } from '@aimpact/agents-api/realtime/audio/worklet-bridge';
import config from '@aimpact/agents-api/config';

export /*bundle*/ interface IPlayerWorkletConfig {}

export /*bundle*/ class StreamWorkletBridge extends WorkletBridge {
	constructor(context: AudioContext, timeout?: number) {
		// super(context, 'stream_processor', './realtime/audio/player/worklet/processor/index.js', timeout);
		super(
			context,
			'stream_processor',
			`/packages/${config.package}@${config.version}/realtime/audio/player/worklet/processor/index.js`,
			timeout
		);
	}
}
