const BEE = require('@beyond-js/bee');

BEE('http://localhost:6583', {});
bimport('/start').catch(exc => console.error(exc.stack));
