import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as fc from 'fast-check';

/**
 * Feature: complete-text-accuracy, Property 6.1: TELL statement parsing completeness
 * Validates: Requirements 6.1
 * 
 * Property: For any TELL statement in the ZIL source files, the extractor should
 * successfully parse and extract the complete message text.
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

describe('ZIL Message Extraction', () => {
  let extractedMessages: ZilMessage[];

  // Load extracted messages once for all tests
  beforeAll(() => {
    // Run the extractor
    execSync('npx tsx scripts/extract-zil-messages.ts', { stdio: 'pipe' });
    
    // Load the results
    const messagesPath = path.join(process.cwd(), '.kiro/testing/zil-messages.json');
    const content = fs.readFileSync(messagesPath, 'utf-8');
    extractedMessages = JSON.parse(content);
  });

  /**
   * Property 6.1: TELL statement parsing completeness
   * 
   * For any TELL statement in ZIL source, the message should be:
   * 1. Non-empty
   * 2. Properly cleaned (no ZIL syntax artifacts like tags or pipes)
   * 3. Have file and line information
   * 
   * Note: Some messages may have UNKNOWN context if they're in unusual code structures.
   * Double spaces are valid in ZIL as placeholders for object names (D directive).
   */
  it('should extract complete TELL messages without ZIL syntax artifacts', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...extractedMessages.filter(m => m.type === 'TELL')),
        (message) => {
          // Message should not be empty
          expect(message.message).toBeTruthy();
          expect(message.message.length).toBeGreaterThan(0);
          
          // Message should not contain ZIL syntax artifacts
          expect(message.message).not.toMatch(/<[A-Z-]+/); // No opening tags
          expect(message.message).not.toMatch(/\|/); // Newlines should be converted
          expect(message.message).not.toMatch(/\\"/); // Quotes should be unescaped
          
          // Context should be identified (but UNKNOWN is acceptable for edge cases)
          expect(message.context).toBeTruthy();
          
          // File and line should be valid
          expect(message.file).toBeTruthy();
          expect(message.line).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract multi-line TELL statements correctly', () => {
    // Find known multi-line TELL statements
    const multiLineMessages = extractedMessages.filter(m => 
      m.type === 'TELL' && m.message.length > 50
    );
    
    expect(multiLineMessages.length).toBeGreaterThan(0);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...multiLineMessages),
        (message) => {
          // Multi-line messages should be properly concatenated
          // Note: Double spaces are valid in ZIL as placeholders for object names
          expect(message.message.trim()).toBe(message.message); // No leading/trailing whitespace
          expect(message.message).not.toMatch(/\s{3,}/); // No triple+ spaces
          
          return true;
        }
      ),
      { numRuns: Math.min(50, multiLineMessages.length) }
    );
  });

  it('should extract all TELL statements from known routines', () => {
    // Check specific known routines have messages
    const boardMessages = extractedMessages.filter(m => 
      m.context.includes('BOARD-F') && m.type === 'TELL'
    );
    expect(boardMessages.length).toBeGreaterThan(0);
    
    const teethMessages = extractedMessages.filter(m => 
      m.context.includes('TEETH-F') && m.type === 'TELL'
    );
    expect(teethMessages.length).toBeGreaterThan(0);
    
    const graniteWallMessages = extractedMessages.filter(m => 
      m.context.includes('GRANITE-WALL-F') && m.type === 'TELL'
    );
    expect(graniteWallMessages.length).toBeGreaterThan(0);
  });

  it('should extract JIGS-UP messages correctly', () => {
    const jigsUpMessages = extractedMessages.filter(m => m.type === 'JIGS-UP');
    
    expect(jigsUpMessages.length).toBeGreaterThan(0);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...jigsUpMessages),
        (message) => {
          // JIGS-UP messages should be non-empty
          expect(message.message).toBeTruthy();
          expect(message.message.length).toBeGreaterThan(0);
          
          // Should not contain syntax artifacts
          expect(message.message).not.toMatch(/<[A-Z-]+/);
          
          return true;
        }
      ),
      { numRuns: Math.min(20, jigsUpMessages.length) }
    );
  });

  it('should extract reasonable total number of messages', () => {
    // Based on the original game, we expect around 900-1200 messages
    expect(extractedMessages.length).toBeGreaterThan(900);
    expect(extractedMessages.length).toBeLessThan(1500);
    
    // TELL messages should be the majority
    const tellMessages = extractedMessages.filter(m => m.type === 'TELL');
    expect(tellMessages.length).toBeGreaterThan(extractedMessages.length * 0.6);
  });
});


/**
 * Feature: complete-text-accuracy, Property 6.2: Message context identification
 * Validates: Requirements 6.2, 6.3
 * 
 * Property: For any message extracted from ZIL, the context should correctly identify
 * the associated object/room and verb when present in the source.
 */
