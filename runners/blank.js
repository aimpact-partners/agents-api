// Just start a BEE to run the debug console
// For example, you could use this runner to dynamically import your modules and to use HMR

const BEE = require('@beyond-js/bee');
BEE('http://localhost:6583', { inspect: 4000 });

// const {KB} = await bimport('@aimpact/chat-api/kb');
// const response = await KB.upsert('henry-test', {meta: '1'}, 'doc', 'Hola, cómo va?\n\nSoy Henry!', 'testing');
// const response = await KB.query('testing', {}, 'Quién soy?');
// console.log(response);
