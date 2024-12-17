# Audio Worklet Processor

This project contains an audio worklet processor built with TypeScript. This module is consumed by
`audioContext.audioWorklet.addModule`, which loads the audio worklet as a separate module on the audio rendering thread,
ensuring low-latency and real-time audio processing. This setup compiles the worklet with ESBuild as a standalone bundle
to avoid conflicts with SystemJS, which is used for the rest of the application’s modules. It ensures the worklet runs
independently and efficiently, maintaining compatibility and performance.

## Setup

1. Navigate to the `source` folder.
2. Install dependencies:

    ```bash
    npm install
    ```

## Build

To compile the worklet, run:

```bash
npm run build
```

The bundled file will be output as `processor.js` in the parent directory.

## Notes

-   The output file (`processor.js`) will be placed one level up from `source`.