describe('Message Context Association', () => {
  let extractedMessages: ZilMessage[];

  beforeAll(() => {
    const messagesPath = path.join(process.cwd(), '.kiro/testing/zil-messages.json');
    const content = fs.readFileSync(messagesPath, 'utf-8');
    extractedMessages = JSON.parse(content);
  });

  /**
   * Property 6.2: Object association correctness
   * 
   * For any message from an object routine (e.g., BOARD-F), the object field
   * should be correctly extracted from the routine name or context.
   */
  it('should correctly associate messages with objects from routine names', () => {
    const objectRoutineMessages = extractedMessages.filter(m => 
      m.context.includes('ROUTINE') && m.context.includes('-F')
    );
    
    expect(objectRoutineMessages.length).toBeGreaterThan(0);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...objectRoutineMessages),
        (message) => {
          // If context is a routine ending in -F, object should be extracted
          if (message.context.match(/ROUTINE ([A-Z0-9-]+)-F/)) {
            expect(message.object).toBeTruthy();
            expect(message.object).not.toBe('');
          }
          
          return true;
        }
      ),
      { numRuns: Math.min(100, objectRoutineMessages.length) }
    );
  });

  /**
   * Property: Verb association correctness
   * 
   * For any message near a VERB? check, the verb field should be extracted.
   */
  it('should associate messages with verbs when VERB? checks are present', () => {
    const messagesWithVerbs = extractedMessages.filter(m => m.verb);
    
    // We should have many messages with verb associations
    expect(messagesWithVerbs.length).toBeGreaterThan(50);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...messagesWithVerbs),
        (message) => {
          // Verb should be a valid identifier
          expect(message.verb).toMatch(/^[A-Z0-9-]+$/);
          
          return true;
        }
      ),
      { numRuns: Math.min(100, messagesWithVerbs.length) }
    );
  });

  /**
   * Property: Condition extraction correctness
   * 
   * For any message with conditional logic, the condition field should capture
   * the relevant predicates (EQUAL?, FSET?, etc.)
   */
  it('should extract conditional logic for state-dependent messages', () => {
    const conditionalMessages = extractedMessages.filter(m => m.condition);
    
    // We should have many conditional messages
    expect(conditionalMessages.length).toBeGreaterThan(20);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...conditionalMessages),
        (message) => {
          // Condition should contain valid ZIL predicates
          const hasValidPredicate = 
            message.condition!.includes('EQUAL?') ||
            message.condition!.includes('FSET?') ||
            message.condition!.includes('FCLEAR?') ||
            message.condition!.includes('IN?');
          
          expect(hasValidPredicate).toBe(true);
          
          return true;
        }
      ),
      { numRuns: Math.min(100, conditionalMessages.length) }
    );
  });

  /**
   * Property: Object messages have object context
   * 
   * For any message from an OBJECT definition, the object field should be set.
   */
  it('should associate messages from OBJECT definitions with the object name', () => {
    const objectMessages = extractedMessages.filter(m => 
      m.context.startsWith('OBJECT ')
    );
    
    expect(objectMessages.length).toBeGreaterThan(0);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...objectMessages),
        (message) => {
          expect(message.object).toBeTruthy();
          expect(message.object).not.toBe('');
          
          // Object name should match the context
          expect(message.context).toContain(message.object!);
          
          return true;
        }
      ),
      { numRuns: Math.min(100, objectMessages.length) }
    );
  });

  /**
   * Property: Room messages have object context
   * 
   * For any message from a ROOM definition, the object field should be set to the room name.
   */
  it('should associate messages from ROOM definitions with the room name', () => {
    const roomMessages = extractedMessages.filter(m => 
      m.context.startsWith('ROOM ')
    );
    
    expect(roomMessages.length).toBeGreaterThan(0);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...roomMessages),
        (message) => {
          expect(message.object).toBeTruthy();
          expect(message.object).not.toBe('');
          
          // Room name should match the context
          expect(message.context).toContain(message.object!);
          
          return true;
        }
      ),
      { numRuns: Math.min(100, roomMessages.length) }
    );
  });

  /**
   * Property: Known object routines have correct associations
   * 
   * Test specific known cases to ensure accuracy.
   */
  it('should correctly extract context for known object routines', () => {
    // BOARD-F routine
    const boardMessages = extractedMessages.filter(m => 
      m.context.includes('BOARD-F')
    );
    expect(boardMessages.length).toBeGreaterThan(0);
    boardMessages.forEach(m => {
      expect(m.object).toBe('BOARD');
    });

    // GRANITE-WALL-F routine
    const graniteMessages = extractedMessages.filter(m => 
      m.context.includes('GRANITE-WALL-F')
    );
    expect(graniteMessages.length).toBeGreaterThan(0);
    graniteMessages.forEach(m => {
      expect(m.object).toBe('GRANITE-WALL');
    });

    // TEETH-F routine
    const teethMessages = extractedMessages.filter(m => 
      m.context.includes('TEETH-F')
    );
    expect(teethMessages.length).toBeGreaterThan(0);
    teethMessages.forEach(m => {
      expect(m.object).toBe('TEETH');
    });
  });
});
