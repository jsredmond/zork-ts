#!/usr/bin/env tsx

import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { CommandExecutor } from './src/engine/executor.js';
import { Parser } from './src/parser/parser.js';
import { Lexer } from './src/parser/lexer.js';
import { Vocabulary } from './src/parser/vocabulary.js';
import { GameState } from './src/game/state.js';
import { enableDeterministicRandom } from './src/testing/seededRandom.js';

// Enable deterministic random for consistent results
enableDeterministicRandom(12345);

const state = createInitialGameState();
const lexer = new Lexer();
const vocabulary = new Vocabulary();
const parser = new Parser();
const executor = new CommandExecutor();

function executeCommand(command: string): string {
  try {
    const tokens = lexer.tokenize(command);
    const parseResult = parser.parse(tokens, vocabulary, state);
    
    if (!parseResult.success) {
      return parseResult.error || 'I don\'t understand that.';
    }
    
    const result = executor.execute(parseResult.command, state);
    return result.output;
  } catch (error) {
    return `Error: ${error}`;
  }
}

// Test all easter egg commands from the transcript
const commands = [
  'xyzzy',
  'plugh', 
  'plover',
  'fee fie foe foo',
  'say hello',
  'echo test',
  'scream',
  'yell',
  'dance',
  'swim',
  'climb tree',
  'dig',
  'sleep',
  'wake up',
  'find myself'
];

const expected = [
  'A hollow voice says "Fool."',
  'A hollow voice says "Fool."',
  'A hollow voice says "Fool."',
  'I don\'t know the word "fee".',
  'Okay.\n"Hello"',
  'The acoustics of the room are excellent.',
  'Aaaarrrrrrgggggghhhhhh!',
  'Aaaarrrrrrgggggghhhhhh!',
  'You dance a little jig.',
  'You can\'t swim here.',
  'You can\'t climb that.',
  'Digging with your hands is slow and tedious.',
  'You can\'t sleep here.',
  'You aren\'t asleep.',
  'You are right here!'
];

console.log('Testing Easter Egg Commands:');
console.log('============================');

for (let i = 0; i < commands.length; i++) {
  const command = commands[i];
  const expectedOutput = expected[i];
  const actualOutput = executeCommand(command);
  
  const match = actualOutput === expectedOutput;
  console.log(`\n[${i + 1}/${commands.length}] > ${command}`);
  console.log(`Expected: "${expectedOutput}"`);
  console.log(`Actual:   "${actualOutput}"`);
  console.log(`Match: ${match ? '✓' : '✗'}`);
  
  if (!match) {
    console.log(`Length diff: expected ${expectedOutput.length}, actual ${actualOutput.length}`);
    // Show character differences
    for (let j = 0; j < Math.max(expectedOutput.length, actualOutput.length); j++) {
      const expectedChar = expectedOutput[j] || '(end)';
      const actualChar = actualOutput[j] || '(end)';
      if (expectedChar !== actualChar) {
        console.log(`  Diff at pos ${j}: expected '${expectedChar}' (${expectedOutput.charCodeAt(j) || 'N/A'}), actual '${actualChar}' (${actualOutput.charCodeAt(j) || 'N/A'})`);
        break;
      }
    }
  }
}