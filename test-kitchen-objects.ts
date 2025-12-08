import { createInitialGameState } from './src/game/factories/gameFactory.js';

const state = createInitialGameState();

// Check kitchen objects
const kitchen = state.getRoom('KITCHEN');
console.log('Kitchen objects:', kitchen?.objects);

// Check each object
for (const objId of kitchen?.objects || []) {
  const obj = state.getObject(objId);
  console.log(`\n${objId}:`);
  console.log('  Name:', obj?.name);
  console.log('  Location:', obj?.location);
  console.log('  Flags:', Array.from(obj?.flags || []));
}
