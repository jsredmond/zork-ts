import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { initializeLampTimer, initializeCandleTimer } from './src/engine/daemons.js';

const state = createInitialGameState();
console.log('=== Multiple Daemon Test ===');

// Set up lamp
state.addToInventory('LAMP');
const lamp = state.getObject('LAMP');
if (lamp) {
  lamp.addFlag('ONBIT');
  initializeLampTimer(state);
  console.log('Lamp timer initialized');
}

// Set up candles
state.addToInventory('CANDLES');
const candles = state.getObject('CANDLES');
if (candles) {
  candles.addFlag('ONBIT');
  initializeCandleTimer(state);
  console.log('Candle timer initialized');
}

// Check all daemon statuses
console.log('\nDaemon statuses:');
console.log('I-LANTERN:', state.eventSystem.getEventStatus('I-LANTERN'));
console.log('I-CANDLES:', state.eventSystem.getEventStatus('I-CANDLES'));
console.log('I-THIEF:', state.eventSystem.getEventStatus('I-THIEF'));
console.log('combat:', state.eventSystem.getEventStatus('combat'));

// Run some turns to see multiple daemons working
console.log('\nRunning turns:');
for (let i = 0; i < 25; i++) {
  const result = state.eventSystem.processTurn(state);
  if (result) {
    console.log(`Turn ${i + 1}: Event occurred`);
    console.log('  Lamp remaining:', state.eventSystem.getRemainingTicks('I-LANTERN'));
    console.log('  Candle remaining:', state.eventSystem.getRemainingTicks('I-CANDLES'));
    console.log('  Thief location:', state.getObject('THIEF')?.location);
  }
}