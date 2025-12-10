#!/usr/bin/env npx tsx

/**
 * Debug script to analyze candle burning timing system
 * Tests exact timing mechanics and documents behavior
 */

import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { initializeCandleTimer } from './src/engine/daemons.js';

async function analyzeCandleTiming() {
  console.log('=== CANDLE BURNING TIMING ANALYSIS ===\n');
  
  const state = createInitialGameState();
  
  // Get the candles and light them
  const candles = state.getObject('CANDLES');
  if (!candles) {
    console.log('ERROR: Candles not found');
    return;
  }
  
  // Move candles to inventory and light them
  state.moveObject('CANDLES', 'PLAYER');
  candles.flags.add('ONBIT' as any);
  
  // Initialize the candle timer
  initializeCandleTimer(state);
  
  console.log('Initial state:');
  console.log(`- Candle fuel: ${state.getGlobalVariable('CANDLE_FUEL')}`);
  console.log(`- Candle stage index: ${state.getGlobalVariable('CANDLE_STAGE_INDEX')}`);
  console.log(`- Candle timer ticks remaining: ${state.eventSystem.getRemainingTicks('I-CANDLES')}`);
  console.log(`- Current turn: ${state.moves}\n`);
  
  // Document the expected timing
  console.log('Expected candle timing (from ZIL CANDLE-TABLE):');
  console.log('- Initial fuel: 40 turns');
  console.log('- Warning 1 at turn 20 (fuel=20): "The candles grow shorter."');
  console.log('- Warning 2 at turn 30 (fuel=10): "The candles are becoming quite short."');
  console.log('- Warning 3 at turn 35 (fuel=5): "The candles won\'t last long now."');
  console.log('- Candles die at turn 40 (fuel=0): "You\'d better have more light than from the pair of candles."\n');
  
  // Test the timing by advancing turns
  const testTurns = [19, 20, 21, 29, 30, 31, 34, 35, 36, 39, 40, 41];
  
  for (const targetTurn of testTurns) {
    // Advance to target turn
    while (state.moves < targetTurn) {
      state.eventSystem.processTurn(state);
    }
    
    const candlesOn = candles.flags.has('ONBIT' as any);
    const stageIndex = state.getGlobalVariable('CANDLE_STAGE_INDEX') || 0;
    const ticksRemaining = state.eventSystem.getRemainingTicks('I-CANDLES');
    
    console.log(`Turn ${targetTurn}:`);
    console.log(`  - Candles on: ${candlesOn}`);
    console.log(`  - Stage index: ${stageIndex}`);
    console.log(`  - Ticks remaining: ${ticksRemaining}`);
    
    if (targetTurn === 20 || targetTurn === 30 || targetTurn === 35 || targetTurn === 40) {
      console.log(`  - Expected warning at this turn`);
    }
    console.log();
  }
  
  console.log('=== ANALYSIS COMPLETE ===');
}

analyzeCandleTiming().catch(console.error);