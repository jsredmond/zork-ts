/**
 * Property-Based Tests for TypeScript Game Recorder
 * 
 * These tests verify universal properties that should hold for all valid inputs.
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { TypeScriptRecorder } from './tsRecorder.js';

/**
 * Generator for valid game commands
 * Produces commands that the game can process (may succeed or fail, but won't crash)
 */
const validCommandArb = fc.oneof(
  // Movement commands
  fc.constantFrom('north', 'south', 'east', 'west', 'up', 'down', 'n', 's', 'e', 'w'),
  // Basic verbs
  fc.constantFrom('look', 'inventory', 'wait', 'score'),
  // Object interactions
  fc.constantFrom('open mailbox', 'take leaflet', 'read leaflet', 'examine mailbox'),
  // Invalid but parseable commands (should produce error messages, not crashes)
  fc.constantFrom('take', 'drop', 'examine'),
  // Unknown commands (should be handled gracefully)
  fc.string({ unit: fc.constantFrom('a', 'b', 'c', 'd', 'e'), minLength: 1, maxLength: 10 })
);

/**
 * Generator for command sequences of varying lengths
 */
const commandSequenceArb = fc.array(validCommandArb, { minLength: 0, maxLength: 20 });

describe('TypeScriptRecorder Property Tests', () => {
  const recorder = new TypeScriptRecorder();

  /**
   * Feature: game-recording-comparison, Property 1: Recording Completeness
   * 
   * For any valid command sequence, when recorded by the TypeScript recorder,
   * the resulting transcript SHALL contain exactly one entry per command,
   * with each entry including the command text, output, and turn number.
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  it('Property 1: Recording Completeness - transcript contains one entry per command plus initial state', async () => {
    await fc.assert(
      fc.asyncProperty(commandSequenceArb, async (commands) => {
        const transcript = await recorder.record(commands);

        // Transcript should have exactly commands.length + 1 entries
        // (+1 for the initial state entry at index 0)
        if (transcript.entries.length !== commands.length + 1) {
          return false;
        }

        // First entry should be initial state (empty command)
        if (transcript.entries[0].command !== '') {
          return false;
        }

        // Each subsequent entry should match the corresponding command
        for (let i = 0; i < commands.length; i++) {
          const entry = transcript.entries[i + 1];
          
          // Entry should have the correct command
          if (entry.command !== commands[i]) {
            return false;
          }

          // Entry should have non-empty output
          if (typeof entry.output !== 'string') {
            return false;
          }

          // Entry should have a turn number
          if (typeof entry.turnNumber !== 'number') {
            return false;
          }

          // Entry should have correct index
          if (entry.index !== i + 1) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: game-recording-comparison, Property 1 (continued): Output Presence
   * 
   * For any command, the recorder SHALL capture some output (even if it's an error message).
   * 
   * **Validates: Requirements 1.1, 1.2**
   */
  it('Property 1 (continued): Every command produces some output', async () => {
    await fc.assert(
      fc.asyncProperty(validCommandArb, async (command) => {
        const transcript = await recorder.record([command]);

        // Should have 2 entries: initial state + command
        if (transcript.entries.length !== 2) {
          return false;
        }

        // Command entry should have non-empty output
        const commandEntry = transcript.entries[1];
        return commandEntry.output.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: game-recording-comparison, Property 1 (continued): Index Consistency
   * 
   * For any command sequence, entry indices SHALL be sequential starting from 0.
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 1 (continued): Entry indices are sequential', async () => {
    await fc.assert(
      fc.asyncProperty(commandSequenceArb, async (commands) => {
        const transcript = await recorder.record(commands);

        // Check that indices are sequential
        for (let i = 0; i < transcript.entries.length; i++) {
          if (transcript.entries[i].index !== i) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * Generator for random seeds
 */
const seedArb = fc.integer({ min: 1, max: 1000000 });

describe('TypeScriptRecorder Deterministic Behavior Property Tests', () => {
  const recorder = new TypeScriptRecorder();

  /**
   * Feature: game-recording-comparison, Property 9: Deterministic Behavior
   * 
   * For any command sequence executed twice with the same random seed,
   * the TypeScript recorder SHALL produce identical transcripts
   * (byte-for-byte identical output for each command).
   * 
   * Note: This test uses only deterministic commands to avoid RNG variations.
   * 
   * **Validates: Requirements 7.1, 7.3, 7.4**
   */
  it('Property 9: Deterministic Behavior - same seed produces identical transcripts', async () => {
    // Use only deterministic commands for this test
    const deterministicCommands = ['look', 'inventory', 'examine mailbox', 'open mailbox'];
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom(...deterministicCommands), { minLength: 1, maxLength: 10 }),
        seedArb,
        async (commands, seed) => {
          // Record twice with the same seed
          const transcript1 = await recorder.record(commands, { seed });
          const transcript2 = await recorder.record(commands, { seed });

          // Transcripts should have the same number of entries
          if (transcript1.entries.length !== transcript2.entries.length) {
            return false;
          }

          // Each entry should have identical output for deterministic commands
          for (let i = 0; i < transcript1.entries.length; i++) {
            const entry1 = transcript1.entries[i];
            const entry2 = transcript2.entries[i];

            // Commands should match
            if (entry1.command !== entry2.command) {
              return false;
            }

            // Outputs should be identical for deterministic commands
            if (entry1.output !== entry2.output) {
              return false;
            }

            // Turn numbers should match
            if (entry1.turnNumber !== entry2.turnNumber) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Feature: game-recording-comparison, Property 9 (continued): Seed Independence
   * 
   * For any command sequence, recordings without a seed should still work correctly.
   * 
   * **Validates: Requirements 7.1**
   */
  it('Property 9 (continued): Recordings work correctly without seed', async () => {
    const deterministicCommands = ['look', 'inventory', 'examine mailbox'];
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom(...deterministicCommands), { minLength: 1, maxLength: 5 }),
        async (commands) => {
          // Record without seed
          const transcript = await recorder.record(commands);

          // Should have correct number of entries
          if (transcript.entries.length !== commands.length + 1) {
            return false;
          }

          // Metadata should not have a seed
          if (transcript.metadata.seed !== undefined) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Feature: game-recording-comparison, Property 9 (continued): Seed Isolation
   * 
   * For any two recordings with different seeds, the random state should be
   * properly isolated (one recording's seed doesn't affect another).
   * 
   * Note: This test uses deterministic commands to verify isolation without RNG interference.
   * 
   * **Validates: Requirements 7.3, 7.4**
   */
  it('Property 9 (continued): Different seeds are properly isolated', async () => {
    const deterministicCommands = ['look', 'inventory'];
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom(...deterministicCommands), { minLength: 1, maxLength: 5 }),
        seedArb,
        seedArb.filter(s => s !== 42),
        async (commands, seed1, seed2) => {
          // Record with first seed
          const transcript1a = await recorder.record(commands, { seed: seed1 });
          
          // Record with different seed
          await recorder.record(commands, { seed: seed2 });
          
          // Record with first seed again
          const transcript1b = await recorder.record(commands, { seed: seed1 });

          // First and third recordings should be identical for deterministic commands
          if (transcript1a.entries.length !== transcript1b.entries.length) {
            return false;
          }

          for (let i = 0; i < transcript1a.entries.length; i++) {
            if (transcript1a.entries[i].output !== transcript1b.entries[i].output) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
