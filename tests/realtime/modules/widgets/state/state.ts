import { useState } from 'react';

export /*bundle*/ class State<STATE_TYPE> {
	#values = {};
	get values(): STATE_TYPE {
		return <STATE_TYPE>this.#values;
	}

	/**
	 * Define a property or an array of properties of the state object
	 *
	 * @param p1 Can be the name of the property or an object with the values of the properties
	 * @param p2 The initial value if the value of p1 is the name of the property to be defined
	 */
	define(p1: string | STATE_TYPE, p2?: any) {
		// Normalize as an array of properties regardless wether a property or a properties object is being defined
		const properties: [string, any][] = typeof p1 === 'string' ? [p1, p2] : Object.entries(p1);

		properties.forEach(([name, initial]) => {
			if (this.#values.hasOwnProperty(name)) return;

			let [value, update] = useState(initial);

			Object.defineProperty(this.#values, name, {
				get: () => value,
				set: (updated: any) => {
					update(updated);
					value = updated;
				}
			});
		});
	}
}
