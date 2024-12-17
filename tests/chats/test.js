describe('run API', () => {
	test('tes endpoint ', async () => {
		const id = `268acabf-7ed2-4136-bd61-c78215872e5c`;
		const url = `https://chat-api-http-v2-rb5caohzgq-uc.a.run.app/chats/${id}`;

		const options = { method: 'GET' };
		const response = await fetch(url, options);

		const { error, data } = await response.json();
		error ? console.error(error) : console.log(data);
	});
});
