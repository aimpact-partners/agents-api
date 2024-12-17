import type { ITool, ToolChoiceType } from './tool';
import type { AudioFormatType } from './audio-format';
import type { VoicesType } from './voices';
import type { IInputAudioTranscription } from './audio-transcription';
import type { ITurnDetectionServer } from './turn-detection';

export /*bundle*/ interface IResponse {
	// The set of modalities the model can respond with. To disable audio, set this to ["text"].
	modalities: 'text' | 'audio'[];

	// The system instructions prepended to model calls.
	instructions: string;

	// The voice the model uses to respond. Cannot be changed once the model has responded with audio at least once.
	voice: VoicesType;

	// The format of output audio. Options are "pcm16", "g711_ulaw", or "g711_alaw".
	output_audio_format: AudioFormatType;

	// Tools (functions) available to the model.
	tools: ITool[];

	// How the model chooses tools. Options are "auto", "none", "required", or specify a function.
	tool_choice: ToolChoiceType;

	// Sampling temperature for the model.
	temperature: number;

	// Maximum number of output tokens for a single assistant response, inclusive of tool calls.
	// Provide an integer between 1 and 4096 to limit output tokens,
	// or "inf" for the maximum available tokens for a given model. Defaults to "inf".
	max_output_tokens?: number | 'inf';
}

export /*bundle*/ interface ISession extends IResponse {
	// The format of input audio. Options are "pcm16", "g711_ulaw", or "g711_alaw".
	input_audio_format: AudioFormatType;

	// Configuration for input audio transcription. Can be set to null to turn off.
	input_audio_transcription?: IInputAudioTranscription;

	// Configuration for turn detection. Can be set to null to turn off.
	turn_detection: ITurnDetectionServer;
}
