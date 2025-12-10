#!/usr/bin/env tsx

/**
 * Debug script to analyze troll puzzle transcript failures
 */

import * as fs from 'fs';
import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { CommandExecutor } from './src/engine/executor.js';
import { Parser } from './src/parser/parser.js';
import { Lexer } from './src/parser/lexer.js';
import { Vocabulary } from './src/parser/vocabulary.js';
import { GameState } from './src/game/state.js';
import { GameObjectImpl } from './src/game/objects.js';
import { ObjectFlag } from './src/game/data/flags.js';
import { ALL_ROOMS } from './src/game/data/rooms-complete.js';
import { ALL_OBJECTS } from './src/game/data/objects-complete.js';
import { enableDeterministicRandom } from './src/testing/seededRandom.js';

const lexer = new Lexer();
const vocabulary = new Vocabulary();
const parser = new Parser();
const executor = new CommandExecutor();

function getAvailableObjects(state: GameState): GameObjectImpl[] {
  const available: GameObjectImpl[] = [];
  const addedIds = new Set<string>();

  for (const objId of state.inventory) {
    if (!addedIds.has(objId)) {
      const obj = state.getObject(objId);
      if (obj) {
        available.push(obj as GameObjectImpl);
        addedIds.add(objId);
        
        if (obj.hasFlag(ObjectFlag.CONTBIT) && obj.hasFlag(ObjectFlag.OPENBIT)) {
          const contents = state.getObjectsInContainer(objId);
          for (const contentObj of contents) {
            if (!addedIds.has(contentObj.id)) {
              available.push(contentObj as GameObjectImpl);
              addedIds.add(contentObj.id);
            }
          }
        }
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
          
          if (obj.hasFlag(ObjectFlag.CONTBIT) && obj.hasFlag(ObjectFlag.OPENBIT)) {
            const contents = state.getObjectsInContainer(objId);
            for (const contentObj of contents) {
              if (!addedIds.has(contentObj.id)) {
                available.push(contentObj as GameObjectImpl);
                addedIds.add(contentObj.id);
              }
            }
          }
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

function executeCommand(command: string, state: GameState): string {
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
    return `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function normalizeWhitespace(str: string): string {
  return str
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n\n+/g, '<<PARA>>')
    .replace(/\n/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/<<PARA>>/g, '\n\n')
    .trim();
}

// Enable deterministic random for consistent combat outcomes
enableDeterministicRandom(12345);

// Load the transcript
const transcript = JSON.parse(fs.readFileSync('.kiro/transcripts/critical/05-troll-puzzle.json', 'utf-8'));

console.log('='.repeat(80));
console.log('TROLL PUZZLE TRANSCRIPT DEBUG');
console.log('='.repeat(80));
console.log();

const state = createInitialGameState();

for (let i = 0; i < transcript.entries.length; i++) {
  const entry = transcript.entries[i];
  console.log(`\n--- Command ${i + 1}: "${entry.command}" ---`);
  console.log(`Current room: ${state.currentRoom}`);
  
  const actualOutput = executeCommand(entry.command, state);
  
  const normExpected = normalizeWhitespace(entry.expectedOutput);
  const normActual = normalizeWhitespace(actualOutput);
  
  const match = normExpected === normActual;
  
  console.log(`\nExpected:`);
  console.log(entry.expectedOutput);
  console.log(`\nActual:`);
  console.log(actualOutput);
  console.log(`\nMatch: ${match ? '✓ YES' : '✗ NO'}`);
  
  if (!match) {
    for (let j = 0; j < Math.max(normExpected.length, normActual.length); j++) {
      if (normExpected[j] !== normActual[j]) {
        console.log(`\nFirst difference at position ${j}:`);
        console.log(`  Expected: "${normExpected.substring(j, j + 50)}..."`);
        console.log(`  Actual:   "${normActual.substring(j, j + 50)}..."`);
        break;
      }
    }
  }
}
