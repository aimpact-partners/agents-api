export class Utils {
	/**
	 * Converts 32-bit float data to 16-bit integers
	 */
	static floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
		const buffer = new ArrayBuffer(float32Array.length * 2);
		const view = new DataView(buffer);
		let offset = 0;
		for (let i = 0; i < float32Array.length; i++, offset += 2) {
			let s = Math.max(-1, Math.min(1, float32Array[i]));
			view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		}
		return buffer;
	}
}
