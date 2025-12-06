#!/usr/bin/env tsx
/**
 * Categorize extracted ZIL messages by type and priority
 * This helps prioritize implementation work
 */

import * as fs from 'fs';
import * as path from 'path';

export enum MessageCategory {
  SCENERY_INTERACTION = 'scenery',      // Boards, walls, trees
  SPECIAL_BEHAVIOR = 'special',         // Water, ghosts, complex objects
  CONDITIONAL_STATE = 'conditional',    // State-dependent messages
  GENERIC_VARIATION = 'generic',        // Alternative phrasings
  ERROR_MESSAGE = 'error',              // Failure/refusal messages
  PUZZLE_SPECIFIC = 'puzzle'            // Puzzle-related feedback
}

export enum Priority {
  CRITICAL = 'critical',    // Affects gameplay
  HIGH = 'high',            // Important for experience
  MEDIUM = 'medium',        // Nice to have
  LOW = 'low'               // Polish/flavor
}

interface ZilMessage {
  file: string;
  line: number;
  context: string;
  message: string;
  type: 'TELL' | 'JIGS-UP' | 'DESC' | 'LDESC' | 'TEXT' | 'FDESC';
  object?: string;
  verb?: string;
  condition?: string;
}

export interface CategorizedMessage extends ZilMessage {
  category: MessageCategory;
  priority: Priority;
  implementationNotes: string;
}

/**
 * Scenery objects that are non-interactive environmental elements
 */
const SCENERY_OBJECTS = new Set([
  'BOARD', 'WALL', 'GRANITE-WALL', 'TREE', 'FOREST', 'MOUNTAIN-RANGE',
  'SONGBIRD', 'WHITE-HOUSE', 'TEETH', 'GROUND', 'SKY', 'CEILING',
  'FLOOR', 'LEAVES', 'BRANCH', 'ROCK', 'STONE', 'SAND', 'DIRT'
]);

/**
 * Objects with special complex behaviors
 */
const SPECIAL_OBJECTS = new Set([
  'WATER', 'GLOBAL-WATER', 'GHOSTS', 'BASKET', 'BOAT', 'LAMP',
  'CANDLES', 'MIRROR', 'COFFIN', 'CYCLOPS', 'THIEF', 'TROLL'
]);

/**
 * Puzzle-critical objects
 */
const PUZZLE_OBJECTS = new Set([
  'DAM', 'BOLT', 'WRENCH', 'MIRROR', 'CYCLOPS', 'THIEF', 'TROLL',
  'EGG', 'CANARY', 'BASKET', 'ROPE', 'COFFIN', 'SCEPTRE', 'CHALICE'
]);

/**
 * Generic error/refusal verbs
 */
const ERROR_VERBS = new Set([
  'TAKE', 'DROP', 'PUT', 'GIVE', 'THROW', 'ATTACK', 'KILL',
  'OPEN', 'CLOSE', 'LOCK', 'UNLOCK', 'TURN', 'PUSH', 'PULL'
]);

/**
 * Categorize a message based on its context and content
 */
