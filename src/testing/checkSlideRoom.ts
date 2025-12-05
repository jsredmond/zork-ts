import { createInitialGameState } from '../game/factories/gameFactory';
import { isRoomReachable } from './roomTester';

const state = createInitialGameState();

const room = state.getRoom('UP-A-TREE');
console.log('UP-A-TREE exists:', !!room);
console.log('UP-A-TREE reachable:', isRoomReachable('UP-A-TREE', state));

// Check if NEST object exists
const nest = state.getObject('NEST');
console.log('NEST exists:', !!nest);
console.log('NEST location:', nest?.location);

// Check if EGG exists
const egg = state.getObject('EGG');
console.log('EGG exists:', !!egg);
console.log('EGG location:', egg?.location);
