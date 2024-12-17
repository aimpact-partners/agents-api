import { useState, useRef, useEffect } from 'react';
import { Events } from '@beyond-js/events/events';

type ListenerType = () => void;
type ListenersType = Map<string, ListenerType>;

export /*bundle*/ class Observer {
	#objects: Map<Events, ListenersType>;
	#invalidate: () => void;

	constructor() {
		const [id, invalidate] = useState(0);
		this.#invalidate = () => invalidate(id + 1);
	}

	static get instance() {
		const ref = useRef<Observer>(null);
		if (ref.current) return ref.current;

		const instance = (ref.current = new Observer());
		useEffect(() => {
			return () => {
				instance.#clean();
			};
		}, []);
	}

	static set(object: Events, event: string) {
		this.instance.#set(object, event);
	}

	#set(object: Events, event: string) {
		// Observer alrady set
		if (this.#objects.get(object)?.get(event)) return;

		const listeners = (() => {
			if (this.#objects.has(object)) return this.#objects.get(object);

			const listeners = new Map();
			this.#objects.set(object, listeners);
			return listeners;
		})();

		const listener = () => this.#invalidate();

		listeners.set(event, listener);
		object.on(event, listener);
	}

	#clean() {
		this.#objects.forEach((listeners, object) => {
			listeners.forEach((listener, event) => {
				object.off(event, listener);
			});
		});
	}
}
