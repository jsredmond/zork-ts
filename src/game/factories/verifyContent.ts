/**
 * Content Verification
 * Verifies that all rooms and objects are properly instantiated
 */

import { createInitialGameState, validateRoomConnections, validateObjectLocations } from './gameFactory.js';
import { ALL_ROOMS } from '../data/rooms-complete.js';
import { ALL_OBJECTS } from '../data/objects-complete.js';

interface VerificationReport {
  success: boolean;
  roomCount: number;
  objectCount: number;
  treasureCount: number;
  treasureValue: number;
  errors: string[];
  warnings: string[];
  roomsByArea: Record<string, number>;
  objectsByCategory: Record<string, number>;
}

/**
 * Verify content completeness
 */
export function verifyContent(): VerificationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Create game state
  const state = createInitialGameState();

  // Count rooms and objects
  const roomCount = state.rooms.size;
  const objectCount = state.objects.size;

  console.log(`\n=== Content Verification ===`);
  console.log(`Rooms instantiated: ${roomCount}`);
  console.log(`Objects instantiated: ${objectCount}`);

  // Verify all rooms from data are instantiated
  for (const roomId of Object.keys(ALL_ROOMS)) {
    if (!state.rooms.has(roomId)) {
      errors.push(`Room ${roomId} from data not instantiated`);
    }
  }

  // Verify all objects from data are instantiated
  for (const objectId of Object.keys(ALL_OBJECTS)) {
    if (!state.objects.has(objectId)) {
      errors.push(`Object ${objectId} from data not instantiated`);
    }
  }

  // Validate room connections
  const connectionErrors = validateRoomConnections(state);
  errors.push(...connectionErrors);

  // Validate object locations
  const locationErrors = validateObjectLocations(state);
  errors.push(...locationErrors);

  // Check starting room
  if (state.currentRoom !== 'WEST-OF-HOUSE') {
    errors.push(`Starting room should be WEST-OF-HOUSE, got ${state.currentRoom}`);
  }

  // Check starting conditions
  if (state.score !== 0) {
    errors.push(`Starting score should be 0, got ${state.score}`);
  }
  if (state.moves !== 0) {
    errors.push(`Starting moves should be 0, got ${state.moves}`);
  }
  if (state.inventory.length !== 0) {
    errors.push(`Starting inventory should be empty, got ${state.inventory.length} items`);
  }

  // Check that key rooms exist
  const keyRooms = [
    'WEST-OF-HOUSE',
    'NORTH-OF-HOUSE',
    'SOUTH-OF-HOUSE',
    'EAST-OF-HOUSE',
    'KITCHEN',
    'LIVING-ROOM',
    'ATTIC',
    'CELLAR',
    'TROLL-ROOM',
    'MAZE-1',
    'GRATING-ROOM',
  ];

  for (const roomId of keyRooms) {
    if (!state.rooms.has(roomId)) {
      errors.push(`Key room ${roomId} not found`);
    }
  }

  // Check that key objects exist
  const keyObjects = [
    'LAMP',
    'SWORD',
    'TROPHY-CASE',
    'MAILBOX',
    'BOTTLE',
    'WATER',
    'ROPE',
    'KNIFE',
  ];

  for (const objectId of keyObjects) {
    if (!state.objects.has(objectId)) {
      errors.push(`Key object ${objectId} not found`);
    }
  }

  // Check treasures and their values
  const treasures = [
    'SKULL',
    'CHALICE',
    'TRIDENT',
    'DIAMOND',
    'JADE',
    'EMERALD',
    'BAG-OF-COINS',
    'PAINTING',
    'SCEPTRE',
    'COFFIN',
    'TORCH',
    'BRACELET',
    'SCARAB',
    'BAR',
    'POT-OF-GOLD',
    'TRUNK',
    'EGG',
    'CANARY',
    'BAUBLE',
  ];

  let treasureCount = 0;
  let treasureValue = 0;
  const treasureLocations: string[] = [];
  
  for (const treasureId of treasures) {
    const treasure = state.objects.get(treasureId);
    if (treasure) {
      treasureCount++;
      const tValue = treasure.getProperty('treasureValue') || 0;
      treasureValue += tValue;
      treasureLocations.push(`${treasureId}: ${treasure.location || 'nowhere'} (${tValue} pts)`);
    } else {
      warnings.push(`Treasure ${treasureId} not found`);
    }
  }

  console.log(`\nTreasures found: ${treasureCount}/19`);
  console.log(`Total treasure value: ${treasureValue} points`);
  
  // Check if treasure value matches expected
  if (treasureValue !== 129) {
    warnings.push(`Expected treasure value to be 129, got ${treasureValue}`);
  }
  
  // Print treasure locations for verification
  console.log(`\nTreasure Locations:`);
  treasureLocations.forEach(loc => console.log(`  ${loc}`));
  
  // Check treasure reachability (basic BFS from starting room)
  console.log(`\n=== Checking Treasure Reachability ===`);
  const reachableRooms = new Set<string>();
  const queue: string[] = ['WEST-OF-HOUSE'];
  reachableRooms.add('WEST-OF-HOUSE');
  
  while (queue.length > 0) {
    const roomId = queue.shift()!;
    const room = state.rooms.get(roomId);
    if (!room) continue;
    
    for (const [_, exit] of room.exits.entries()) {
      if (exit.destination && !reachableRooms.has(exit.destination)) {
        reachableRooms.add(exit.destination);
        queue.push(exit.destination);
      }
    }
  }
  
  console.log(`Reachable rooms from start: ${reachableRooms.size}/${roomCount}`);
  
  // Check if all treasure locations are reachable
  let unreachableTreasures = 0;
  for (const treasureId of treasures) {
    const treasure = state.objects.get(treasureId);
    if (treasure && treasure.location) {
      // Check if treasure is in a room (not in a container)
      if (state.rooms.has(treasure.location)) {
        if (!reachableRooms.has(treasure.location)) {
          warnings.push(`Treasure ${treasureId} is in unreachable room ${treasure.location}`);
          unreachableTreasures++;
        }
      }
      // If treasure is in a container, check if container's room is reachable
      else if (state.objects.has(treasure.location)) {
        const container = state.objects.get(treasure.location);
        if (container && container.location && state.rooms.has(container.location)) {
          if (!reachableRooms.has(container.location)) {
            warnings.push(`Treasure ${treasureId} is in container ${treasure.location} in unreachable room ${container.location}`);
            unreachableTreasures++;
          }
        }
      }
    }
  }
  
  if (unreachableTreasures === 0) {
    console.log(`All treasures are in reachable locations`);
  } else {
    console.log(`Warning: ${unreachableTreasures} treasures may be unreachable`);
  }

  // Validate conditional exits
  console.log(`\n=== Validating Conditional Exits ===`);
  let conditionalExitCount = 0;
  for (const [roomId, room] of state.rooms.entries()) {
    for (const [direction, exit] of room.exits.entries()) {
      if (exit.condition) {
        conditionalExitCount++;
        // Check if the condition flag exists in the game state
        if (!(exit.condition in state.flags)) {
          warnings.push(`Room ${roomId} exit ${direction} has condition ${exit.condition} which is not a known flag`);
        }
      }
    }
  }
  console.log(`Conditional exits found: ${conditionalExitCount}`);

  // Check bidirectional connections
  console.log(`\n=== Checking Bidirectional Connections ===`);
  const oppositeDirections: Record<string, string> = {
    'NORTH': 'SOUTH',
    'SOUTH': 'NORTH',
    'EAST': 'WEST',
    'WEST': 'EAST',
    'NORTHEAST': 'SOUTHWEST',
    'SOUTHWEST': 'NORTHEAST',
    'NORTHWEST': 'SOUTHEAST',
    'SOUTHEAST': 'NORTHWEST',
    'UP': 'DOWN',
    'DOWN': 'UP',
  };

  let bidirectionalCount = 0;
  let unidirectionalCount = 0;
  
  for (const [roomId, room] of state.rooms.entries()) {
    for (const [direction, exit] of room.exits.entries()) {
      if (exit.destination) {
        const destRoom = state.rooms.get(exit.destination);
        if (destRoom) {
          const oppositeDir = oppositeDirections[direction];
          if (oppositeDir) {
            const returnExit = destRoom.exits.get(oppositeDir);
            if (returnExit && returnExit.destination === roomId) {
              bidirectionalCount++;
            } else {
              unidirectionalCount++;
            }
          }
        }
      }
    }
  }
  console.log(`Bidirectional connections: ${bidirectionalCount / 2}`); // Divide by 2 since we count each twice
  console.log(`Unidirectional connections: ${unidirectionalCount}`);

  // Categorize rooms by area
  const roomsByArea: Record<string, number> = {
    'House': 0,
    'Forest': 0,
    'Cellar': 0,
    'Maze': 0,
    'Reservoir': 0,
    'Mirror': 0,
    'Round Room': 0,
    'Hades': 0,
    'Temple': 0,
    'Dam': 0,
    'River': 0,
    'Coal Mine': 0,
    'Cyclops': 0,
    'Other': 0,
  };

  for (const roomId of state.rooms.keys()) {
    if (roomId.includes('HOUSE')) roomsByArea['House']++;
    else if (roomId.includes('FOREST') || roomId.includes('CLEARING') || roomId.includes('PATH')) roomsByArea['Forest']++;
    else if (roomId.includes('CELLAR') || roomId.includes('KITCHEN') || roomId.includes('ATTIC') || roomId.includes('LIVING')) roomsByArea['House']++;
    else if (roomId.includes('MAZE')) roomsByArea['Maze']++;
    else if (roomId.includes('RESERVOIR') || roomId.includes('STREAM')) roomsByArea['Reservoir']++;
    else if (roomId.includes('MIRROR')) roomsByArea['Mirror']++;
    else if (roomId.includes('ROUND') || roomId.includes('CANYON') || roomId.includes('LOUD') || roomId.includes('CHASM')) roomsByArea['Round Room']++;
    else if (roomId.includes('HADES') || roomId.includes('DEAD')) roomsByArea['Hades']++;
    else if (roomId.includes('TEMPLE') || roomId.includes('EGYPT') || roomId.includes('DOME') || roomId.includes('TORCH-ROOM')) roomsByArea['Temple']++;
    else if (roomId.includes('DAM') || roomId.includes('MAINTENANCE')) roomsByArea['Dam']++;
    else if (roomId.includes('RIVER') || roomId.includes('SHORE') || roomId.includes('BEACH') || roomId.includes('FALLS') || roomId.includes('RAINBOW') || roomId.includes('CLIFFS')) roomsByArea['River']++;
    else if (roomId.includes('MINE') || roomId.includes('SHAFT') || roomId.includes('COAL') || roomId.includes('GAS-ROOM') || roomId.includes('LADDER') || roomId.includes('SLIDE')) roomsByArea['Coal Mine']++;
    else if (roomId.includes('CYCLOPS') || roomId.includes('TREASURE-ROOM')) roomsByArea['Cyclops']++;
    else roomsByArea['Other']++;
  }

  // Categorize objects
  const objectsByCategory: Record<string, number> = {
    'Treasures': treasureCount,
    'Tools': 0,
    'Containers': 0,
    'Readable': 0,
    'Weapons': 0,
    'NPCs': 0,
    'Scenery': 0,
    'Other': 0,
  };

  for (const [objectId, obj] of state.objects.entries()) {
    if (treasures.includes(objectId)) continue; // Already counted
    
    if (obj.hasFlag('WEAPONBIT')) objectsByCategory['Weapons']++;
    else if (obj.hasFlag('CONTBIT')) objectsByCategory['Containers']++;
    else if (obj.hasFlag('READBIT')) objectsByCategory['Readable']++;
    else if (obj.hasFlag('ACTORBIT')) objectsByCategory['NPCs']++;
    else if (obj.hasFlag('NDESCBIT') || !obj.hasFlag('TAKEBIT')) objectsByCategory['Scenery']++;
    else if (obj.hasFlag('TOOLBIT') || obj.hasFlag('TAKEBIT')) objectsByCategory['Tools']++;
    else objectsByCategory['Other']++;
  }

  // Check room connectivity
  const westOfHouse = state.rooms.get('WEST-OF-HOUSE');
  if (westOfHouse) {
    const exits = westOfHouse.getAvailableExits();
    console.log(`\nWEST-OF-HOUSE has ${exits.length} exits`);
    if (exits.length === 0) {
      warnings.push('WEST-OF-HOUSE has no exits');
    }
  }

  // Print detailed report
  console.log(`\n=== Rooms by Area ===`);
  for (const [area, count] of Object.entries(roomsByArea)) {
    if (count > 0) {
      console.log(`  ${area}: ${count}`);
    }
  }

  console.log(`\n=== Objects by Category ===`);
  for (const [category, count] of Object.entries(objectsByCategory)) {
    console.log(`  ${category}: ${count}`);
  }

  // Summary
  console.log(`\n=== Verification Results ===`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(err => console.log(`  - ${err}`));
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(warn => console.log(`  - ${warn}`));
  }

  const success = errors.length === 0;
  if (success) {
    console.log('\n✓ Content verification passed!');
  } else {
    console.log('\n✗ Content verification failed!');
  }

  return {
    success,
    roomCount,
    objectCount,
    treasureCount,
    treasureValue,
    errors,
    warnings,
    roomsByArea,
    objectsByCategory,
  };
}

// Run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyContent();
}