export function categorizeMessage(msg: ZilMessage): CategorizedMessage {
  let category: MessageCategory;
  let priority: Priority;
  let implementationNotes = '';

  // Check JIGS-UP first (death messages are always critical errors)
  if (msg.type === 'JIGS-UP') {
    category = MessageCategory.ERROR_MESSAGE;
    priority = Priority.CRITICAL;
    implementationNotes = 'Death message';
  } else if (msg.object && PUZZLE_OBJECTS.has(msg.object)) {
    // Puzzle objects are critical
    category = MessageCategory.PUZZLE_SPECIFIC;
    priority = Priority.CRITICAL;
    implementationNotes = `Puzzle-related message for ${msg.object}`;
  } else if (msg.object && SCENERY_OBJECTS.has(msg.object)) {
    category = MessageCategory.SCENERY_INTERACTION;
    priority = Priority.LOW;
    implementationNotes = `Scenery interaction for ${msg.object}`;
  } else if (msg.object && SPECIAL_OBJECTS.has(msg.object)) {
    category = MessageCategory.SPECIAL_BEHAVIOR;
    priority = Priority.HIGH;
    implementationNotes = `Special behavior for ${msg.object}`;
  } else if (msg.condition) {
    // Messages with conditions are state-dependent
    category = MessageCategory.CONDITIONAL_STATE;
    priority = Priority.MEDIUM;
    implementationNotes = `Conditional message: ${msg.condition}`;
  } else if (msg.verb && ERROR_VERBS.has(msg.verb)) {
    // Generic error messages
    category = MessageCategory.ERROR_MESSAGE;
    priority = Priority.MEDIUM;
    implementationNotes = `Error message for ${msg.verb}`;
  } else if (msg.context.includes('PARSER') || msg.file === 'gparser.zil') {
    // Parser messages
    category = MessageCategory.GENERIC_VARIATION;
    priority = Priority.MEDIUM;
    implementationNotes = 'Parser feedback message';
  } else if (msg.type === 'DESC' || msg.type === 'LDESC') {
    // Object/room descriptions
    category = MessageCategory.SPECIAL_BEHAVIOR;
    priority = Priority.HIGH;
    implementationNotes = 'Object/room description';
  } else {
    // Default to generic
    category = MessageCategory.GENERIC_VARIATION;
    priority = Priority.LOW;
    implementationNotes = 'Generic message';
  }

  // Adjust priority based on message characteristics
  if (msg.message.length > 100) {
    // Long messages are usually important
    if (priority === Priority.LOW) {
      priority = Priority.MEDIUM;
    }
  }

  if (msg.message.includes('puzzle') || msg.message.includes('treasure')) {
    priority = Priority.CRITICAL;
    category = MessageCategory.PUZZLE_SPECIFIC;
  }

  return {
    ...msg,
    category,
    priority,
    implementationNotes
  };
}

/**
 * Categorize all messages and generate statistics
 */
function main() {
  const messagesPath = path.join(process.cwd(), '.kiro/testing/zil-messages.json');
  const messages: ZilMessage[] = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));

  console.log(`Categorizing ${messages.length} messages...`);

  const categorized = messages.map(categorizeMessage);

  // Generate statistics
  const byCategory = new Map<MessageCategory, number>();
  const byPriority = new Map<Priority, number>();

  for (const msg of categorized) {
    byCategory.set(msg.category, (byCategory.get(msg.category) || 0) + 1);
    byPriority.set(msg.priority, (byPriority.get(msg.priority) || 0) + 1);
  }

  console.log('\nMessages by category:');
  for (const [category, count] of byCategory.entries()) {
    console.log(`  ${category}: ${count}`);
  }

  console.log('\nMessages by priority:');
  for (const [priority, count] of byPriority.entries()) {
    console.log(`  ${priority}: ${count}`);
  }

  // Save categorized messages
  const outputPath = path.join(process.cwd(), '.kiro/testing/categorized-messages.json');
  const output = {
    messages: categorized,
    statistics: {
      total: categorized.length,
      byCategory: Object.fromEntries(byCategory),
      byPriority: Object.fromEntries(byPriority)
    }
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nCategorized messages saved to: ${outputPath}`);

  // Show sample messages by category
  console.log('\n=== Sample Messages by Category ===\n');
  for (const category of Object.values(MessageCategory)) {
    const samples = categorized.filter(m => m.category === category).slice(0, 3);
    if (samples.length > 0) {
      console.log(`${category.toUpperCase()}:`);
      samples.forEach(m => {
        console.log(`  [${m.priority}] ${m.object || 'N/A'} - "${m.message.substring(0, 60)}..."`);
      });
      console.log();
    }
  }
}

// Run if this is the main module
main();
