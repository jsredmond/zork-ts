import { createInitialGameState } from './src/game/factories/gameFactory.js';

const state = createInitialGameState();

// Check what's on the table
const bottle = state.getObject('BOTTLE');
const sack = state.getObject('LUNCH');

console.log('Bottle location:', bottle?.location);
console.log('Sack location:', sack?.location);

// Get objects in container
const tableContents = state.getObjectsInContainer('KITCHEN-TABLE');
console.log('\nTable contents:', tableContents.map(o => o.id));
