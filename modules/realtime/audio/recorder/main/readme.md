# WavRecorder TypeScript Module

The `WavRecorder` module provides a utility class for recording live audio from the user's microphone and saving it as a
**WAV** file. It is particularly useful for building web applications that need a voice recording feature, such as voice
memos, podcasts, or audio notes.

## Features

-   **Real-Time Microphone Recording**: Captures live audio input from the user's microphone.
-   **Audio Processing with AudioWorklet**: Utilizes the `AudioProcessor` worklet to process audio chunks in real-time.
-   **WAV File Export**: Converts raw audio to a WAV format that can be saved or played back.
-   **Custom Chunk Processing**: Allows custom processing of audio chunks during the recording.
-   **Audio Analysis**: Provides the ability to extract frequency domain data for further analysis.

## Installation

To use the `WavRecorder` module, include the required files in your project and ensure you have the necessary
dependencies for working with TypeScript and the Web Audio API.

## Usage

### Prerequisites

-   **Browser Compatibility**: Make sure your application is running in a browser that supports the Web Audio API and
    AudioWorklets.
-   **Microphone Access**: Your application must request permission from the user to access their microphone.

### Example Code

The following example demonstrates how to use the `WavRecorder` class to record audio from the user's microphone and
save it as a WAV file.

```typescript
import { WavRecorder } from '@aimpact/agents-api/realtime/wav-tools/recorder';

(async () => {
	const recorder = new WavRecorder({ sampleRate: 44100, debug: true });

	try {
		// Begin recording session (request microphone permissions)
		await recorder.begin();

		// Start recording and process each chunk
		await recorder.record(data => {
			console.log('Audio chunk received:', data);
		});

		// Record for 5 seconds
		setTimeout(async () => {
			// Pause the recording
			await recorder.pause();

			// Save the recording as a WAV file
			const wavFile = await recorder.end();

			// Create an audio element to play the recorded audio
			const audioElement = document.createElement('audio');
			audioElement.src = wavFile.url;
			audioElement.controls = true;
			document.body.appendChild(audioElement);
		}, 5000);
	} catch (error) {
		console.error('Error recording audio:', error);
	}
})();
```

### Methods

-   **`begin(deviceId?: string): Promise<true>`**

    -   Begins a new recording session by requesting access to the microphone and setting up the necessary audio nodes.

-   **`record(chunkProcessor?: (data: { mono: ArrayBuffer; raw: ArrayBuffer }) => any, chunkSize?: number): Promise<true>`**

    -   Starts recording audio from the connected microphone stream. The `chunkProcessor` function can be used to handle
        audio chunks as they are received.

-   **`pause(): Promise<true>`**

    -   Pauses the recording while keeping the microphone stream open.

-   **`end(): Promise<WavPackerAudioType>`**

    -   Ends the current recording session and saves the recorded audio as a WAV file.

-   **`getStatus(): 'ended' | 'paused' | 'recording'`**

    -   Returns the current status of the recording.

-   **`getSampleRate(): number`**
    -   Returns the sample rate used for recording.

## Dependencies

-   **AudioProcessorSrc**: An AudioWorklet script used for processing audio in real-time.
-   **AudioAnalysis**: A utility for analyzing audio data and extracting useful frequency information.
-   **WavPacker**: Converts recorded audio data (raw PCM) into a WAV file that can be saved or played back.

## Error Handling

The `WavRecorder` class includes various error checks to ensure that methods are called in the correct order, such as:

-   Ensuring the recording session has begun before attempting to record.
-   Preventing multiple active recording sessions.
-   Handling cases where the user denies microphone access.

## Use Cases

-   **Voice Recording Applications**: Create voice memos or audio notes for users to record and save their voices.
-   **Podcast Tools**: Record audio segments for podcast creation.
-   **Audio Analysis**: Capture audio and analyze the frequency domain data for educational or entertainment purposes.
