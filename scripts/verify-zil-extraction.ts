#!/usr/bin/env ts-node
/**
 * Verification script to compare extracted data against ZIL source
 * Checks for missing or incomplete object/room data
 */

import * as fs from 'fs';
import * as path from 'path';

// Read ZIL file
const zilPath = path.join(process.cwd(), '1dungeon.zil');
const zilContent = fs.readFileSync(zilPath, 'utf-8');

// Extract all OBJECT definitions from ZIL
const objectMatches = zilContent.matchAll(/<OBJECT\s+(\w+)/g);
const zilObjects = Array.from(objectMatches).map(m => m[1]);

// Extract all ROOM definitions from ZIL
const roomMatches = zilContent.matchAll(/<ROOM\s+(\w+)/g);
const zilRooms = Array.from(roomMatches).map(m => m[1]);

console.log('=== ZIL Source Analysis ===\n');
console.log(`Total OBJECTS in ZIL: ${zilObjects.length}`);
console.log(`Total ROOMS in ZIL: ${zilRooms.length}`);

// Read our TypeScript data files
const objectsPath = path.join(process.cwd(), 'src/game/data/objects-complete.ts');
const roomsPath = path.join(process.cwd(), 'src/game/data/rooms-complete.ts');

const objectsContent = fs.readFileSync(objectsPath, 'utf-8');
const roomsContent = fs.readFileSync(roomsPath, 'utf-8');

// Extract object IDs from our data
const ourObjectMatches = objectsContent.matchAll(/'([A-Z0-9-]+)':\s*{/g);
const ourObjects = Array.from(ourObjectMatches).map(m => m[1]);

// Extract room IDs from our data
const ourRoomMatches = roomsContent.matchAll(/'([A-Z0-9-]+)':\s*{/g);
const ourRooms = Array.from(ourRoomMatches).map(m => m[1]);

console.log(`\nTotal OBJECTS in our data: ${ourObjects.length}`);
console.log(`Total ROOMS in our data: ${ourRooms.length}`);

// Find missing objects
const missingObjects = zilObjects.filter(obj => !ourObjects.includes(obj));
const extraObjects = ourObjects.filter(obj => !zilObjects.includes(obj));

// Find missing rooms
const missingRooms = zilRooms.filter(room => !ourRooms.includes(room));
const extraRooms = ourRooms.filter(room => !zilRooms.includes(room));

console.log('\n=== Missing Objects ===');
if (missingObjects.length === 0) {
  console.log('✓ All objects from ZIL are present');
} else {
  console.log(`⚠ ${missingObjects.length} objects missing:`);
  missingObjects.forEach(obj => console.log(`  - ${obj}`));
}

console.log('\n=== Extra Objects (not in ZIL) ===');
if (extraObjects.length === 0) {
  console.log('✓ No extra objects');
} else {
  console.log(`ℹ ${extraObjects.length} extra objects (may be intentional):`);
  extraObjects.forEach(obj => console.log(`  - ${obj}`));
}

console.log('\n=== Missing Rooms ===');
if (missingRooms.length === 0) {
  console.log('✓ All rooms from ZIL are present');
} else {
  console.log(`⚠ ${missingRooms.length} rooms missing:`);
  missingRooms.forEach(room => console.log(`  - ${room}`));
}

console.log('\n=== Extra Rooms (not in ZIL) ===');
if (extraRooms.length === 0) {
  console.log('✓ No extra rooms');
} else {
  console.log(`ℹ ${extraRooms.length} extra rooms (may be intentional):`);
  extraRooms.forEach(room => console.log(`  - ${room}`));
}

// Check for incomplete TEXT properties in readable objects
console.log('\n=== Checking TEXT Properties ===');
const readableObjects = zilObjects.filter(obj => {
  const objDef = zilContent.substring(
    zilContent.indexOf(`<OBJECT ${obj}`),
    zilContent.indexOf('>', zilContent.indexOf(`<OBJECT ${obj}`) + 1) + 1
  );
  return objDef.includes('READBIT') && objDef.includes('(TEXT');
});

console.log(`Found ${readableObjects.length} readable objects with TEXT in ZIL`);
let incompleteTexts = 0;

for (const obj of readableObjects) {
  if (ourObjects.includes(obj)) {
    // Check if our version has text property
    const objMatch = objectsContent.match(new RegExp(`'${obj}':\\s*{[^}]+text:\\s*'([^']*)'`, 's'));
    if (!objMatch) {
      console.log(`  ⚠ ${obj}: No text property found`);
      incompleteTexts++;
    } else {
      const textLength = objMatch[1].length;
      if (textLength < 50) {
        console.log(`  ⚠ ${obj}: Text seems short (${textLength} chars)`);
        incompleteTexts++;
      }
    }
  }
}

if (incompleteTexts === 0) {
  console.log('✓ All readable objects have text');
}

console.log('\n=== Summary ===');
const issues = missingObjects.length + missingRooms.length + incompleteTexts;
if (issues === 0) {
  console.log('✅ No issues found! Data extraction appears complete.');
} else {
  console.log(`⚠️  Found ${issues} potential issues that should be reviewed.`);
}

process.exit(issues > 0 ? 1 : 0);
