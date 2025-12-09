import { createInitialGameState } from '../src/game/factories/gameFactory.js';
import { formatRoomDescription } from '../src/game/actions.js';

const state = createInitialGameState();

// Move to living room
state.currentRoom = 'LIVING-ROOM';

// Get the room
const room = state.getCurrentRoom();
console.log('=== LIVING ROOM DEBUG ===\n');

// Get objects in room
const objectsInRoom = state.getObjectsInCurrentRoom();
console.log('Objects in room (in order):');
objectsInRoom.forEach((obj, index) => {
  console.log(`${index + 1}. ${obj.id} - ${obj.name} (NDESCBIT: ${obj.hasFlag('NDESCBIT')})`);
  if (obj.firstDescription) {
    console.log(`   First: ${obj.firstDescription}`);
  }
});

console.log('\n=== FORMATTED DESCRIPTION ===\n');
const description = formatRoomDescription(room, state);
console.log(description);
