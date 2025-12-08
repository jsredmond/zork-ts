import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { CommandExecutor } from './src/engine/executor.js';
import { Parser } from './src/parser/parser.js';
import { Lexer } from './src/parser/lexer.js';
import { Vocabulary } from './src/parser/vocabulary.js';

const state = createInitialGameState();
const lexer = new Lexer();
const vocabulary = new Vocabulary();
const parser = new Parser();
const executor = new CommandExecutor();

// Execute commands
const commands = ['n', 'e', 'open window', 'w'];

for (const cmd of commands) {
  console.log(`\n> ${cmd}`);
  const tokens = lexer.tokenize(cmd);
  const processedTokens = tokens.map(token => ({
    ...token,
    word: vocabulary.expandAbbreviation(token.word),
    type: vocabulary.lookupWord(token.word),
  }));
  
  const availableObjects = [];
  for (const objId of state.inventory) {
    const obj = state.getObject(objId);
    if (obj) availableObjects.push(obj);
  }
  const room = state.getCurrentRoom();
  if (room) {
    for (const objId of room.objects) {
      const obj = state.getObject(objId);
      if (obj) availableObjects.push(obj);
    }
  }
  
  const parsedCommand = parser.parse(processedTokens, availableObjects);
  const result = executor.execute(parsedCommand, state);
  
  console.log(result.message);
  console.log(`\n--- Message length: ${result.message.length} characters ---`);
}
