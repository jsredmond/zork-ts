/**
 * Property-Based Tests for CommandSequenceLoader
 * 
 * These tests verify universal properties that should hold for all valid inputs.
 * 
 * Feature: game-recording-comparison, Property 7: Command Sequence Parsing (Round-Trip)
 * 
 * **Validates: Requirements 5.1, 5.2, 5.4**
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { CommandSequenceLoader } from './sequenceLoader';
import { CommandSequence } from './types';

/**
 * Generator for valid command strings
 * Commands should not contain newlines or start with # or @
 */
const validCommandArb = fc.stringOf(
  fc.constantFrom(
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
  ),
  { minLength: 1, maxLength: 50 }
).filter(s => {
  const trimmed = s.trim();
  // Must have content after trimming
  if (trimmed.length === 0) return false;
  // Must not start with # (comment) or @ (directive)
  if (trimmed.startsWith('#') || trimmed.startsWith('@')) return false;
  return true;
}).map(s => s.trim());

/**
 * Generator for command sequences (arrays of valid commands)
 */
const commandArrayArb = fc.array(validCommandArb, { minLength: 0, maxLength: 30 });

/**
 * Generator for valid sequence IDs (alphanumeric with hyphens)
 */
const sequenceIdArb = fc.stringOf(
  fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-'),
  { minLength: 1, maxLength: 20 }
).filter(s => /^[a-z]/.test(s)); // Must start with a letter

/**
 * Generator for valid sequence names (can include spaces)
 */
const sequenceNameArb = fc.stringOf(
  fc.constantFrom(
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
  ),
  { minLength: 1, maxLength: 50 }
).filter(s => s.trim().length > 0).map(s => s.trim());

/**
 * Generator for optional descriptions
 */
const descriptionArb = fc.option(
  fc.stringOf(
    fc.constantFrom(
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
      ' ', '.', ',', '!', '?'
    ),
    { minLength: 1, maxLength: 100 }
  ).filter(s => s.trim().length > 0).map(s => s.trim()),
  { nil: undefined }
);

/**
 * Generator for complete CommandSequence objects
 */
const commandSequenceArb = fc.record({
  id: sequenceIdArb,
  name: sequenceNameArb,
  description: descriptionArb,
  commands: commandArrayArb
});

