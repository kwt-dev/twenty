
const { TRIB_TOKENS, TRIB_TOKENS.MESSAGE_QUEUE_SERVICE } = require('./src/tokens.ts');
console.log('Bridge test results:');
console.log('TRIB_TOKENS.MESSAGE_QUEUE_SERVICE === TRIB_TOKENS.MESSAGE_QUEUE_SERVICE:', TRIB_TOKENS.MESSAGE_QUEUE_SERVICE === TRIB_TOKENS.MESSAGE_QUEUE_SERVICE);
console.log('Both are symbols:', typeof TRIB_TOKENS.MESSAGE_QUEUE_SERVICE === 'symbol' && typeof TRIB_TOKENS.MESSAGE_QUEUE_SERVICE === 'symbol');
