/**
 * Test death and resurrection
 */

import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { CommandExecutor } from './src/engine/executor.js';

const state = createInitialGameState();
const executor = new CommandExecutor();

console.log('=== Testing Death and Resurrection ===\n');

// Test basic movement first
console.log('Starting room:', state.currentRoom);
console.log('\n1. Command: south');
let result = executor.execute(state, 'south');
console.log('Result:', result.message);
console.log('Current room:', state.currentRoom);

console.log('\n2. Command: west');
result = executor.execute(state, 'west');
console.log('Result:', result.message);
console.log('Current room:', state.currentRoom);

console.log('\n3. Command: open window');
result = executor.execute(state, 'open window');
console.log('Result:', result.message);

console.log('\n4. Command: west');
result = executor.execute(state, 'west');
console.log('Result:', result.message);
console.log('Current room:', state.currentRoom);

console.log('\n5. Command: west');
result = executor.execute(state, 'west');
console.log('Result:', result.message);
console.log('Current room:', state.currentRoom);
