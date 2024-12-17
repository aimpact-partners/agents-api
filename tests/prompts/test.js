describe('run Prompts API', () => {
	// test('tes endpoint ', async () => {
	// 	const body = JSON.stringify({ prompt: 'dame un saludo motivacional de 5 palabras' });
	// 	const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body };
	// 	const url = 'https://chat-api-http-v2-rb5caohzgq-uc.a.run.app/prompts/templates/process';
	// 	const response = await fetch(url, options);

	// 	const { error, data } = await response.json();
	// 	error ? console.error(error) : console.log(data);
	// });

	test('test endpoint ', async () => {
		const options = { method: 'GET' };
		const url = 'http://localhost:5040/prompts/templates';
		const response = await fetch(url, options);

		const { error, data } = await response.json();
		error ? console.error(error) : console.log(data);
	});
});
