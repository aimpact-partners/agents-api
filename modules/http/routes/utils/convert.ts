import * as ffmpeg from 'fluent-ffmpeg';
import {PendingPromise} from '@beyond-js/kernel/core';
import {promises as fs} from 'fs';

export async function convertFile(inputFilePath: string, outputFormat: string): Promise<string> {
	const promise = new PendingPromise();
	// output file path will be the same as the input file path but with a different extension
	const outputFilePath = `${inputFilePath.split('.')[0]}.${outputFormat}`;

	ffmpeg(inputFilePath)
		.output(outputFilePath)
		.on('end', async () => {
			// Delete the original file
			await fs.unlink(inputFilePath);
			promise.resolve(outputFilePath);
		})
		.on('error', async err => {
			console.error(err);
			promise.reject(err);
		})
		.run();

	return promise as Promise<string>;
}
