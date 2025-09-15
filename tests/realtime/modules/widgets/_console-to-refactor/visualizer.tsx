import { AudioRenderer } from '@aimpact/agents-api/realtime/audio/renderer';
import React, { useEffect, useRef } from 'react';

export default function Visualizer() {
	const refs = {
		canvas: {
			client: useRef<HTMLCanvasElement>(null), // Rendering audio visualization (canvas)
			server: useRef<HTMLCanvasElement>(null) // Rendering audio visualization (canvas)
		}
	};

	/**
	 * Set up render loops for the visualization canvas
	 */
	useEffect(() => {
		let isLoaded = true;

		const recorder = refs.recorder.current;
		const canvas = { client: refs.canvas.client.current, server: refs.canvas.server.current };
		const context: { client: CanvasRenderingContext2D | null; server: CanvasRenderingContext2D | null } = {
			client: null,
			server: null
		};
		const player = refs.player.current;

		const render = () => {
			if (isLoaded) {
				if (canvas.client) {
					if (!canvas.client.width || !canvas.client.height) {
						canvas.client.width = canvas.client.offsetWidth;
						canvas.client.height = canvas.client.offsetHeight;
					}
					context.client = context.client || canvas.client.getContext('2d');
					if (context.client) {
						context.client.clearRect(0, 0, canvas.client.width, canvas.client.height);
						const result = recorder.recording
							? recorder.getFrequencies('voice')
							: { values: new Float32Array([0]) };
						AudioRenderer.drawBars(canvas.client, context.client, result.values, '#0099ff', 10, 0, 8);
					}
				}
				if (canvas.server) {
					if (!canvas.server.width || !canvas.server.height) {
						canvas.server.width = canvas.server.offsetWidth;
						canvas.server.height = canvas.server.offsetHeight;
					}

					context.server = context.server || canvas.server.getContext('2d');
					if (context.server) {
						context.server.clearRect(0, 0, canvas.server.width, canvas.server.height);
						const result = player.analyzer
							? player.getFrequencies('voice')
							: { values: new Float32Array([0]) };

						AudioRenderer.drawBars(canvas.server, context.server, result.values, '#009900', 10, 0, 8);
					}
				}
				window.requestAnimationFrame(render);
			}
		};
		render();

		return () => {
			isLoaded = false;
		};
	}, []);

	return (
		<div className="visualization">
			<div className="visualization-entry client">
				<canvas ref={refs.canvas.client} />
			</div>
			<div className="visualization-entry server">
				<canvas ref={refs.canvas.server} />
			</div>
		</div>
	);
}
