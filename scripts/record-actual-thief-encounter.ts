#!/usr/bin/env tsx

/**
 * Record Actual Thief Encounter Transcript with Deterministic RNG
 * 
 * This creates a proper thief encounter by going to the Treasure Room
 * where the thief lives (guaranteed encounter).
 */

import { createInitialGameState } from '../src/game/factories/gameFactory.js';
import { CommandExecutor } from '../src/engine/executor.js';
import { Parser } from '../src/parser/parser.js';
import { Lexer } from '../src/parser/lexer.js';
import { Vocabulary } from '../src/parser/vocabulary.js';
import { GameObjectImpl } from '../src/game/objects.js';
import { ALL_ROOMS } from '../src/game/data/rooms-complete.js';
import { enableDeterministicRandom } from '../src/testing/seededRandom.js';
import { createTranscriptTemplate, saveTranscript } from './create-transcript.js';
import type { TranscriptEntry } from './create-transcript.js';

// Enable deterministic random with seed 12345
enableDeterministicRandom(12345);

const state = createInitialGameState();
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

  return available;
}

function executeCommand(command: string): string {
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

// Create transcript
const transcript = createTranscriptTemplate({
  id: '20-thief-encounter-actual',
  name: 'Thief Encounter (Actual)',
  description: 'Encountering the thief in his lair (Treasure Room) with deterministic RNG (seed 12345)',
  category: 'npc',
  priority: 'high',
});

// Commands to navigate to Treasure Room (thief's lair)
// From Troll Room (after troll dead): w s e u sw e s se u
const commands = [
  { cmd: 'n', notes: 'Go north' },
  { cmd: 'e', notes: 'Go east to behind house' },
  { cmd: 'open window', notes: 'Open window' },
  { cmd: 'w', notes: 'Enter kitchen' },
  { cmd: 'w', notes: 'Go to living room' },
  { cmd: 'take lamp', notes: 'Take brass lantern' },
  { cmd: 'take sword', notes: 'Take elvish sword' },
  { cmd: 'move rug', notes: 'Move rug' },
  { cmd: 'open trap door', notes: 'Open trap door' },
  { cmd: 'turn on lamp', notes: 'Turn on lamp' },
  { cmd: 'd', notes: 'Descend to cellar' },
  { cmd: 'n', notes: 'Go to troll room' },
  { cmd: 'kill troll with sword', notes: 'Attack troll - round 1' },
  { cmd: 'kill troll with sword', notes: 'Attack troll - round 2' },
  { cmd: 'kill troll with sword', notes: 'Attack troll - round 3' },
  { cmd: 'kill troll with sword', notes: 'Attack troll - round 4' },
  { cmd: 'w', notes: 'Go west from troll room (now open)' },
  { cmd: 's', notes: 'Go south' },
  { cmd: 'e', notes: 'Go east' },
  { cmd: 'u', notes: 'Go up' },
  { cmd: 'sw', notes: 'Go southwest' },
  { cmd: 'e', notes: 'Go east' },
  { cmd: 's', notes: 'Go south' },
  { cmd: 'se', notes: 'Go southeast' },
  { cmd: 'u', notes: 'Go up to Treasure Room' },
  { cmd: 'look', notes: 'Look at the room (should see thief)' },
  { cmd: 'kill thief with sword', notes: 'Attack thief - round 1' },
  { cmd: 'kill thief with sword', notes: 'Attack thief - round 2' },
  { cmd: 'kill thief with sword', notes: 'Attack thief - round 3' },
];

console.log('=== Recording Actual Thief Encounter with Deterministic RNG (seed 12345) ===\n');

const entries: TranscriptEntry[] = [];

for (const { cmd, notes } of commands) {
  console.log(`> ${cmd}`);
  const output = executeCommand(cmd);
  console.log(output);
  console.log();

  entries.push({
    command: cmd,
    expectedOutput: output,
    notes,
  });
}

// Add entries to transcript
transcript.entries = entries;

// Save transcript
const outputPath = '.kiro/transcripts/high/20-thief-encounter-actual.json';
saveTranscript(transcript, outputPath);

console.log(`\n✓ Transcript saved to: ${outputPath}`);
console.log(`  Total entries: ${entries.length}`);
console.log(`  RNG Seed: 12345`);
