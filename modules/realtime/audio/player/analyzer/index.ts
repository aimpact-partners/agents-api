import { noteFrequencies, noteFrequencyLabels, voiceFrequencies, voiceFrequencyLabels } from './constants';

type AnalysisType = 'frequency' | 'music' | 'voice';

/**
 * Output of AudioAnalyzer for the frequency domain of the audio
 */
export interface AudioAnalyzerOutputType {
	values: Float32Array; // Amplitude of this frequency between {0, 1} inclusive
	frequencies: number[]; // Raw frequency bucket values
	labels: string[]; // Labels for the frequency bucket values
}

/**
 * Analyzes audio for visual output
 */
export /*bundle*/ class AudioAnalyzer {
	private fftResults: Float32Array[];
	private audio: HTMLAudioElement;
	private context: AudioContext | OfflineAudioContext;
	private analyser: AnalyserNode;
	private sampleRate: number;
	private audioBuffer: AudioBuffer | null;

	constructor(audioElement: HTMLAudioElement, audioBuffer: AudioBuffer | null = null) {
		this.fftResults = [];
		this.audio = audioElement;
		this.audioBuffer = audioBuffer;

		if (audioBuffer) {
			const { length, sampleRate } = audioBuffer;
			const offlineAudioContext = new OfflineAudioContext({ length, sampleRate });
			const source = offlineAudioContext.createBufferSource();
			source.buffer = audioBuffer;
			const analyser = offlineAudioContext.createAnalyser();
			analyser.fftSize = 8192;
			analyser.smoothingTimeConstant = 0.1;
			source.connect(analyser);
			const renderQuantumInSeconds = 1 / 60;
			const durationInSeconds = length / sampleRate;

			const analyze = (index: number) => {
				const suspendTime = renderQuantumInSeconds * index;
				if (suspendTime < durationInSeconds) {
					offlineAudioContext.suspend(suspendTime).then(() => {
						const fftResult = new Float32Array(analyser.frequencyBinCount);
						analyser.getFloatFrequencyData(fftResult);
						this.fftResults.push(fftResult);
						analyze(index + 1);
					});
				}
				if (index === 1) {
					offlineAudioContext.startRendering();
				} else {
					offlineAudioContext.resume();
				}
			};

			source.start(0);
			analyze(1);
			this.context = offlineAudioContext;
			this.analyser = analyser;
			this.sampleRate = sampleRate;
		} else {
			const audioContext = new AudioContext();
			const track = audioContext.createMediaElementSource(audioElement);
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 8192;
			analyser.smoothingTimeConstant = 0.1;
			track.connect(analyser);
			analyser.connect(audioContext.destination);
			this.context = audioContext;
			this.analyser = analyser;
			this.sampleRate = this.context.sampleRate;
		}
	}

	/**
	 * Retrieves frequency domain data from an AnalyserNode adjusted to a decibel range
	 * returns human-readable formatting and labels
	 */
	static getFrequencies(
		analyser: AnalyserNode,
		sampleRate: number,
		fftResult: Float32Array | null = null,
		analysisType: AnalysisType = 'frequency',
		minDecibels: number = -100,
		maxDecibels: number = -30
	): AudioAnalyzerOutputType {
		if (!fftResult) {
			fftResult = new Float32Array(analyser.frequencyBinCount);
			analyser.getFloatFrequencyData(fftResult);
		}
		const nyquistFrequency = sampleRate / 2;
		const frequencyStep = (1 / fftResult.length) * nyquistFrequency;
		let outputValues: number[];
		let frequencies: number[];
		let labels: string[];

		if (analysisType === 'music' || analysisType === 'voice') {
			const useFrequencies = analysisType === 'voice' ? voiceFrequencies : noteFrequencies;
			const aggregateOutput = Array(useFrequencies.length).fill(minDecibels);
			for (let i = 0; i < fftResult.length; i++) {
				const frequency = i * frequencyStep;
				const amplitude = fftResult[i];
				for (let n = useFrequencies.length - 1; n >= 0; n--) {
					if (frequency > useFrequencies[n]) {
						aggregateOutput[n] = Math.max(aggregateOutput[n], amplitude);
						break;
					}
				}
			}
			outputValues = aggregateOutput;
			frequencies = useFrequencies;
			labels = analysisType === 'voice' ? voiceFrequencyLabels : noteFrequencyLabels;
		} else {
			outputValues = Array.from(fftResult);
			frequencies = outputValues.map((_, i) => frequencyStep * i);
			labels = frequencies.map(f => `${f.toFixed(2)} Hz`);
		}

		const normalizedOutput = outputValues.map(v => {
			return Math.max(0, Math.min((v - minDecibels) / (maxDecibels - minDecibels), 1));
		});
		const values = new Float32Array(normalizedOutput);
		return { values, frequencies, labels };
	}

	/**
	 * Gets the current frequency domain data from the playing audio track
	 */
	getFrequencies(
		analysisType: AnalysisType = 'frequency',
		minDecibels: number = -100,
		maxDecibels: number = -30
	): AudioAnalyzerOutputType {
		let fftResult: Float32Array | null = null;
		if (this.audioBuffer && this.fftResults.length) {
			const pct = this.audio.currentTime / this.audio.duration;
			const index = Math.min((pct * this.fftResults.length) | 0, this.fftResults.length - 1);
			fftResult = this.fftResults[index];
		}
		return AudioAnalyzer.getFrequencies(
			this.analyser,
			this.sampleRate,
			fftResult,
			analysisType,
			minDecibels,
			maxDecibels
		);
	}

	/**
	 * Resume the internal AudioContext if it was suspended due to the lack of
	 * user interaction when the AudioAnalyzer was instantiated.
	 */
	async resumeIfSuspended(): Promise<true> {
		if (this.context.state === 'suspended') {
			await this.context.resume();
		}
		return true;
	}
}
