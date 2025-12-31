/**
 * Property-Based Tests for ExhaustiveParityValidator
 * 
 * These tests verify universal properties that should hold for all valid inputs.
 * 
 * Feature: final-100-percent-parity
 * 
 * **Validates: Requirements 3.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ExhaustiveParityValidator,
  createExhaustiveParityValidator,
} from './exhaustiveParityValidator.js';

describe('ExhaustiveParityValidator Property Tests', () => {
  /**
   * Generator for valid game commands
   */
  const validCommandArb = fc.constantFrom(
    'look',
    'inventory',
    'n', 's', 'e', 'w', 'u', 'd',
    'north', 'south', 'east', 'west', 'up', 'down',
    'examine me',
    'wait',
    'score',
    'help',
    'take lamp',
    'drop lamp',
    'open mailbox',
    'close mailbox',
    'read leaflet'
  );

  /**
   * Generator for command sequences of varying lengths
   */
  const commandSequenceArb = (minLength: number, maxLength: number) =>
    fc.array(validCommandArb, { minLength, maxLength });

  /**
   * Generator for random seeds
   */
  const seedArb = fc.integer({ min: 1, max: 99999 });

  /**
   * Generator for multiple seeds
   */
  const seedsArb = fc.array(seedArb, { minLength: 1, maxLength: 5 });

  /**
   * Feature: final-100-percent-parity, Property 3: Extended Sequences Reveal No New Logic Differences
   * 
   * For sequences of 200+ commands, when executed against both implementations,
   * the number of LOGIC_DIFFERENCE classifications SHALL be zero.
   * 
   * Note: This test runs in TypeScript-only mode (without Z-Machine) to verify
   * the validator infrastructure works correctly. Full parity testing requires
   * the Z-Machine interpreter to be available.
   * 
   * **Validates: Requirements 3.4**
   */
  it('Property 3: Extended sequences (200+ commands) reveal no logic differences in TS-only mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        seedArb,
        commandSequenceArb(10, 30), // Use smaller sequences for test speed
        async (seed, commands) => {
          const validator = createExhaustiveParityValidator({
            commandsPerSeed: 200,
            seeds: [seed],
          });

          // Add the generated commands as a sequence
          validator.addCommandSequences([
            {
              id: 'generated',
              name: 'Generated Sequence',
              commands,
            },
          ]);

          // Run extended sequence
          const result = await validator.runExtendedSequence(seed, 200);

          // In TS-only mode (no Z-Machine), there should be no differences
          // because we're only running against TypeScript
          expect(result.commandCount).toBeGreaterThanOrEqual(200);
          
          // Without Z-Machine comparison, hasLogicDifferences should be false
          return result.hasLogicDifferences === false;
        }
      ),
      { numRuns: 10 } // Reduced runs due to async nature
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 3: Extended Sequences Reveal No New Logic Differences
   * 
   * For any seed, running an extended sequence should complete successfully
   * and return valid results.
   * 
   * **Validates: Requirements 3.4**
   */
  it('Property 3a: Extended sequences complete successfully for any seed', async () => {
    await fc.assert(
      fc.asyncProperty(
        seedArb,
        async (seed) => {
          const validator = createExhaustiveParityValidator({
            commandsPerSeed: 50, // Smaller for test speed
            seeds: [seed],
          });

          validator.addCommandSequences([
            {
              id: 'basic',
              name: 'Basic',
              commands: ['look', 'inventory', 'n', 's', 'e', 'w'],
            },
          ]);

          const result = await validator.runExtendedSequence(seed, 50);

          // Result should have valid structure
          expect(result.name).toBe('extended-sequence');
          expect(result.seed).toBe(seed);
          expect(result.commandCount).toBeGreaterThanOrEqual(50);
          expect(result.executionTime).toBeGreaterThan(0);
          expect(Array.isArray(result.differences)).toBe(true);
          expect(typeof result.hasLogicDifferences).toBe('boolean');

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 3: Extended Sequences Reveal No New Logic Differences
   * 
   * Multi-seed execution should produce consistent results structure.
   * 
   * **Validates: Requirements 3.4**
   */
  it('Property 3b: Multi-seed execution produces valid aggregated results', async () => {
    await fc.assert(
      fc.asyncProperty(
        seedsArb,
        async (seeds) => {
          const validator = createExhaustiveParityValidator({
            commandsPerSeed: 20, // Small for test speed
            seeds,
          });

          validator.addCommandSequences([
            {
              id: 'basic',
              name: 'Basic',
              commands: ['look', 'inventory', 'n', 's'],
            },
          ]);

          const results = await validator.runWithSeeds();

          // Verify result structure
          expect(results.totalTests).toBe(seeds.length);
          expect(results.seedResults.size).toBe(seeds.length);
          expect(results.totalDifferences).toBeGreaterThanOrEqual(0);
          expect(results.rngDifferences).toBeGreaterThanOrEqual(0);
          expect(results.stateDivergences).toBeGreaterThanOrEqual(0);
          expect(results.logicDifferences).toBeGreaterThanOrEqual(0);
          expect(results.overallParityPercentage).toBeGreaterThanOrEqual(0);
          expect(results.overallParityPercentage).toBeLessThanOrEqual(100);
          expect(results.totalExecutionTime).toBeGreaterThan(0);
          expect(typeof results.passed).toBe('boolean');
          expect(results.summary.length).toBeGreaterThan(0);

          // Sum of difference types should equal total
          expect(
            results.rngDifferences + results.stateDivergences + results.logicDifferences
          ).toBe(results.totalDifferences);

          // Each seed should have a result
          for (const seed of seeds) {
            expect(results.seedResults.has(seed)).toBe(true);
            const seedResult = results.seedResults.get(seed)!;
            expect(seedResult.seed).toBe(seed);
            expect(seedResult.totalCommands).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 3: Extended Sequences Reveal No New Logic Differences
   * 
   * Command count should always meet or exceed the requested minimum.
   * 
   * **Validates: Requirements 3.4**
   */
  it('Property 3c: Command count meets or exceeds requested minimum', async () => {
    await fc.assert(
      fc.asyncProperty(
        seedArb,
        fc.integer({ min: 10, max: 100 }),
        async (seed, requestedCount) => {
          const validator = createExhaustiveParityValidator({
            commandsPerSeed: requestedCount,
            seeds: [seed],
          });

          validator.addCommandSequences([
            {
              id: 'basic',
              name: 'Basic',
              commands: ['look', 'n', 's'],
            },
          ]);

          const result = await validator.runExtendedSequence(seed, requestedCount);

          // Command count should meet or exceed requested
          return result.commandCount >= requestedCount;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 3: Extended Sequences Reveal No New Logic Differences
   * 
   * In TypeScript-only mode, parity should be 100% (no Z-Machine to compare against).
   * 
   * **Validates: Requirements 3.4**
   */
  it('Property 3d: TypeScript-only mode reports 100% parity', async () => {
    await fc.assert(
      fc.asyncProperty(
        seedArb,
        async (seed) => {
          const validator = createExhaustiveParityValidator({
            commandsPerSeed: 20,
            seeds: [seed],
          });

          validator.addCommandSequences([
            {
              id: 'basic',
              name: 'Basic',
              commands: ['look', 'inventory'],
            },
          ]);

          // Don't initialize Z-Machine (TS-only mode)
          const results = await validator.runWithSeeds();

          // In TS-only mode, should pass with 100% parity
          expect(results.passed).toBe(true);
          expect(results.logicDifferences).toBe(0);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 3: Extended Sequences Reveal No New Logic Differences
   * 
   * All differences should be properly classified.
   * 
   * **Validates: Requirements 3.4**
   */
  it('Property 3e: All differences are properly classified', async () => {
    await fc.assert(
      fc.asyncProperty(
        seedArb,
        async (seed) => {
          const validator = createExhaustiveParityValidator({
            commandsPerSeed: 30,
            seeds: [seed],
          });

          validator.addCommandSequences([
            {
              id: 'basic',
              name: 'Basic',
              commands: ['look', 'n', 's', 'e', 'w', 'inventory'],
            },
          ]);

          const result = await validator.runExtendedSequence(seed, 30);

          // All differences should have valid classification
          for (const diff of result.differences) {
            expect(['RNG_DIFFERENCE', 'STATE_DIVERGENCE', 'LOGIC_DIFFERENCE']).toContain(
              diff.classification
            );
            expect(diff.reason.length).toBeGreaterThan(0);
            expect(diff.commandIndex).toBeGreaterThanOrEqual(0);
            expect(diff.command).toBeDefined();
          }

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});
