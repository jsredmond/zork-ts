#!/usr/bin/env npx tsx

import { createInitialGameState } from './src/game/factories/gameFactory.js';
import { Parser } from './src/parser/parser.js';
import { Vocabulary } from './src/parser/vocabulary.js';
import { CommandExecutor } from './src/engine/executor.js';

const state = createInitialGameState();
const parser = new Parser(new Vocabulary());
const executor = new CommandExecutor();

console.log('=== Testing Leaflet ===');

// Check if ADVERTISEMENT object exists
const leaflet = state.objects.get('ADVERTISEMENT');
console.log('ADVERTISEMENT object exists:', !!leaflet);
if (leaflet) {
  console.log('Leaflet name:', leaflet.name);
  console.log('Leaflet synonyms:', leaflet.synonyms);
  console.log('Leaflet text:', leaflet.text);
}

// Open mailbox first
let parsed = parser.parse('open mailbox', state, 'open mailbox');
let result = executor.execute(parsed, state);
console.log('\nOpen mailbox:', result.message);

// Take leaflet
parsed = parser.parse('take leaflet', state, 'take leaflet');
result = executor.execute(parsed, state);
console.log('Take leaflet:', result.message);

// Examine leaflet
parsed = parser.parse('examine leaflet', state, 'examine leaflet');
result = executor.execute(parsed, state);
console.log('Examine leaflet:', result.message);

// Read leaflet
parsed = parser.parse('read leaflet', state, 'read leaflet');
result = executor.execute(parsed, state);
console.log('Read leaflet:', result.message);