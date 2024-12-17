const BEE = require('@beyond-js/bee');

BEE('http://localhost:6580', {hmr: true});

(async() => {
    await bimport('/start');
})();
