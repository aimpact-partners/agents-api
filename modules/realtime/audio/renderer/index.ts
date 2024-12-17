import normalizeArray from './normalize-array';

export /*bundle*/ const AudioRenderer = {
	/**
	 * Renders a point-in-time snapshot of an audio sample, usually frequency values
	 * @param canvas
	 * @param ctx
	 * @param data
	 * @param color
	 * @param pointCount number of bars to render
	 * @param barWidth width of bars in px
	 * @param barSpacing spacing between bars in px
	 * @param center vertically center the bars
	 */
	drawBars: (
		canvas: HTMLCanvasElement,
		ctx: CanvasRenderingContext2D,
		data: Float32Array,
		color: string,
		pointCount: number = 0,
		barWidth: number = 0,
		barSpacing: number = 0,
		center: boolean = false
	) => {
		pointCount = Math.floor(
			Math.min(pointCount, (canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing))
		);
		if (!pointCount) {
			pointCount = Math.floor((canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing));
		}
		if (!barWidth) {
			barWidth = (canvas.width - barSpacing) / pointCount - barSpacing;
		}

		const points = normalizeArray(data, pointCount, true);
		for (let i = 0; i < pointCount; i++) {
			const amplitude = Math.abs(points[i]);
			const height = Math.max(1, amplitude * canvas.height);
			const x = barSpacing + i * (barWidth + barSpacing);
			const y = center ? (canvas.height - height) / 2 : canvas.height - height;
			ctx.fillStyle = color;
			ctx.fillRect(x, y, barWidth, height);
		}
	}
};
