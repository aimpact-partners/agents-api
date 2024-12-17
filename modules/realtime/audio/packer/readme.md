# WavPacker TypeScript Module

The `WavPacker` module is a utility that allows you to assemble raw PCM audio data into a WAV format file. It is
particularly useful for working with audio in browsers and creating WAV files that can be saved or played back easily.

## Files Overview

### 1. index.ts

This file defines the `WavPacker` class and an associated interface, `WavPackerAudioType`, which are used to convert raw
audio data into a `.wav` file format.

#### WavPackerAudioType Interface

The `WavPackerAudioType` interface represents the output structure when packing audio data into a WAV file.

-   **Properties**:
    -   `blob`: A `Blob` representation of the audio data.
    -   `url`: A URL representing the `Blob`, which can be used for playback.
    -   `channelCount`: Number of audio channels (e.g., mono or stereo).
    -   `sampleRate`: The sample rate of the audio (e.g., 44100 Hz).
    -   `duration`: Duration of the audio in seconds.

#### WavPacker Class

The `WavPacker` class provides various methods to assemble audio data into a WAV format:

-   **`floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer`**:

    -   Converts a `Float32Array` of audio amplitude values into an `ArrayBuffer` in `Int16Array` format.
    -   **Purpose**: WAV files generally use 16-bit PCM data, while JavaScript often handles audio in `Float32` format.
        This method converts the format for compatibility with WAV.

-   **`mergeBuffers(leftBuffer: ArrayBuffer, rightBuffer: ArrayBuffer): ArrayBuffer`**:

    -   Concatenates two `ArrayBuffer` objects and returns a single merged buffer.
    -   **Purpose**: Useful for combining different audio segments or channels.

-   **`_packData(size: number, arg: number): Uint8Array`** (Private Method):

    -   Packs a value into a `Uint8Array` format based on the size parameter (2 or 4 bytes).
    -   **Purpose**: Helps construct the WAV file header by correctly packing numerical data.

-   **`pack(sampleRate: number, audio: { bitsPerSample: number; channels: Float32Array[]; data: Int16Array; }): WavPackerAudioType`**:

    -   Packs the provided audio data into a WAV `Blob`.
    -   **Parameters**:
        -   `sampleRate`: The sample rate of the audio (e.g., 44100 Hz).
        -   `audio`: An object containing `bitsPerSample`, `channels`, and `data`.
    -   **Returns**: A `WavPackerAudioType` object that includes the packed WAV `blob`, a `url` for the blob, and
        details like `channelCount`, `sampleRate`, and `duration`.

-   **Global Exposure**: The `WavPacker` class is exposed globally using `globalThis` for easy access in the browser
    environment.

## Usage

### Prerequisites

-   **JavaScript Environment**: This module is designed for use in web browsers, where the Web Audio API is available.

### Example Usage

#### Example 1: Packing Raw Audio Data to WAV

```typescript
import { WavPacker } from '@aimpact/agents-api/realtime/wav-tools/packer';

// Sample audio data
const sampleRate = 44100;
// Example audio data for a single channel, represented as a Float32Array
const float32AudioData = new Float32Array([0.5, -0.5, 0.5, -0.5]);
// Convert Float32Array to Int16Array
const int16Data = new Int16Array(float32AudioData.map(value => Math.max(-1, Math.min(1, value)) * 0x7fff));

const channels: Float32Array[] = [float32AudioData]; // Example data for a single channel
const bitsPerSample = 16;

const audio = { bitsPerSample, channels, data: int16Data };

// Create WAV file
const wavPacker = new WavPacker();
const packedAudio = wavPacker.pack(sampleRate, audio);

// Use the URL to play the audio
const audioElement = document.createElement('audio');
audioElement.src = packedAudio.url;
audioElement.controls = true;
document.body.appendChild(audioElement);
```

#### Example 2: Recording Microphone Audio and Saving as WAV

This example demonstrates how to use the `WavPacker` to convert microphone input into a WAV file.

```typescript
import { WavPacker } from '@aimpact/agents-api/realtime/wav-tools/packer';

// Get access to the user's microphone
navigator.mediaDevices
	.getUserMedia({ audio: true })
	.then(stream => {
		const audioContext = new AudioContext();
		const source = audioContext.createMediaStreamSource(stream);
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 4096;
		source.connect(analyser);

		const float32AudioData: Float32Array[] = [];

		// Function to capture audio data in chunks
		const captureAudio = () => {
			const buffer = new Float32Array(analyser.fftSize);
			analyser.getFloatTimeDomainData(buffer);
			float32AudioData.push(buffer);
			requestAnimationFrame(captureAudio);
		};

		captureAudio();

		// Stop recording after 5 seconds and convert to WAV
		setTimeout(() => {
			stream.getTracks().forEach(track => track.stop()); // Stop the microphone

			// Convert collected audio data to Int16Array
			const combinedData = float32AudioData.reduce((acc, val) => {
				const newData = new Float32Array(acc.length + val.length);
				newData.set(acc);
				newData.set(val, acc.length);
				return newData;
			}, new Float32Array());

			const int16Data = new Int16Array(combinedData.map(value => Math.max(-1, Math.min(1, value)) * 0x7fff));

			const channels: Float32Array[] = [combinedData];
			const bitsPerSample = 16;
			const sampleRate = audioContext.sampleRate;

			const audio = { bitsPerSample, channels, data: int16Data };

			// Create WAV file
			const wavPacker = new WavPacker();
			const packedAudio = wavPacker.pack(sampleRate, audio);

			// Use the URL to play the audio
			const audioElement = document.createElement('audio');
			audioElement.src = packedAudio.url;
			audioElement.controls = true;
			document.body.appendChild(audioElement);
		}, 5000); // Record for 5 seconds
	})
	.catch(error => {
		console.error('Error accessing microphone:', error);
	});
```

### Features

-   **PCM to WAV Conversion**: Converts raw audio data in PCM format to a WAV file that can be easily played or saved.
-   **Data Conversion**: Handles conversions from `Float32` to `Int16`, ensuring compatibility with WAV audio
    requirements.
-   **Buffer Merging**: Supports merging different `ArrayBuffer` objects for ease of handling multiple audio segments.
-   **Browser-Friendly**: Outputs a `Blob` and a URL for immediate playback in the browser.

## Use Cases

-   **Audio Recording**: Convert recorded audio data into a WAV file for easy storage and sharing.
-   **Audio Generation**: Generate audio programmatically and export it as a standard WAV file.
-   **Audio Manipulation**: Merge and manipulate different audio data segments and export as a WAV file.
