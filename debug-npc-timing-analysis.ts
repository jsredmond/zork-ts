#!/usr/bin/env npx tsx

/**
 * Debug script to analyze NPC movement timing systems
 * Tests thief movement, cyclops behavior, and bat encounter timing
 */

import { createInitialGameState } from './src/game/factories/gameFactory.js';

async function analyzeNPCTiming() {
  console.log('=== NPC MOVEMENT TIMING ANALYSIS ===\n');
  
  const state = createInitialGameState();
  
  console.log('=== THIEF MOVEMENT ANALYSIS ===');
  
  // Get the thief
  const thief = state.getObject('THIEF');
  if (!thief) {
    console.log('ERROR: Thief not found');
    return;
  }
  
  console.log('Initial thief state:');
  console.log(`- Location: ${thief.location}`);
  console.log(`- Visible: ${!thief.flags.has('INVISIBLE' as any)}`);
  console.log(`- Fighting: ${thief.flags.has('FIGHTBIT' as any)}`);
  console.log(`- Daemon enabled: ${state.eventSystem.getEventStatus('I-THIEF')?.enabled}`);
  console.log();
  
  // Test thief movement over several turns
  console.log('Thief movement over 10 turns:');
  for (let turn = 1; turn <= 10; turn++) {
    const oldLocation = thief.location;
    state.eventSystem.processTurn(state);
    const newLocation = thief.location;
    
    console.log(`Turn ${turn}:`);
    console.log(`  - Location: ${oldLocation} -> ${newLocation}`);
    console.log(`  - Moved: ${oldLocation !== newLocation}`);
    console.log(`  - Visible: ${!thief.flags.has('INVISIBLE' as any)}`);
  }
  console.log();
  
  console.log('=== CYCLOPS BEHAVIOR ANALYSIS ===');
  
  // Get the cyclops
  const cyclops = state.getObject('CYCLOPS');
  if (!cyclops) {
    console.log('ERROR: Cyclops not found');
    return;
  }
  
  console.log('Initial cyclops state:');
  console.log(`- Location: ${cyclops.location}`);
  console.log(`- Fighting: ${cyclops.flags.has('FIGHTBIT' as any)}`);
  console.log(`- Actor state: ${state.actorManager.getActor('CYCLOPS')?.getState()}`);
  console.log();
  
  // Move player to cyclops room to trigger behavior
  state.setCurrentRoom('CYCLOPS-ROOM');
  
  console.log('Cyclops behavior when player is present (5 turns):');
  for (let turn = 1; turn <= 5; turn++) {
    console.log(`Turn ${turn}:`);
    const changed = state.eventSystem.processTurn(state);
    console.log(`  - State changed: ${changed}`);
    console.log(`  - Actor state: ${state.actorManager.getActor('CYCLOPS')?.getState()}`);
  }
  console.log();
  
  console.log('=== BAT ENCOUNTER ANALYSIS ===');
  
  // Get the bat
  const bat = state.getObject('BAT');
  if (!bat) {
    console.log('ERROR: Bat not found');
    return;
  }
  
  console.log('Initial bat state:');
  console.log(`- Location: ${bat.location}`);
  console.log(`- Visible: ${!bat.flags.has('INVISIBLE' as any)}`);
  console.log();
  
  // Move player to bat room
  const batRoom = bat.location;
  if (batRoom) {
    state.setCurrentRoom(batRoom);
    console.log(`Player moved to bat room: ${batRoom}`);
    
    // Test bat encounter over several turns
    console.log('Bat encounter behavior (3 turns):');
    for (let turn = 1; turn <= 3; turn++) {
      console.log(`Turn ${turn}:`);
      const changed = state.eventSystem.processTurn(state);
      console.log(`  - State changed: ${changed}`);
      console.log(`  - Player room: ${state.currentRoom}`);
      console.log(`  - Bat location: ${bat.location}`);
    }
  }
  
  console.log('\n=== DAEMON EXECUTION ORDER ANALYSIS ===');
  
  // Check daemon execution order
  const eventIds = state.eventSystem.getEventIds();
  console.log('Registered events/daemons:');
  for (const eventId of eventIds) {
    const status = state.eventSystem.getEventStatus(eventId);
    if (status) {
      console.log(`- ${eventId}: enabled=${status.enabled}, daemon=${status.isDaemon}, ticks=${status.ticksRemaining}`);
    }
  }
  
  console.log('\n=== ANALYSIS COMPLETE ===');
}

analyzeNPCTiming().catch(console.error);