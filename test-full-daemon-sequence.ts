import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { initializeLampTimer, initializeCandleTimer } from './src/engine/daemons.js';

const state = createInitialGameState();
console.log('=== Full Daemon Sequence Test ===');

// Set up lamp and candles
state.addToInventory('LAMP');
state.addToInventory('CANDLES');
const lamp = state.getObject('LAMP');
const candles = state.getObject('CANDLES');

if (lamp) {
  lamp.addFlag('ONBIT');
  initializeLampTimer(state);
}

if (candles) {
  candles.addFlag('ONBIT');
  initializeCandleTimer(state);
}

console.log('Both timers initialized');
console.log('Lamp warnings expected at turns: 100, 130, 185, 200');
console.log('Candle warnings expected at turns: 20, 30, 35, 40');

// Run until both are burned out
let turn = 0;
while (turn < 210) {
  turn++;
  const result = state.eventSystem.processTurn(state);
  
  if (result) {
    console.log(`Turn ${turn}: Event occurred`);
    
    // Check what's still on
    const lampOn = lamp?.hasFlag('ONBIT') || false;
    const candlesOn = candles?.hasFlag('ONBIT') || false;
    
    if (!lampOn && !candlesOn) {
      console.log('Both light sources have burned out');
      break;
    }
  }
  
  // Show status at key points
  if ([19, 20, 21, 29, 30, 31, 34, 35, 36, 39, 40, 41, 99, 100, 101, 129, 130, 131, 184, 185, 186, 199, 200, 201].includes(turn)) {
    const lampRemaining = state.eventSystem.getRemainingTicks('I-LANTERN');
    const candleRemaining = state.eventSystem.getRemainingTicks('I-CANDLES');
    console.log(`Turn ${turn}: Lamp=${lampRemaining}, Candles=${candleRemaining}, LampOn=${lamp?.hasFlag('ONBIT')}, CandlesOn=${candles?.hasFlag('ONBIT')}`);
  }
}

console.log(`Test completed at turn ${turn}`);