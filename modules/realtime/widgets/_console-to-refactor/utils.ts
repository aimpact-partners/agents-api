export class Utils {
	/**
	 * Utility for formatting the timing of logs
	 */
	formatTime = useCallback((timestamp: string) => {
		const startTime = startTimeRef.current;
		const t0 = new Date(startTime).valueOf();
		const t1 = new Date(timestamp).valueOf();
		const delta = t1 - t0;
		const hs = Math.floor(delta / 10) % 100;
		const s = Math.floor(delta / 1000) % 60;
		const m = Math.floor(delta / 60_000) % 60;
		const pad = (n: number) => {
			let s = n + '';
			while (s.length < 2) {
				s = '0' + s;
			}
			return s;
		};
		return `${pad(m)}:${pad(s)}.${pad(hs)}`;
	}, []);
}
