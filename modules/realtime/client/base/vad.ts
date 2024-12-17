import type { IVoiceAudioDetection } from '@aimpact/agents-api/realtime/agents/base';
import type { ClientSessionBase } from '.';

export class VoiceAudioDetection {
	#session: ClientSessionBase;

	#value?: IVoiceAudioDetection;

	get activated(): boolean {
		return !!this.#value;
	}

	constructor(session: ClientSessionBase, value: IVoiceAudioDetection) {
		this.#session = session;
		this.#value = value;
	}

	async fetch() {}

	/**
	 * Switch between Manual <> VAD mode for communication
	 */
	async active(value: boolean) {
		const { recorder } = this.#session;
		!value && recorder.status === 'recording' && (await recorder.pause());

		// agent.updateSession({
		// 	turn_detection: value === 'none' ? null : { type: 'server_vad' }
		// });

		// if (value === 'server_vad' && agent.connected) {
		// 	await recorder.record(data => client.appendInputAudio(data.mono));
		// }
	}
}
