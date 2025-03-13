import { WorkletBridge } from '@aimpact/agents-api/realtime/audio/worklet-bridge';
import config from '@aimpact/agents-api/config';

export /*bundle*/ class RecorderWorkletBridge extends WorkletBridge {
	constructor(context: AudioContext, timeout?: number) {
		super(
			context,
			'recorder_processor',
			`/packages/${config.package}@${config.version}/realtime/audio/recorder/worklet/processor/index.js`,
			timeout
		);
	}
}
