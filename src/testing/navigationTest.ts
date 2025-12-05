/**
 * Navigation testing for complete world content
 * Verifies all areas are reachable and exits work correctly
 */

import { createInitialGameState } from '../game/factories/gameFactory';
import { findUnreachableRooms, buildRoomGraph, findReachableRooms, executeRoomTests } from './roomTester';

/**
 * Test navigation to all areas
 */
export function testNavigationToAllAreas() {
  console.log('Testing navigation to all areas...\n');
  
  const state = createInitialGameState();
  
  // 1. Check for unreachable rooms
  console.log('1. Checking for unreachable rooms...');
  const unreachableRooms = findUnreachableRooms(state, 'WEST-OF-HOUSE');
  
  if (unreachableRooms.length > 0) {
    console.log(`   ❌ Found ${unreachableRooms.length} unreachable rooms:`);
    unreachableRooms.forEach(roomId => {
      const room = state.getRoom(roomId);
      console.log(`      - ${roomId}: ${room?.name || 'Unknown'}`);
    });
  } else {
    console.log(`   ✓ All ${state.rooms.size} rooms are reachable from WEST-OF-HOUSE`);
  }
  
  // 2. Test all room exits
  console.log('\n2. Testing all room exits...');
  const roomTestResults = executeRoomTests(state);
  const exitFailures = roomTestResults.results.filter(r => 
    r.testType === 'ROOM_EXITS' && !r.passed
  );
  
  if (exitFailures.length > 0) {
    console.log(`   ❌ Found ${exitFailures.length} rooms with invalid exits:`);
    exitFailures.forEach(result => {
      console.log(`      - ${result.message}`);
    });
  } else {
    console.log(`   ✓ All room exits are valid`);
  }
  
  // 3. Test conditional exits
  console.log('\n3. Testing conditional exits...');
  let conditionalExitCount = 0;
  let conditionalExitIssues: string[] = [];
  
  for (const [roomId, room] of state.rooms.entries()) {
    for (const [direction, exit] of room.exits.entries()) {
      if (exit.condition) {
        conditionalExitCount++;
        
        // Check that the destination exists
        if (exit.destination && !state.rooms.has(exit.destination)) {
          conditionalExitIssues.push(
            `${roomId} ${direction} -> ${exit.destination} (condition: ${exit.condition})`
          );
        }
      }
    }
  }
  
  if (conditionalExitIssues.length > 0) {
    console.log(`   ❌ Found ${conditionalExitIssues.length} conditional exits with issues:`);
    conditionalExitIssues.forEach(issue => {
      console.log(`      - ${issue}`);
    });
  } else {
    console.log(`   ✓ All ${conditionalExitCount} conditional exits are valid`);
  }
  
  // 4. Summary
  console.log('\n=== Navigation Test Summary ===');
  console.log(`Total rooms: ${state.rooms.size}`);
  console.log(`Reachable rooms: ${state.rooms.size - unreachableRooms.length}`);
  console.log(`Unreachable rooms: ${unreachableRooms.length}`);
  console.log(`Conditional exits: ${conditionalExitCount}`);
  console.log(`Exit validation failures: ${exitFailures.length}`);
  console.log(`Conditional exit issues: ${conditionalExitIssues.length}`);
  
  const allTestsPassed = 
    unreachableRooms.length === 0 &&
    exitFailures.length === 0 &&
    conditionalExitIssues.length === 0;
  
  if (allTestsPassed) {
    console.log('\n✓ All navigation tests passed!');
  } else {
    console.log('\n❌ Some navigation tests failed');
  }
  
  return {
    passed: allTestsPassed,
    totalRooms: state.rooms.size,
    unreachableRooms,
    exitFailures,
    conditionalExitIssues
  };
}

// Run if executed directly
testNavigationToAllAreas();
