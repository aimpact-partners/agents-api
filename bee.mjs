import bee from '@beyond-js/bee';
(async () => {
	try {
		bee('http://localhost:6583', { inspect: 4000 });
		bimport('/start').catch(exc => console.error(exc.stack));
	} catch (e) {
		console.error(e);
	}
})();
