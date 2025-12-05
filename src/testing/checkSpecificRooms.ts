/**
 * Check if specific rooms are reachable
 */

import { createInitialGameState } from '../game/factories/gameFactory';
import { isRoomReachable } from './roomTester';

const state = createInitialGameState();

const roomsToCheck = [
  'CYCLOPS-ROOM',
  'TREASURE-ROOM',
  'RESERVOIR-SOUTH',
  'RESERVOIR',
  'MIRROR-ROOM-2',
  'MIRROR-ROOM-1',
  'ENTRANCE-TO-HADES',
  'LAND-OF-LIVING-DEAD',
  'DAM-ROOM',
  'DAM-BASE',
  'RIVER-1',
  'MINE-ENTRANCE',
  'COAL-MINE-1'
];

console.log('Checking reachability of specific rooms:\n');

for (const roomId of roomsToCheck) {
  const reachable = isRoomReachable(roomId, state);
  const room = state.getRoom(roomId);
  const status = reachable ? '✓' : '✗';
  console.log(`${status} ${roomId}: ${room?.name || 'NOT FOUND'}`);
}
