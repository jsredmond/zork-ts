/**
 * Test script to verify SE direction from Round Room to Loud Room
 */

import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { CommandExecutor } from './src/engine/executor.js';
import { Lexer } from './src/parser/lexer.js';
import { Parser } from './src/parser/parser.js';
import { Vocabulary } from './src/parser/vocabulary.js';

async function testSEDirection() {
  console.log('=== Testing SE Direction from Round Room ===\n');

  // Create game
  const state = createInitialGameState();
  const executor = new CommandExecutor();
  const vocabulary = new Vocabulary();
  const lexer = new Lexer(vocabulary);
  const parser = new Parser();

  // Navigate to Round Room
  const commands = [
    'take lamp',
    'turn on lamp',
    'open trap door',
    'down',
    'kill troll with sword',
    'kill troll with sword',
    'kill troll with sword',
    'kill troll with sword',
    'east',
    'east'
  ];

  console.log('Navigating to Round Room...\n');
  for (const cmd of commands) {
    const tokens = lexer.tokenize(cmd);
    const availableObjects = state.getAvailableObjects();
    const parsedCommand = parser.parse(tokens, availableObjects);
    
    if ('type' in parsedCommand) {
      console.log(`Command: ${cmd}`);
      console.log(`Error: ${parsedCommand.message}\n`);
      continue;
    }

    const result = executor.execute(parsedCommand, state);
    console.log(`Command: ${cmd}`);
    console.log(`Result: ${result.message}\n`);
  }

  // Check current room
  const currentRoom = state.getCurrentRoom();
  console.log(`Current room: ${currentRoom?.name} (${currentRoom?.id})\n`);

  // Check available exits
  console.log('Available exits:');
  const exits = currentRoom?.getAvailableExits() || [];
  exits.forEach(dir => {
    const exit = currentRoom?.getExit(dir);
    console.log(`  ${dir} -> ${exit?.destination}`);
  });
  console.log();

  // Try SE direction
  console.log('=== Testing SE Direction ===\n');
  
  const testCommands = ['southeast', 'se', 'go southeast', 'go se'];
  
  for (const cmd of testCommands) {
    console.log(`Command: ${cmd}`);
    
    const tokens = lexer.tokenize(cmd);
    console.log(`Tokens: ${tokens.map(t => `${t.word}(${t.type})`).join(', ')}`);
    
    const availableObjects = state.getAvailableObjects();
    const parsedCommand = parser.parse(tokens, availableObjects);
    
    if ('type' in parsedCommand) {
      console.log(`Parse Error: ${parsedCommand.message}\n`);
      continue;
    }
    
    console.log(`Parsed: verb=${parsedCommand.verb}, directObject=${parsedCommand.directObject?.name}`);
    
    const result = executor.execute(parsedCommand, state);
    console.log(`Result: ${result.message}`);
    console.log(`Success: ${result.success}`);
    console.log(`New room: ${state.getCurrentRoom()?.name}\n`);
  }
}

testSEDirection().catch(console.error);
