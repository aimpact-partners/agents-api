import { Events } from '@beyond-js/events/events';
import { PendingPromise } from '@beyond-js/kernel/core';

export type IPermissionState = 'granted' | 'unknown' | 'denied' | 'prompt';

export const permissions = new (class MediaPermissions extends Events {
	#ready: PendingPromise<void>;
	get ready() {
		if (this.#ready) return this.#ready;

		this.#ready = new PendingPromise();

		// In some versions of TypeScript, the "microphone" permission is not
		// included by default in the allowed list of permission names.
		const name = 'microphone' as PermissionName;

		const permission = navigator.permissions?.query({ name });
		if (!(permission instanceof Promise)) {
			this.#ready.resolve();
			return;
		}

		permission
			.then(permission => {
				this.#permission = permission;
				permission.onchange = this.#onchange.bind(this);
				this.#ready.resolve();
			})
			.catch(error => {
				this.#ready.resolve();
			});

		return this.#ready;
	}

	#permission?: PermissionStatus; // Actually not available in safari

	#state: IPermissionState;
	get state() {
		return this.#state;
	}

	#error: Error;
	get error() {
		return this.#error;
	}

	#set(state: IPermissionState) {
		state !== this.#state && (this.#state = state) && this.trigger('change');
	}

	/**
	 * Not available in Safari
	 */
	#onchange(status: PermissionStatus) {
		this.#set(status.state);
	}

	async request() {
		await this.#ready;

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			if (!stream) return this.#set('denied');

			const tracks = stream.getTracks();
			tracks.forEach(track => track.stop());
			return this.#set('granted');
		} catch (error) {
			this.#error = error;
			return this.#set('denied');
		}
	}

	release() {
		if (this.#permission) this.#permission.onchange = void 0;
	}
})();
