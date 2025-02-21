declare const bimport: (module: string) => any;

export /*bundle*/ const key = new (class OpenAIKey {
	#key: string | undefined;

	async get() {
		if (this.#key) return this.#key;

		const dotenv = await bimport('dotenv');
		dotenv.config();

		this.#key = process.env.OPEN_AI_KEY;

		return this.#key;
	}

	set(value: string) {
		if (!value) {
			console.error('value must be specified');
		}

		this.#key = value;
		return this.#key;
	}
})();
