/**
 * Test egg/nest puzzle behavior
 */

import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { CommandExecutor } from './src/engine/executor.js';
import { Parser } from './src/parser/parser.js';
import { Lexer } from './src/parser/lexer.js';
import { Vocabulary } from './src/parser/vocabulary.js';

const state = createInitialGameState();
const executor = new CommandExecutor();
const parser = new Parser();
const lexer = new Lexer();
const vocabulary = new Vocabulary();

// Enable deterministic mode
state.setFlag('DETERMINISTIC', true);

console.log('=== Testing Egg/Nest Puzzle ===\n');

// Navigate to PATH
const commands = [
  'n',  // North of House
  'n',  // PATH
  'up', // UP-A-TREE
  'look',
  'take nest',
  'open nest',
  'examine egg',
  'take egg',
  'inventory',
  'drop nest',
  'look',
  'down',
  'look',
  'examine nest',
  'up',
  'drop egg',
  'down',
  'look',
  'examine egg'
];

for (const cmd of commands) {
  console.log(`> ${cmd}`);
  const tokens = lexer.tokenize(cmd);
  
  // Classify tokens with vocabulary
  const processedTokens = tokens.map(token => ({
    ...token,
    word: vocabulary.expandAbbreviation(token.word),
    type: vocabulary.lookupWord(vocabulary.expandAbbreviation(token.word)),
  }));
  
  const availableObjects = [
    ...state.getObjectsInCurrentRoom(),
    ...state.getInventoryObjects()
  ];
  const parsed = parser.parse(processedTokens, availableObjects);
  const result = executor.execute(parsed, state);
  console.log(result.message);
  console.log();
}
