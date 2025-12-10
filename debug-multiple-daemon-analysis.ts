#!/usr/bin/env npx tsx

/**
 * Debug script to analyze multiple daemon interactions
 * Tests how multiple daemons interact and their execution order
 */

import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { initializeLampTimer, initializeCandleTimer } from './src/engine/daemons.js';

async function analyzeMultipleDaemons() {
  console.log('=== MULTIPLE DAEMON INTERACTIONS ANALYSIS ===\n');
  
  const state = createInitialGameState();
  
  // Set up multiple daemons running simultaneously
  console.log('Setting up multiple daemons:');
  
  // 1. Turn on lamp (starts lamp timer)
  const lamp = state.getObject('LAMP');
  if (lamp) {
    state.moveObject('LAMP', 'PLAYER');
    lamp.flags.add('ONBIT' as any);
    initializeLampTimer(state);
    console.log('- Lamp timer initialized');
  }
  
  // 2. Light candles (starts candle timer)
  const candles = state.getObject('CANDLES');
  if (candles) {
    state.moveObject('CANDLES', 'PLAYER');
    candles.flags.add('ONBIT' as any);
    initializeCandleTimer(state);
    console.log('- Candle timer initialized');
  }
  
  // 3. Thief daemon is already running
  console.log('- Thief daemon already running');
  
  // 4. Combat daemon is already running
  console.log('- Combat daemon already running');
  
  // 5. Sword glow daemon is already running
  console.log('- Sword glow daemon already running');
  
  console.log();
  
  // Check initial daemon states
  console.log('Initial daemon states:');
  const eventIds = state.eventSystem.getEventIds();
  for (const eventId of eventIds) {
    const status = state.eventSystem.getEventStatus(eventId);
    if (status) {
      console.log(`- ${eventId}: enabled=${status.enabled}, daemon=${status.isDaemon}, ticks=${status.ticksRemaining}`);
    }
  }
  console.log();
  
  // Test daemon execution order over several turns
  console.log('Daemon execution over 5 turns:');
  for (let turn = 1; turn <= 5; turn++) {
    console.log(`\n--- Turn ${turn} ---`);
    console.log(`Before: moves=${state.moves}`);
    
    // Track which daemons cause state changes
    const beforeState = {
      thiefLocation: state.getObject('THIEF')?.location,
      lampStage: state.getGlobalVariable('LAMP_STAGE_INDEX'),
      candleStage: state.getGlobalVariable('CANDLE_STAGE_INDEX'),
      lampTicks: state.eventSystem.getRemainingTicks('I-LANTERN'),
      candleTicks: state.eventSystem.getRemainingTicks('I-CANDLES')
    };
    
    const stateChanged = state.eventSystem.processTurn(state);
    
    const afterState = {
      thiefLocation: state.getObject('THIEF')?.location,
      lampStage: state.getGlobalVariable('LAMP_STAGE_INDEX'),
      candleStage: state.getGlobalVariable('CANDLE_STAGE_INDEX'),
      lampTicks: state.eventSystem.getRemainingTicks('I-LANTERN'),
      candleTicks: state.eventSystem.getRemainingTicks('I-CANDLES')
    };
    
    console.log(`After: moves=${state.moves}, stateChanged=${stateChanged}`);
    
    // Report changes
    if (beforeState.thiefLocation !== afterState.thiefLocation) {
      console.log(`  Thief moved: ${beforeState.thiefLocation} -> ${afterState.thiefLocation}`);
    }
    
    if (beforeState.lampStage !== afterState.lampStage) {
      console.log(`  Lamp stage changed: ${beforeState.lampStage} -> ${afterState.lampStage}`);
    }
    
    if (beforeState.candleStage !== afterState.candleStage) {
      console.log(`  Candle stage changed: ${beforeState.candleStage} -> ${afterState.candleStage}`);
    }
    
    if (beforeState.lampTicks !== afterState.lampTicks) {
      console.log(`  Lamp ticks: ${beforeState.lampTicks} -> ${afterState.lampTicks}`);
    }
    
    if (beforeState.candleTicks !== afterState.candleTicks) {
      console.log(`  Candle ticks: ${beforeState.candleTicks} -> ${afterState.candleTicks}`);
    }
  }
  
  console.log('\n=== DAEMON EXECUTION ORDER TEST ===');
  
  // Test specific daemon execution order by advancing to warning points
  const freshState = createInitialGameState();
  
  // Set up both timers to trigger at the same time
  const freshLamp = freshState.getObject('LAMP');
  const freshCandles = freshState.getObject('CANDLES');
  
  if (freshLamp && freshCandles) {
    freshState.moveObject('LAMP', 'PLAYER');
    freshState.moveObject('CANDLES', 'PLAYER');
    freshLamp.flags.add('ONBIT' as any);
    freshCandles.flags.add('ONBIT' as any);
    
    // Manually set timers to trigger on same turn
    freshState.eventSystem.queueInterrupt('I-LANTERN', 3);
    freshState.eventSystem.queueInterrupt('I-CANDLES', 3);
    
    console.log('Set both timers to trigger in 3 turns');
    
    // Advance to trigger turn
    for (let i = 0; i < 4; i++) {
      console.log(`\nTurn ${i + 1}:`);
      console.log(`  Lamp ticks: ${freshState.eventSystem.getRemainingTicks('I-LANTERN')}`);
      console.log(`  Candle ticks: ${freshState.eventSystem.getRemainingTicks('I-CANDLES')}`);
      
      const changed = freshState.eventSystem.processTurn(freshState);
      console.log(`  State changed: ${changed}`);
      
      if (i === 2) { // Turn when both should trigger
        console.log('  Both timers should have triggered this turn');
      }
    }
  }
  
  console.log('\n=== TIMING CONFLICT ANALYSIS ===');
  
  // Test what happens when multiple events need to run
  console.log('Testing simultaneous daemon execution:');
  console.log('- Daemons run every turn: combat, I-SWORD, I-THIEF');
  console.log('- Interrupts run when ticks reach 0: I-LANTERN, I-CANDLES');
  console.log('- All events are processed in registration order');
  console.log('- Move counter is incremented after all events');
  
  console.log('\n=== ANALYSIS COMPLETE ===');
}

analyzeMultipleDaemons().catch(console.error);