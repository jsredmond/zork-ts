import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as fc from 'fast-check';
import { categorizeMessage, MessageCategory, Priority, CategorizedMessage } from './categorize-messages';

/**
 * Feature: complete-text-accuracy, Property 5.3: Message categorization correctness
 * Validates: Requirements 5.3
 * 
 * Property: For any message, the categorization should be consistent and follow
 * the defined rules based on object type, context, and content.
 */

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

describe('Message Categorization', () => {
  let messages: ZilMessage[];
  let categorizedMessages: CategorizedMessage[];

  beforeAll(() => {
    // Load messages
    const messagesPath = path.join(process.cwd(), '.kiro/testing/zil-messages.json');
    messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    
    // Load categorized messages
    const categorizedPath = path.join(process.cwd(), '.kiro/testing/categorized-messages.json');
    const data = JSON.parse(fs.readFileSync(categorizedPath, 'utf-8'));
    categorizedMessages = data.messages;
  });

  /**
   * Property 5.3: Categorization completeness
   * 
   * For any message, it should be assigned exactly one category and one priority.
   */
  it('should assign a category and priority to every message', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...categorizedMessages),
        (message) => {
          // Every message must have a category
          expect(message.category).toBeTruthy();
          expect(Object.values(MessageCategory)).toContain(message.category);
          
          // Every message must have a priority
          expect(message.priority).toBeTruthy();
          expect(Object.values(Priority)).toContain(message.priority);
          
          // Every message must have implementation notes
          expect(message.implementationNotes).toBeTruthy();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Scenery objects are categorized as scenery (unless they're death messages)
   */
  it('should categorize known scenery objects correctly', () => {
    const sceneryObjects = ['BOARD', 'WALL', 'GRANITE-WALL', 'TREE', 'FOREST'];
    
    const sceneryMessages = categorizedMessages.filter(m => 
      m.object && sceneryObjects.includes(m.object) && m.type !== 'JIGS-UP'
    );
    
    expect(sceneryMessages.length).toBeGreaterThan(0);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...sceneryMessages),
        (message) => {
          expect(message.category).toBe(MessageCategory.SCENERY_INTERACTION);
          return true;
        }
      ),
      { numRuns: Math.min(50, sceneryMessages.length) }
    );
  });

  /**
   * Property: Special objects are categorized as special behavior (unless they're also puzzle objects)
   */
  it('should categorize special behavior objects correctly', () => {
    const specialObjects = ['WATER', 'GLOBAL-WATER', 'GHOSTS', 'BOAT'];
    
    const specialMessages = categorizedMessages.filter(m => 
      m.object && specialObjects.includes(m.object)
    );
    
    expect(specialMessages.length).toBeGreaterThan(0);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...specialMessages),
        (message) => {
          expect(message.category).toBe(MessageCategory.SPECIAL_BEHAVIOR);
          return true;
        }
      ),
      { numRuns: Math.min(50, specialMessages.length) }
    );
  });

  /**
   * Property: Puzzle objects are categorized as puzzle-specific
   */
  it('should categorize puzzle objects as critical priority', () => {
    const puzzleObjects = ['CYCLOPS', 'THIEF', 'TROLL', 'DAM', 'BOLT'];
    
    const puzzleMessages = categorizedMessages.filter(m => 
      m.object && puzzleObjects.includes(m.object)
    );
    
    expect(puzzleMessages.length).toBeGreaterThan(0);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...puzzleMessages),
        (message) => {
          expect(message.category).toBe(MessageCategory.PUZZLE_SPECIFIC);
          expect(message.priority).toBe(Priority.CRITICAL);
          return true;
        }
      ),
      { numRuns: Math.min(50, puzzleMessages.length) }
    );
  });

  /**
   * Property: JIGS-UP messages are critical errors
   */
  it('should categorize death messages as critical errors', () => {
    const deathMessages = categorizedMessages.filter(m => m.type === 'JIGS-UP');
    
    expect(deathMessages.length).toBeGreaterThan(0);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...deathMessages),
        (message) => {
          expect(message.category).toBe(MessageCategory.ERROR_MESSAGE);
          expect(message.priority).toBe(Priority.CRITICAL);
          return true;
        }
      ),
      { numRuns: Math.min(20, deathMessages.length) }
    );
  });

  /**
   * Property: Conditional messages are categorized correctly
   */
  it('should categorize conditional messages appropriately', () => {
    const conditionalMessages = categorizedMessages.filter(m => m.condition);
    
    expect(conditionalMessages.length).toBeGreaterThan(0);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...conditionalMessages),
        (message) => {
          // Conditional messages should have a category
          expect(message.category).toBeTruthy();
          
          // Conditional messages can be any priority depending on their type
          // JIGS-UP messages are critical even if conditional
          // Puzzle messages are critical
          // Others are typically medium/high/low
          expect(message.priority).toBeTruthy();
          expect(Object.values(Priority)).toContain(message.priority);
          
          return true;
        }
      ),
      { numRuns: Math.min(100, conditionalMessages.length) }
    );
  });

  /**
   * Property: Categorization is deterministic
   */
  it('should produce the same categorization for the same message', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...messages),
        (message) => {
          const cat1 = categorizeMessage(message);
          const cat2 = categorizeMessage(message);
          
          expect(cat1.category).toBe(cat2.category);
          expect(cat1.priority).toBe(cat2.priority);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Statistics match message counts
   */
  it('should have accurate statistics', () => {
    const categorizedPath = path.join(process.cwd(), '.kiro/testing/categorized-messages.json');
    const data = JSON.parse(fs.readFileSync(categorizedPath, 'utf-8'));
    
    // Total should match
    expect(data.statistics.total).toBe(categorizedMessages.length);
    
    // Category counts should match
    for (const category of Object.values(MessageCategory)) {
      const count = categorizedMessages.filter(m => m.category === category).length;
      expect(data.statistics.byCategory[category]).toBe(count);
    }
    
    // Priority counts should match
    for (const priority of Object.values(Priority)) {
      const count = categorizedMessages.filter(m => m.priority === priority).length;
      expect(data.statistics.byPriority[priority]).toBe(count);
    }
  });

  /**
   * Property: All categories are represented
   */
  it('should have messages in all major categories', () => {
    const categories = new Set(categorizedMessages.map(m => m.category));
    
    // We should have messages in most categories
    expect(categories.has(MessageCategory.SCENERY_INTERACTION)).toBe(true);
    expect(categories.has(MessageCategory.SPECIAL_BEHAVIOR)).toBe(true);
    expect(categories.has(MessageCategory.CONDITIONAL_STATE)).toBe(true);
    expect(categories.has(MessageCategory.GENERIC_VARIATION)).toBe(true);
  });

  /**
   * Property: Priority distribution is reasonable
   */
  it('should have a reasonable distribution of priorities', () => {
    const priorities = categorizedMessages.map(m => m.priority);
    const criticalCount = priorities.filter(p => p === Priority.CRITICAL).length;
    const highCount = priorities.filter(p => p === Priority.HIGH).length;
    const mediumCount = priorities.filter(p => p === Priority.MEDIUM).length;
    const lowCount = priorities.filter(p => p === Priority.LOW).length;
    
    // Critical should be a small percentage (< 10%)
    expect(criticalCount / priorities.length).toBeLessThan(0.1);
    
    // We should have messages at all priority levels
    expect(criticalCount).toBeGreaterThan(0);
    expect(highCount).toBeGreaterThan(0);
    expect(mediumCount).toBeGreaterThan(0);
    expect(lowCount).toBeGreaterThan(0);
  });
});
