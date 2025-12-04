/**
 * Content Verification
 * Verifies that all rooms and objects are properly instantiated
 */

import { createInitialGameState, validateRoomConnections, validateObjectLocations } from './gameFactory.js';
import { ALL_ROOMS } from '../data/rooms-complete.js';
import { ALL_OBJECTS } from '../data/objects-complete.js';

/**
 * Verify content completeness
 */
export function verifyContent(): {
  success: boolean;
  roomCount: number;
  objectCount: number;
  errors: string[];
  warnings: string[];
} {
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

  // Check treasures
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
  for (const treasureId of treasures) {
    if (state.objects.has(treasureId)) {
      treasureCount++;
    } else {
      warnings.push(`Treasure ${treasureId} not found`);
    }
  }

  console.log(`\nTreasures found: ${treasureCount}/19`);

  // Check room connectivity
  const westOfHouse = state.rooms.get('WEST-OF-HOUSE');
  if (westOfHouse) {
    const exits = westOfHouse.getAvailableExits();
    console.log(`\nWEST-OF-HOUSE has ${exits.length} exits`);
    if (exits.length === 0) {
      warnings.push('WEST-OF-HOUSE has no exits');
    }
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
    errors,
    warnings,
  };
}

// Run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyContent();
}
