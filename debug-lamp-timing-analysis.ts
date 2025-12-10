#!/usr/bin/env npx tsx

/**
 * Debug script to analyze lamp fuel timing system
 * Tests exact timing mechanics and documents behavior
 */

import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { initializeLampTimer } from './src/engine/daemons.js';

async function analyzeLampTiming() {
  console.log('=== LAMP FUEL TIMING ANALYSIS ===\n');
  
  const state = createInitialGameState();
  
  // Get the lamp and turn it on
  const lamp = state.getObject('LAMP');
  if (!lamp) {
    console.log('ERROR: Lamp not found');
    return;
  }
  
  // Move lamp to inventory and turn it on
  state.moveObject('LAMP', 'PLAYER');
  lamp.flags.add('ONBIT' as any);
  
  // Initialize the lamp timer
  initializeLampTimer(state);
  
  console.log('Initial state:');
  console.log(`- Lamp fuel: ${state.getGlobalVariable('LAMP_FUEL')}`);
  console.log(`- Lamp stage index: ${state.getGlobalVariable('LAMP_STAGE_INDEX')}`);
  console.log(`- Lamp timer ticks remaining: ${state.eventSystem.getRemainingTicks('I-LANTERN')}`);
  console.log(`- Current turn: ${state.moves}\n`);
  
  // Document the expected timing
  console.log('Expected lamp timing (from ZIL LAMP-TABLE):');
  console.log('- Initial fuel: 200 turns');
  console.log('- Warning 1 at turn 100 (fuel=100): "The lamp appears a bit dimmer."');
  console.log('- Warning 2 at turn 130 (fuel=70): "The lamp is definitely dimmer now."');
  console.log('- Warning 3 at turn 185 (fuel=15): "The lamp is nearly out."');
  console.log('- Lamp dies at turn 200 (fuel=0): "The brass lantern has gone out."\n');
  
  // Test the timing by advancing turns
  const testTurns = [99, 100, 101, 129, 130, 131, 184, 185, 186, 199, 200, 201];
  
  for (const targetTurn of testTurns) {
    // Advance to target turn
    while (state.moves < targetTurn) {
      state.eventSystem.processTurn(state);
    }
    
    const lampOn = lamp.flags.has('ONBIT' as any);
    const stageIndex = state.getGlobalVariable('LAMP_STAGE_INDEX') || 0;
    const ticksRemaining = state.eventSystem.getRemainingTicks('I-LANTERN');
    
    console.log(`Turn ${targetTurn}:`);
    console.log(`  - Lamp on: ${lampOn}`);
    console.log(`  - Stage index: ${stageIndex}`);
    console.log(`  - Ticks remaining: ${ticksRemaining}`);
    
    if (targetTurn === 100 || targetTurn === 130 || targetTurn === 185 || targetTurn === 200) {
      console.log(`  - Expected warning at this turn`);
    }
    console.log();
  }
  
  console.log('=== ANALYSIS COMPLETE ===');
}

analyzeLampTiming().catch(console.error);