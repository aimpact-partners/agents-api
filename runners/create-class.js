const BEE = require('@beyond-js/bee');

BEE('http://localhost:6580', { hmr: true });

const curriculumObjective = 'Los primeros pobladores de América';
const topics = ['Hipótesis Clovis', 'Desafío Monteverde a Hipótesis Clovis'];

(async () => {
	const { ClassesProvider } = await bimport('@aimpact/chat-api/provider');
	const course = new ClassesProvider();

	const params = { is: 'class', element: 'synthesis', topics };
	const { prompt, response } = await course.generate(curriculumObjective, params);
	console.log(`PROMPT:\n${prompt}\n\n`);
	console.log(`RESPONSE:\n${response}`);
})();
