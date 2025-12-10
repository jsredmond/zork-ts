#!/usr/bin/env npx tsx

/**
 * Debug script to test candle burning transcript commands individually
 */

import { createInitialGameState } from './src/game/factories/gameFactory.js';

async function testCandleCommands() {
  console.log('=== CANDLE TRANSCRIPT DEBUG TEST ===\n');
  
  const state = createInitialGameState();
  
  // Setup: teleport to living room, get candles, light them
  console.log('=== Setup ===');
  state.currentRoom = 'LIVING-ROOM';
  state.moveObject('CANDLES', 'PLAYER');
  const candles = state.getObject('CANDLES');
  if (candles) {
    candles.flags.add('ONBIT' as any);
    console.log('Candles lit and in inventory');
  }
  
  // Test debug commands
  console.log('\n=== Debug Commands Test ===');
  
  // Test setcandlefuel 21
  console.log('> setcandlefuel 21');
  const result1 = setcandlefuel(21, state);
  console.log(result1);
  
  // Test advance 1
  console.log('\n> advance 1');
  const result2 = advance(1, state);
  console.log(result2);
  
  // Test setcandlefuel 11
  console.log('\n> setcandlefuel 11');
  const result3 = setcandlefuel(11, state);
  console.log(result3);
  
  // Test advance 1
  console.log('\n> advance 1');
  const result4 = advance(1, state);
  console.log(result4);
  
  // Test setcandlefuel 6
  console.log('\n> setcandlefuel 6');
  const result5 = setcandlefuel(6, state);
  console.log(result5);
  
  // Test advance 1
  console.log('\n> advance 1');
  const result6 = advance(1, state);
  console.log(result6);
  
  // Test setcandlefuel 1
  console.log('\n> setcandlefuel 1');
  const result7 = setcandlefuel(1, state);
  console.log(result7);
  
  // Test advance 1
  console.log('\n> advance 1');
  const result8 = advance(1, state);
  console.log(result8);
  
  // Test look
  console.log('\n> look');
  const currentRoom = state.getRoom(state.currentRoom);
  console.log(`Current room: ${state.currentRoom}`);
  console.log(`Room description: ${currentRoom?.description || 'No description'}`);
}

function setcandlefuel(turns: number, state: any): string {
  if (!isNaN(turns) && turns >= 0 && turns <= 40) {
    // Calculate which stage we should be in based on fuel remaining
    let stage = 0;
    let ticksRemaining = 0;
    
    if (turns > 20) {
      // Stage 0: Initial stage, warning at turn 20
      stage = 0;
      ticksRemaining = 40 - turns; // Turns until first warning
    } else if (turns > 10) {
      // Stage 1: First warning given, next at turn 30 (when fuel = 10)
      stage = 1;
      ticksRemaining = 20 - turns; // Turns until second warning
    } else if (turns > 5) {
      // Stage 2: Second warning given, next at turn 35 (when fuel = 5)
      stage = 2;
      ticksRemaining = 10 - turns; // Turns until third warning
    } else if (turns > 0) {
      // Stage 3: Third warning given, candles die at turn 40 (when fuel = 0)
      stage = 3;
      ticksRemaining = 5 - turns; // Turns until candles die
    } else {
      // Candles are dead
      stage = 4;
      ticksRemaining = 0;
    }
    
    state.setGlobalVariable('CANDLE_STAGE_INDEX', stage);
    
    // Set up the candle event
    const events = (state as any).eventSystem.events;
    const candleEvent = events.get('I-CANDLES');
    if (candleEvent && stage < 4) {
      candleEvent.ticksRemaining = ticksRemaining;
      candleEvent.enabled = true;
    } else if (candleEvent) {
      candleEvent.enabled = false;
    }
    
    return `[DEBUG: Set candle fuel to ${turns} turns (stage ${stage}, next event in ${ticksRemaining} turns)]`;
  }
  return `[DEBUG: Invalid fuel level (0-40)]`;
}

function advance(turns: number, state: any): string {
  if (!isNaN(turns) && turns > 0) {
    const messages: string[] = [];
    
    for (let i = 0; i < turns; i++) {
      state.eventSystem.processTurn(state);
    }
    
    return `[DEBUG: Advanced ${turns} turns to turn ${state.moves}]`;
  }
  return `[DEBUG: Invalid turn count]`;
}

testCandleCommands().catch(console.error);