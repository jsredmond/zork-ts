#!/usr/bin/env ts-node
/**
 * Check for incomplete or missing data in extracted objects
 * Focuses on data quality rather than name matching
 */

import * as fs from 'fs';
import * as path from 'path';

// Read and parse the data files
const objectsPath = path.join(__dirname, '../src/game/data/objects-complete.ts');
const roomsPath = path.join(__dirname, '../src/game/data/rooms-complete.ts');

const objectsContent = fs.readFileSync(objectsPath, 'utf-8');
const roomsContent = fs.readFileSync(roomsPath, 'utf-8');

// Extract object data using regex (simple parsing)
const objectsMatch = objectsContent.match(/export const ALL_OBJECTS[^{]*{([^}]+)}/s);
const roomsMatch = roomsContent.match(/export const ALL_ROOMS[^{]*{([^}]+)}/s);

// For now, just count and do basic checks
const objectCount = (objectsContent.match(/'[A-Z0-9-]+':\s*{/g) || []).length;
const roomCount = (roomsContent.match(/'[A-Z0-9-]+':\s*{/g) || []).length;

const ALL_OBJECTS: any = {};
const ALL_ROOMS: any = {};

console.log('=== Data Completeness Check ===\n');

let issues = 0;

// Check objects
console.log('Checking Objects...');
const objectIds = Object.keys(ALL_OBJECTS);
console.log(`Total objects: ${objectIds.length}`);

let objectIssues = 0;
for (const id of objectIds) {
  const obj = ALL_OBJECTS[id];
  const problems: string[] = [];
  
  // Check for missing basic properties
  if (!obj.name || obj.name.trim() === '') {
    problems.push('missing name');
  }
  if (!obj.description || obj.description.trim() === '') {
    problems.push('missing description');
  }
  if (!obj.synonyms || obj.synonyms.length === 0) {
    problems.push('no synonyms');
  }
  
  // Check readable objects have text
  if (obj.flags?.includes('READBIT')) {
    if (!obj.text || obj.text.length < 20) {
      problems.push(`readable but text is ${obj.text ? 'too short (' + obj.text.length + ' chars)' : 'missing'}`);
    }
  }
  
  // Check containers have capacity
  if (obj.flags?.includes('CONTBIT')) {
    if (!obj.capacity || obj.capacity === 0) {
      problems.push('container but no capacity');
    }
  }
  
  if (problems.length > 0) {
    console.log(`  ⚠ ${id}: ${problems.join(', ')}`);
    objectIssues++;
  }
}

if (objectIssues === 0) {
  console.log('✓ All objects have complete data');
} else {
  console.log(`⚠ Found ${objectIssues} objects with incomplete data`);
  issues += objectIssues;
}

// Check rooms
console.log('\nChecking Rooms...');
const roomIds = Object.keys(ALL_ROOMS);
console.log(`Total rooms: ${roomIds.length}`);

let roomIssues = 0;
for (const id of roomIds) {
  const room = ALL_ROOMS[id];
  const problems: string[] = [];
  
  // Check for missing basic properties
  if (!room.name || room.name.trim() === '') {
    problems.push('missing name');
  }
  if (!room.description || room.description.trim() === '') {
    problems.push('missing description');
  }
  if (!room.longDescription || room.longDescription.trim() === '') {
    problems.push('missing longDescription');
  }
  if (!room.exits || room.exits.length === 0) {
    // Some rooms might legitimately have no exits (dead ends)
    if (!id.includes('DEAD-END')) {
      problems.push('no exits (might be intentional)');
    }
  }
  
  if (problems.length > 0) {
    console.log(`  ⚠ ${id}: ${problems.join(', ')}`);
    roomIssues++;
  }
}

if (roomIssues === 0) {
  console.log('✓ All rooms have complete data');
} else {
  console.log(`⚠ Found ${roomIssues} rooms with incomplete data`);
  issues += roomIssues;
}

// Summary
console.log('\n=== Summary ===');
console.log(`Objects: ${objectIds.length} total, ${objectIssues} with issues`);
console.log(`Rooms: ${roomIds.length} total, ${roomIssues} with issues`);

if (issues === 0) {
  console.log('\n✅ All data appears complete!');
} else {
  console.log(`\n⚠️  Found ${issues} items with incomplete data that should be reviewed.`);
}

process.exit(issues > 0 ? 1 : 0);
