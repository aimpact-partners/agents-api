# Audio Analysis Module

This module contains two TypeScript files, `constants.ts` and `index.ts`, which are used to analyze audio signals for
visualization purposes. The core focus is on frequency domain analysis of audio data, specifically providing insights
into frequency bands such as musical notes or voice frequencies.

## Files Overview

### 1. constants.ts

The `constants.ts` file defines frequency constants to help with visualization and mapping frequencies to
human-interpretable labels.

-   **Eighth Octave Frequencies**: This file contains a list of frequencies for the eighth musical octave.
-   **Note Frequencies**: Frequencies from the 1st to the 8th octave are calculated and stored as `noteFrequencies`
    along with their respective labels (`noteFrequencyLabels`).
-   **Voice Frequencies**: A subset of frequencies (`voiceFrequencies`) is also provided, representing the range of
    human vocal frequencies (32 Hz to 2000 Hz).

These constants are used to map frequency bins obtained from a Fast Fourier Transform (FFT) to familiar musical notes or
vocal ranges for easier interpretation.

### 2. index.ts

The `index.ts` file defines the `AudioAnalysis` class, which is responsible for analyzing audio data and providing
insights into the frequency domain for visualization.

#### AudioAnalysis Class

-   **Constructor**: The `AudioAnalysis` class can be instantiated with an `HTMLAudioElement` and an optional
    `AudioBuffer`. The constructor sets up an `AnalyserNode` for live audio analysis or an `OfflineAudioContext` for
    static analysis if an `AudioBuffer` is provided.

-   **Static Method `getFrequencies`**: This method is used to analyze the frequency domain data from an `AnalyserNode`.
    It returns human-readable frequency data, with support for different analysis types (`"frequency"`, `"music"`, or
    `"voice"`).

    -   **Parameters**: Includes the `AnalyserNode`, sample rate, FFT result, analysis type, minimum decibels, and
        maximum decibels.
    -   **Output**: Returns an object (`AudioAnalysisOutputType`) containing the amplitude values (normalized between 0
        and 1), the frequencies, and corresponding labels.

-   **Instance Method `getFrequencies`**: This instance method returns the current frequency data for the audio element,
    using the same processing as the static method.

-   **Instance Method `resumeIfSuspended`**: This method resumes the `AudioContext` if it is suspended, which can happen
    due to browser policies on user interaction.

-   **Global Exposure**: The `AudioAnalysis` class is made available globally using `globalThis`, allowing for easy
    instantiation from other scripts.

## Usage

### Prerequisites

-   **HTMLAudioElement**: An audio element from the DOM is required for analysis.
-   **AudioContext**: Uses the Web Audio API to create an `AnalyserNode` for frequency domain analysis.

### Example

```typescript
import { AudioAnalysis } from '@aimpact/agents-api/realtime/wav-tools/audio-analysis';

// Create an instance of AudioAnalysis for an HTMLAudioElement
const audioElement = document.querySelector('audio') as HTMLAudioElement;
const audioAnalysis = new AudioAnalysis(audioElement);

// Analyze frequency data
const frequencies = audioAnalysis.getFrequencies('music');
console.log(frequencies);

// Resume context if needed
audioAnalysis.resumeIfSuspended();
```

This example shows how to create an `AudioAnalysis` instance from an HTML `<audio>` element, get the frequency data, and
resume the context if it is suspended.

## Features

-   **Real-Time Analysis**: Analyze live audio played through an HTML audio element.
-   **Offline Buffer Analysis**: If an `AudioBuffer` is provided, analyze audio without requiring live playback.
-   **Frequency Labels**: Get human-readable labels for frequencies, making it easier to map audio data to musical notes
    or vocal frequencies.
-   **Decibel Normalization**: Normalize the frequency amplitude values to a range of 0-1, simplifying visualization.

## Use Cases

-   **Music Visualization**: Analyze music and visualize its frequency components (e.g., treble, mid, bass).
-   **Voice Analysis**: Identify the frequency components of the human voice.
-   **Audio Analysis Tools**: Develop audio analysis tools for musicians or educators to better understand audio
    content.

## Dependencies

-   **Web Audio API**: The project relies on the Web Audio API to create `AudioContext`, `AnalyserNode`, and handle FFT
    for frequency analysis.
-   **TypeScript**: Type annotations and type safety are used throughout the project.

## Running the Project

1. **Install Dependencies**: Ensure you have a TypeScript environment set up.
2. **Compile**: Use `tsc` to compile the TypeScript files.
3. **Run**: Include the compiled JavaScript in your HTML and create instances of `AudioAnalysis` as needed.
