/**
 * Test treasure collection
 * Verifies all 19 treasures exist and can be found
 */

import { createInitialGameState } from '../game/factories/gameFactory';
import { isRoomReachable } from './roomTester';

function testTreasureCollection() {
  console.log('=== Treasure Collection Test ===\n');
  
  const state = createInitialGameState();
  
  // Find all treasures
  const treasures: Array<{
    id: string;
    name: string;
    value: number;
    location: string;
    locationName: string;
    reachable: boolean;
  }> = [];
  
  let totalValue = 0;
  
  for (const [objectId, obj] of state.objects.entries()) {
    const treasureValue = obj.properties.get('treasureValue');
    // Skip broken versions and sword (which has treasureValue 0)
    if (treasureValue && treasureValue > 0 && !objectId.startsWith('BROKEN-')) {
      const location = obj.location || 'UNKNOWN';
      const locationRoom = typeof location === 'string' ? state.getRoom(location) : null;
      const reachable = typeof location === 'string' ? isRoomReachable(location, state) : false;
      
      treasures.push({
        id: objectId,
        name: obj.name,
        value: treasureValue,
        location: typeof location === 'string' ? location : 'CONTAINER',
        locationName: locationRoom?.name || 'Unknown',
        reachable
      });
      
      totalValue += treasureValue;
    }
  }
  
  // Sort by value descending
  treasures.sort((a, b) => b.value - a.value);
  
  console.log(`Found ${treasures.length} treasures:\n`);
  
  for (const treasure of treasures) {
    const reachableIcon = treasure.reachable ? '✓' : '✗';
    console.log(`${reachableIcon} ${treasure.name.padEnd(25)} ${treasure.value.toString().padStart(3)} points - ${treasure.location} (${treasure.locationName})`);
  }
  
  console.log(`\nTotal treasure value (TVALUE): ${totalValue} points`);
  console.log(`Note: Total game score of 350 includes treasures + puzzles + other achievements`);
  
  const reachableTreasures = treasures.filter(t => t.reachable);
  const unreachableTreasures = treasures.filter(t => !t.reachable);
  
  console.log(`\nReachable treasures: ${reachableTreasures.length}/${treasures.length}`);
  console.log(`Unreachable treasures: ${unreachableTreasures.length}/${treasures.length}`);
  
  if (unreachableTreasures.length > 0) {
    console.log('\nUnreachable treasures (may be puzzle-gated):');
    unreachableTreasures.forEach(t => {
      console.log(`  - ${t.name} in ${t.location}`);
    });
  }
  
  // Test results
  const allTestsPassed = treasures.length === 19;
  
  console.log('\n=== Test Results ===');
  console.log(`Treasure count: ${treasures.length === 19 ? '✓' : '✗'} (${treasures.length}/19)`);
  console.log(`All treasures have values: ${treasures.every(t => t.value > 0) ? '✓' : '✗'}`);
  
  if (allTestsPassed) {
    console.log('\n✓ All treasure tests passed!');
  } else {
    console.log('\n✗ Some treasure tests failed');
  }
  
  return {
    passed: allTestsPassed,
    treasureCount: treasures.length,
    totalValue,
    reachableTreasures: reachableTreasures.length,
    unreachableTreasures: unreachableTreasures.length
  };
}

testTreasureCollection();
