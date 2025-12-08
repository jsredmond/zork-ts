import { createInitialGameState } from './src/game/factories/gameFactory.js';

const state = createInitialGameState();

const bottle = state.getObject('BOTTLE');
const sack = state.getObject('SANDWICH-BAG');

console.log('Bottle:');
console.log('  longDescription:', bottle?.getProperty('longDescription'));
console.log('  LDESC:', bottle?.getProperty('LDESC'));

console.log('\nSack:');
console.log('  longDescription:', sack?.getProperty('longDescription'));
console.log('  LDESC:', sack?.getProperty('LDESC'));
