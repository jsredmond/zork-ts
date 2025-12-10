import { createInitialGameState } from './src/game/factories/gameFactory.js';

const state = createInitialGameState();
console.log('=== Thief Daemon Test ===');

// Check if thief daemon is registered
const status = state.eventSystem.getEventStatus('I-THIEF');
console.log('Thief daemon status:', status);

// Check if thief actor is registered
const thief = state.actorManager.getActor('THIEF');
console.log('Thief actor registered:', !!thief);

// Check thief location
const thiefObj = state.getObject('THIEF');
console.log('Thief location:', thiefObj?.location);

// Run a few turns to see if thief moves
for (let i = 0; i < 5; i++) {
  console.log(`Turn ${i + 1}:`);
  const result = state.eventSystem.processTurn(state);
  console.log('  Event caused change:', result);
  console.log('  Thief location:', state.getObject('THIEF')?.location);
}