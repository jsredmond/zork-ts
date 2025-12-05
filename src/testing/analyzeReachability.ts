/**
 * Analyze room reachability in detail
 * Shows which rooms are unreachable and why
 */

import { createInitialGameState } from '../game/factories/gameFactory';
import { buildRoomGraph, findReachableRooms } from './roomTester';

function analyzeReachability() {
  const state = createInitialGameState();
  
  console.log('=== Room Reachability Analysis ===\n');
  
  // Build the graph
  const graph = buildRoomGraph(state);
  const reachable = findReachableRooms('WEST-OF-HOUSE', graph);
  
  console.log(`Total rooms: ${state.rooms.size}`);
  console.log(`Reachable from WEST-OF-HOUSE: ${reachable.size}\n`);
  
  // Analyze unreachable rooms
  const unreachable: string[] = [];
  for (const roomId of state.rooms.keys()) {
    if (!reachable.has(roomId)) {
      unreachable.push(roomId);
    }
  }
  
  console.log(`Unreachable rooms (${unreachable.length}):\n`);
  
  // Group by area
  const areas: { [key: string]: string[] } = {
    'Treasure Room': [],
    'Reservoir': [],
    'Mirror Rooms': [],
    'Hades': [],
    'Temple/Egypt': [],
    'River': [],
    'Coal Mine': [],
    'Other': []
  };
  
  for (const roomId of unreachable) {
    const room = state.getRoom(roomId);
    if (!room) continue;
    
    if (roomId.includes('TREASURE-ROOM')) {
      areas['Treasure Room'].push(`${roomId}: ${room.name}`);
    } else if (roomId.includes('RESERVOIR') || roomId.includes('STREAM')) {
      areas['Reservoir'].push(`${roomId}: ${room.name}`);
    } else if (roomId.includes('MIRROR') || roomId.includes('ATLANTIS') || 
               roomId.includes('COLD-PASSAGE') || roomId.includes('TWISTING')) {
      areas['Mirror Rooms'].push(`${roomId}: ${room.name}`);
    } else if (roomId.includes('DEAD') || roomId.includes('HADES')) {
      areas['Hades'].push(`${roomId}: ${room.name}`);
    } else if (roomId.includes('TEMPLE') || roomId.includes('EGYPT') || 
               roomId.includes('DOME') || roomId.includes('TORCH') || 
               roomId.includes('ENGRAVINGS')) {
      areas['Temple/Egypt'].push(`${roomId}: ${room.name}`);
    } else if (roomId.includes('RIVER')) {
      areas['River'].push(`${roomId}: ${room.name}`);
    } else if (roomId.includes('MINE') || roomId.includes('SHAFT') || 
               roomId.includes('LADDER') || roomId.includes('GAS') || 
               roomId.includes('SMELLY') || roomId.includes('BAT') || 
               roomId.includes('SQUEEKY') || roomId.includes('TIMBER') || 
               roomId.includes('SLIDE')) {
      areas['Coal Mine'].push(`${roomId}: ${room.name}`);
    } else {
      areas['Other'].push(`${roomId}: ${room.name}`);
    }
  }
  
  for (const [area, rooms] of Object.entries(areas)) {
    if (rooms.length > 0) {
      console.log(`${area} (${rooms.length}):`);
      rooms.forEach(r => console.log(`  - ${r}`));
      console.log();
    }
  }
  
  // Now let's check what rooms connect to these unreachable areas
  console.log('=== Checking connections to unreachable areas ===\n');
  
  for (const roomId of reachable) {
    const room = state.getRoom(roomId);
    if (!room) continue;
    
    for (const [direction, exit] of room.exits.entries()) {
      if (exit.destination && unreachable.includes(exit.destination)) {
        const destRoom = state.getRoom(exit.destination);
        console.log(`${roomId} -> ${direction} -> ${exit.destination} (${destRoom?.name})`);
        if (exit.condition) {
          console.log(`  Condition: ${exit.condition}`);
        }
      }
    }
  }
}

analyzeReachability();
