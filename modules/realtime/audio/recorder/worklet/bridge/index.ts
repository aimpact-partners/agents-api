import { WorkletBridge } from '@aimpact/agents-api/realtime/audio/worklet-bridge';

export /*bundle*/ class RecorderWorkletBridge extends WorkletBridge {
	constructor(context: AudioContext, timeout?: number) {
		super(
			context,
			'recorder_processor',
			'/packages/@aimpact/agents-api@0.4.0/realtime/audio/recorder/worklet/processor/index.js',
			timeout
		);
	}
}
