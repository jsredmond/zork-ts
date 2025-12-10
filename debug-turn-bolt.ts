#!/usr/bin/env tsx

import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { CommandExecutor } from './src/engine/executor.js';
import { Parser } from './src/parser/parser.js';
import { Lexer } from './src/parser/lexer.js';
import { Vocabulary } from './src/parser/vocabulary.js';
import { GameObjectImpl } from './src/game/objects.js';
import { ObjectFlag } from './src/game/data/flags.js';
import { ALL_ROOMS } from './src/game/data/rooms-complete.js';
import { ALL_OBJECTS } from './src/game/data/objects-complete.js';

const lexer = new Lexer();
const vocabulary = new Vocabulary();
const parser = new Parser();
const executor = new CommandExecutor();

function getAvailableObjects(state: any): GameObjectImpl[] {
  const available: GameObjectImpl[] = [];
  const addedIds = new Set<string>();

  for (const objId of state.inventory) {
    if (!addedIds.has(objId)) {
      const obj = state.getObject(objId);
      if (obj) {
        available.push(obj as GameObjectImpl);
        addedIds.add(objId);
      }
    }
  }

  const room = state.getCurrentRoom();
  if (room) {
    for (const objId of room.objects) {
      if (!addedIds.has(objId)) {
        const obj = state.getObject(objId);
        if (obj) {
          available.push(obj as GameObjectImpl);
          addedIds.add(objId);
        }
      }
    }
    
    const roomData = ALL_ROOMS[room.id];
    if (roomData && roomData.globalObjects) {
      for (const objId of roomData.globalObjects) {
        if (!addedIds.has(objId)) {
          const obj = state.getObject(objId);
          if (obj) {
            available.push(obj as GameObjectImpl);
            addedIds.add(objId);
          }
        }
      }
    }
  }

  for (const [objId, obj] of state.objects.entries()) {
    if (!addedIds.has(objId) && obj.location === null && obj.hasFlag(ObjectFlag.NDESCBIT)) {
      const objData = ALL_OBJECTS[objId];
      if (objData && objData.initialLocation === 'GLOBAL-OBJECTS') {
        available.push(obj as GameObjectImpl);
        addedIds.add(objId);
      }
    }
  }

  return available;
}

function executeCommand(command: string, state: any): string {
  try {
    const tokens = lexer.tokenize(command);
    
    const processedTokens = tokens.map(token => {
      const expandedWord = vocabulary.expandAbbreviation(token.word);
      return {
        ...token,
        word: expandedWord,
        type: vocabulary.lookupWord(expandedWord),
      };
    });

    const availableObjects = getAvailableObjects(state);
    const parsedCommand = parser.parse(processedTokens, availableObjects);

    const result = executor.execute(parsedCommand, state);

    return result.message || '';
  } catch (error) {
    console.error('Error:', error);
    return `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }
}

const state = createInitialGameState();

// Teleport to DAM-ROOM
state.currentRoom = 'DAM-ROOM';

// Give player the wrench
state.moveObject('WRENCH', 'PLAYER');

// Set GATE_FLAG
state.setGlobalVariable('GATE_FLAG', true);

console.log('Current room:', state.currentRoom);
console.log('Has wrench:', state.isInInventory('WRENCH'));
console.log('GATE_FLAG:', state.getGlobalVariable('GATE_FLAG'));

// Check BOLT object
const bolt = state.getObject('BOLT');
console.log('BOLT location:', bolt?.location);
console.log('BOLT has TURNBIT:', bolt?.hasFlag(ObjectFlag.TURNBIT));

// Try turning the bolt
console.log('\nExecuting: turn bolt with wrench');
const result = executeCommand('turn bolt with wrench', state);
console.log('Result:', result);
