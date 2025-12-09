#!/usr/bin/env tsx
/**
 * Test script to verify combat daemon is working
 */

import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { CommandExecutor } from './src/engine/executor.js';
import { Parser } from './src/parser/parser.js';

const state = createInitialGameState();
const executor = new CommandExecutor();
const parser = new Parser();

// Check if combat daemon is registered
console.log('Combat daemon registered:', (state.eventSystem as any).events.has('combat'));
const combatEvent = (state.eventSystem as any).events.get('combat');
if (combatEvent) {
  console.log('Combat daemon enabled:', combatEvent.enabled);
  console.log('Combat daemon is daemon:', combatEvent.isDaemon);
}

// Navigate to troll room
const commands = [
  'n',
  'e',
  'open window',
  'w',
  'w',
  'take lamp',
  'move rug',
  'open trap door',
  'turn on lamp',
  'd',
  'n',  // Enter troll room
  'e',  // Try to leave (troll blocks)
  'look'  // Troll should attack
];

console.log('\n=== Executing commands ===\n');

for (const cmd of commands) {
  console.log(`> ${cmd}`);
  const parsed = parser.parse(cmd, state);
  const result = executor.execute(parsed, state);
  console.log(result.message);
  console.log();
}