describe('CommandSequenceLoader Property Tests', () => {
  const loader = new CommandSequenceLoader();

  /**
   * Feature: game-recording-comparison, Property 7: Command Sequence Parsing (Round-Trip)
   * 
   * For any valid command sequence file, parsing the file and then serializing
   * the commands back to a file (ignoring comments) SHALL produce a sequence that,
   * when parsed again, yields identical commands.
   * 
   * **Validates: Requirements 5.1, 5.2, 5.4**
   */
  it('Property 7: Round-trip - serialize then parse preserves commands', () => {
    fc.assert(
      fc.property(commandSequenceArb, (sequence) => {
        // Serialize the sequence to string format
        const serialized = loader.serialize(sequence);
        
        // Parse the serialized string back
        const parsed = loader.parseString(serialized, sequence.id);
        
        // Commands should be identical
        if (parsed.commands.length !== sequence.commands.length) {
          return false;
        }
        
        for (let i = 0; i < sequence.commands.length; i++) {
          if (parsed.commands[i] !== sequence.commands[i]) {
            return false;
          }
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 (continued): Round-trip preserves metadata
   * 
   * For any command sequence with metadata, serializing and parsing
   * should preserve the name and description.
   * 
   * **Validates: Requirements 5.1, 5.2**
   */
  it('Property 7 (continued): Round-trip preserves name and description', () => {
    fc.assert(
      fc.property(commandSequenceArb, (sequence) => {
        // Serialize the sequence
        const serialized = loader.serialize(sequence);
        
        // Parse it back
        const parsed = loader.parseString(serialized, sequence.id);
        
        // If name differs from id, it should be preserved
        if (sequence.name !== sequence.id) {
          if (parsed.name !== sequence.name) {
            return false;
          }
        }
        
        // Description should be preserved if present
        if (sequence.description !== undefined) {
          if (parsed.description !== sequence.description) {
            return false;
          }
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 (continued): Double round-trip is idempotent
   * 
   * For any command sequence, serialize -> parse -> serialize -> parse
   * should yield the same result as a single round-trip.
   * 
   * **Validates: Requirements 5.1, 5.4**
   */
  it('Property 7 (continued): Double round-trip is idempotent', () => {
    fc.assert(
      fc.property(commandSequenceArb, (sequence) => {
        // First round-trip
        const serialized1 = loader.serialize(sequence);
        const parsed1 = loader.parseString(serialized1, sequence.id);
        
        // Second round-trip
        const serialized2 = loader.serialize(parsed1);
        const parsed2 = loader.parseString(serialized2, sequence.id);
        
        // Results should be identical
        if (parsed1.commands.length !== parsed2.commands.length) {
          return false;
        }
        
        for (let i = 0; i < parsed1.commands.length; i++) {
          if (parsed1.commands[i] !== parsed2.commands[i]) {
            return false;
          }
        }
        
        // Metadata should also match
        if (parsed1.name !== parsed2.name) {
          return false;
        }
        
        if (parsed1.description !== parsed2.description) {
          return false;
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 (continued): Comments are stripped during parsing
   * 
   * For any command sequence, adding comments to the serialized form
   * should not affect the parsed commands.
   * 
   * **Validates: Requirements 5.2**
   */
  it('Property 7 (continued): Comments do not affect parsed commands', () => {
    fc.assert(
      fc.property(
        commandArrayArb,
        fc.array(fc.stringOf(fc.constantFrom('a', 'b', 'c', ' '), { minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
        (commands, comments) => {
          // Create content with commands
          const withoutComments = commands.join('\n');
          
          // Create content with interspersed comments
          const lines: string[] = [];
          for (let i = 0; i < commands.length; i++) {
            if (i < comments.length) {
              lines.push(`# ${comments[i]}`);
            }
            lines.push(commands[i]);
          }
          const withComments = lines.join('\n');
          
          // Parse both
          const parsed1 = loader.parseString(withoutComments, 'test');
          const parsed2 = loader.parseString(withComments, 'test');
          
          // Commands should be identical
          if (parsed1.commands.length !== parsed2.commands.length) {
            return false;
          }
          
          for (let i = 0; i < parsed1.commands.length; i++) {
            if (parsed1.commands[i] !== parsed2.commands[i]) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 (continued): Empty lines are ignored
   * 
   * For any command sequence, adding empty lines should not affect
   * the parsed commands.
   * 
   * **Validates: Requirements 5.1**
   */
  it('Property 7 (continued): Empty lines do not affect parsed commands', () => {
    fc.assert(
      fc.property(
        commandArrayArb,
        fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 0, maxLength: 10 }),
        (commands, emptyLineCounts) => {
          // Create content without extra empty lines
          const withoutEmpty = commands.join('\n');
          
          // Create content with interspersed empty lines
          const lines: string[] = [];
          for (let i = 0; i < commands.length; i++) {
            if (i < emptyLineCounts.length) {
              for (let j = 0; j < emptyLineCounts[i]; j++) {
                lines.push('');
              }
            }
            lines.push(commands[i]);
          }
          const withEmpty = lines.join('\n');
          
          // Parse both
          const parsed1 = loader.parseString(withoutEmpty, 'test');
          const parsed2 = loader.parseString(withEmpty, 'test');
          
          // Commands should be identical
          if (parsed1.commands.length !== parsed2.commands.length) {
            return false;
          }
          
          for (let i = 0; i < parsed1.commands.length; i++) {
            if (parsed1.commands[i] !== parsed2.commands[i]) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 (continued): Command count is preserved
   * 
   * For any array of valid commands, parsing should yield exactly
   * that many commands in the result.
   * 
   * **Validates: Requirements 5.1**
   */
  it('Property 7 (continued): Command count is preserved', () => {
    fc.assert(
      fc.property(commandArrayArb, (commands) => {
        const content = commands.join('\n');
        const parsed = loader.parseString(content, 'test');
        
        return parsed.commands.length === commands.length;
      }),
      { numRuns: 100 }
    );
  });
});
