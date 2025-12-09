#!/usr/bin/env tsx
/**
 * Debug script for coffin puzzle transcript
 */

import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { Parser } from './src/parser/parser.js';
import { CommandExecutor } from './src/engine/executor.js';
import { ObjectFlag } from './src/game/data/flags.js';

const state = createInitialGameState();
const parser = new Parser();
const executor = new CommandExecutor();

// Commands from transcript
const commands = [
  'n', 'e', 'open window', 'w', 'w', 'take lamp', 'move rug', 
  'open trap door', 'turn on lamp', 'd', 'n',
  'e',  // Command 12 - first block
  'se', // Command 13 - should have troll attack
  'look', // Command 14 - should have troll attack
];

console.log('=== Coffin Puzzle Debug ===\n');

for (let i = 0; i < commands.length; i++) {
  const cmd = commands[i];
  console.log(`\n[${i + 1}] > ${cmd}`);
  
  const parsed = parser.parse(cmd, state);
  const result = executor.execute(parsed, state);
  
  console.log(result.message);
  
  // After command 12, check troll state
  if (i === 11) {
    const troll = state.getObject('TROLL');
    console.log('\n--- Troll State After First Block ---');
    console.log('Location:', troll?.location);
    console.log('Has FIGHTBIT:', troll?.flags.has(ObjectFlag.FIGHTBIT));
    console.log('Current room:', state.currentRoom);
    console.log('Block count:', state.getGlobalVariable('TROLL_BLOCK_COUNT'));
    
    // Check if combat daemon is registered
    const events = (state.eventSystem as any).events;
    const combatEvent = events.get('combat');
    console.log('Combat daemon registered:', !!combatEvent);
    if (combatEvent) {
      console.log('Combat daemon enabled:', combatEvent.enabled);
      console.log('Combat daemon is daemon:', combatEvent.isDaemon);
    }
  }
  
  // After command 13, check why no attack
  if (i === 12) {
    const troll = state.getObject('TROLL');
    console.log('\n--- Troll State After Command 13 ---');
    console.log('Location:', troll?.location);
    console.log('Has FIGHTBIT:', troll?.flags.has(ObjectFlag.FIGHTBIT));
    console.log('Current room:', state.currentRoom);
  }
}
