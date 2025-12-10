#!/usr/bin/env tsx

import * as fs from 'fs';
import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { CommandExecutor } from './src/engine/executor.js';
import { Parser } from './src/parser/parser.js';
import { Lexer } from './src/parser/lexer.js';
import { Vocabulary } from './src/parser/vocabulary.js';
import { GameObjectImpl } from './src/game/objects.js';
import { ObjectFlag } from './src/game/data/flags.js';
import { ALL_ROOMS } from './src/game/data/rooms-complete.js';
import { ALL_OBJECTS } from './src/game/data/objects-complete.js';
import { enableDeterministicRandom } from './src/testing/seededRandom.js';
import { initializeLampTimer, initializeCandleTimer } from './src/engine/daemons.js';

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

function executeCommand(command: string, state: any): string {
  try {
    // Handle setup commands
    if (command.startsWith('teleport ')) {
      const roomId = command.substring(9).trim();
      state.currentRoom = roomId;
      return `[DEBUG: Teleported to ${roomId}]`;
    }
    
    if (command.startsWith('give ') && !command.includes(' to ')) {
      const objectId = command.substring(5).trim();
      const obj = state.getObject(objectId);
      if (obj) {
        state.moveObject(objectId, 'PLAYER');
        return `[DEBUG: Given ${objectId}]`;
      }
      return `[DEBUG: Object ${objectId} not found]`;
    }
    
    if (command.startsWith('turnoff ')) {
      const objectId = command.substring(8).trim();
      const obj = state.getObject(objectId) as GameObjectImpl;
      if (obj) {
        obj.removeFlag(ObjectFlag.ONBIT);
        return `[DEBUG: Turned off ${objectId}]`;
      }
      return `[DEBUG: Object ${objectId} not found]`;
    }

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

function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeWhitespace(str1.toLowerCase());
  const norm2 = normalizeWhitespace(str2.toLowerCase());

  if (norm1 === norm2) return 1.0;

  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen === 0) return 1.0;

  let matches = 0;
  const minLen = Math.min(norm1.length, norm2.length);
  
  for (let i = 0; i < minLen; i++) {
    if (norm1[i] === norm2[i]) matches++;
  }

  return matches / maxLen;
}

// Enable deterministic random
enableDeterministicRandom(12345);

// Load the transcript
const transcript = JSON.parse(fs.readFileSync('.kiro/transcripts/critical/09-bell-book-candle.json', 'utf-8'));

console.log('='.repeat(80));
console.log('BELL, BOOK, AND CANDLE VERIFICATION DEBUG');
console.log('='.repeat(80));
console.log();

const state = createInitialGameState();

// Run setup commands
if (transcript.setupCommands) {
  console.log('Running setup commands...');
  for (const cmd of transcript.setupCommands) {
    console.log(`  ${cmd}`);
    executeCommand(cmd, state);
  }
  console.log();
}

for (let i = 0; i < transcript.entries.length; i++) {
  const entry = transcript.entries[i];
  console.log(`\n--- Command ${i + 1}: "${entry.command}" ---`);
  
  const actualOutput = executeCommand(entry.command, state);
  const similarity = calculateSimilarity(entry.expectedOutput, actualOutput);
  
  console.log(`Similarity: ${(similarity * 100).toFixed(1)}%`);
  console.log(`Pass: ${similarity >= 0.98 ? 'YES' : 'NO'}`);
  
  if (similarity < 0.98) {
    console.log(`\nExpected:`);
    console.log(entry.expectedOutput);
    console.log(`\nActual:`);
    console.log(actualOutput);
  }
}
