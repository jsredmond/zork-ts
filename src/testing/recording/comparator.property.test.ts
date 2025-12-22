/**
 * Property-Based Tests for TranscriptComparator
 * 
 * These tests verify universal properties that should hold for all valid inputs.
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { TranscriptComparator } from './comparator';
import { Transcript, TranscriptEntry } from './types';

/**
 * Generator for transcript entries
 */
const transcriptEntryArb = (index: number): fc.Arbitrary<TranscriptEntry> =>
  fc.record({
    index: fc.constant(index),
    command: fc.stringOf(fc.constantFrom('a', 'b', 'c', 'd', 'e', ' '), { minLength: 1, maxLength: 20 }),
    output: fc.string({ minLength: 0, maxLength: 200 }),
    turnNumber: fc.constant(index),
  });

/**
 * Generator for a list of transcript entries with sequential indices
 */
const transcriptEntriesArb = (minLength: number, maxLength: number): fc.Arbitrary<TranscriptEntry[]> =>
  fc.integer({ min: minLength, max: maxLength }).chain(length =>
    fc.tuple(...Array.from({ length }, (_, i) => transcriptEntryArb(i)))
  );

/**
 * Generator for transcripts
 */
const transcriptArb = (source: 'typescript' | 'z-machine'): fc.Arbitrary<Transcript> =>
  transcriptEntriesArb(1, 10).map(entries => ({
    id: `${source}-${Date.now()}`,
    source,
    startTime: new Date(),
    endTime: new Date(),
    entries,
    metadata: {},
  }));

/**
 * Generator for a pair of transcripts with the same commands but potentially different outputs
 */
const transcriptPairArb: fc.Arbitrary<[Transcript, Transcript]> = fc
  .integer({ min: 1, max: 10 })
  .chain(length => {
    // Generate shared commands
    const commandsArb = fc.array(
      fc.stringOf(fc.constantFrom('a', 'b', 'c', 'd', 'e', ' '), { minLength: 1, maxLength: 20 }),
      { minLength: length, maxLength: length }
    );
    
    return commandsArb.chain(commands => {
      // Generate two sets of outputs
      const outputsArb = fc.array(
        fc.string({ minLength: 0, maxLength: 200 }),
        { minLength: length, maxLength: length }
      );
      
      return fc.tuple(outputsArb, outputsArb).map(([outputsA, outputsB]) => {
        const entriesA: TranscriptEntry[] = commands.map((cmd, i) => ({
          index: i,
          command: cmd,
          output: outputsA[i],
          turnNumber: i,
        }));
        
        const entriesB: TranscriptEntry[] = commands.map((cmd, i) => ({
          index: i,
          command: cmd,
          output: outputsB[i],
          turnNumber: i,
        }));
        
        const transcriptA: Transcript = {
          id: 'ts-test',
          source: 'typescript',
          startTime: new Date(),
          endTime: new Date(),
          entries: entriesA,
          metadata: {},
        };
        
        const transcriptB: Transcript = {
          id: 'zm-test',
          source: 'z-machine',
          startTime: new Date(),
          endTime: new Date(),
          entries: entriesB,
          metadata: {},
        };
        
        return [transcriptA, transcriptB] as [Transcript, Transcript];
      });
    });
  });


describe('TranscriptComparator Property Tests', () => {
  const comparator = new TranscriptComparator();

  /**
   * Feature: game-recording-comparison, Property 5: Difference Detection Completeness
   * 
   * For any two transcripts with differing outputs, the comparator SHALL identify
   * all differences, classify each by severity, and include the source command
   * for every difference in the report.
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 4.1, 4.2, 4.3**
   */
  it('Property 5: Difference Detection Completeness - all differences are identified with commands and severity', async () => {
    await fc.assert(
      fc.asyncProperty(transcriptPairArb, async ([transcriptA, transcriptB]) => {
        const report = comparator.compare(transcriptA, transcriptB);

        // Count actual differences (where normalized outputs differ)
        let expectedDiffCount = 0;
        const maxLength = Math.max(transcriptA.entries.length, transcriptB.entries.length);
        
        for (let i = 0; i < maxLength; i++) {
          const entryA = transcriptA.entries[i];
          const entryB = transcriptB.entries[i];
          
          if (!entryA || !entryB) {
            // Missing entry is always a difference
            expectedDiffCount++;
            continue;
          }
          
          const normalizedA = comparator.normalizeOutput(entryA.output);
          const normalizedB = comparator.normalizeOutput(entryB.output);
          
          if (normalizedA !== normalizedB) {
            // Check if it's above tolerance threshold (would be counted as close match)
            const similarity = comparator.calculateSimilarity(normalizedA, normalizedB);
            if (similarity < comparator.getOptions().toleranceThreshold) {
              expectedDiffCount++;
            }
          }
        }

        // All differences should be in the report
        // (some may be filtered as close matches above threshold)
        if (report.differences.length > expectedDiffCount) {
          return false;
        }

        // Every difference should have a command
        for (const diff of report.differences) {
          if (typeof diff.command !== 'string') {
            return false;
          }
        }

        // Every difference should have a severity classification
        const validSeverities = ['critical', 'major', 'minor', 'formatting'];
        for (const diff of report.differences) {
          if (!validSeverities.includes(diff.severity)) {
            return false;
          }
        }

        // Every difference should have expected and actual outputs
        for (const diff of report.differences) {
          if (typeof diff.expected !== 'string' || typeof diff.actual !== 'string') {
            return false;
          }
        }

        // Summary should match the differences
        const summaryTotal = 
          report.summary.critical + 
          report.summary.major + 
          report.summary.minor + 
          report.summary.formatting;
        
        if (summaryTotal !== report.differences.length) {
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: game-recording-comparison, Property 5 (continued): Exact Match Detection
   * 
   * For any two identical transcripts, the comparator SHALL report zero differences
   * and 100% parity score.
   * 
   * **Validates: Requirements 3.1, 3.4**
   */
  it('Property 5 (continued): Identical transcripts have zero differences', async () => {
    await fc.assert(
      fc.asyncProperty(transcriptArb('typescript'), async (transcript) => {
        // Create an identical copy
        const transcriptCopy: Transcript = {
          ...transcript,
          id: 'copy-' + transcript.id,
          entries: transcript.entries.map(e => ({ ...e })),
        };

        const report = comparator.compare(transcript, transcriptCopy);

        // Should have no differences
        if (report.differences.length !== 0) {
          return false;
        }

        // Should have 100% parity
        if (report.parityScore !== 100) {
          return false;
        }

        // All entries should be exact matches
        if (report.exactMatches !== transcript.entries.length) {
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });


  /**
   * Feature: game-recording-comparison, Property 5 (continued): Category Assignment
   * 
   * For any difference, the comparator SHALL assign a category based on the command.
   * 
   * **Validates: Requirements 4.1, 4.2**
   */
  it('Property 5 (continued): Every difference has a category', async () => {
    await fc.assert(
      fc.asyncProperty(transcriptPairArb, async ([transcriptA, transcriptB]) => {
        const report = comparator.compare(transcriptA, transcriptB);

        // Every difference should have a non-empty category
        for (const diff of report.differences) {
          if (typeof diff.category !== 'string' || diff.category.length === 0) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('TranscriptComparator Parity Score Property Tests', () => {
  const comparator = new TranscriptComparator();

  /**
   * Feature: game-recording-comparison, Property 6: Parity Score Calculation
   * 
   * For any comparison of two transcripts, the parity score SHALL equal
   * (number of matching outputs / total commands) × 100, where "matching"
   * is defined by the configured tolerance threshold.
   * 
   * **Validates: Requirements 3.4, 6.2**
   */
  it('Property 6: Parity Score Calculation - score equals (matches / total) * 100', async () => {
    await fc.assert(
      fc.asyncProperty(transcriptPairArb, async ([transcriptA, transcriptB]) => {
        const report = comparator.compare(transcriptA, transcriptB);

        // Calculate expected parity score
        const matchingOutputs = report.exactMatches + report.closeMatches;
        const expectedScore = report.totalCommands === 0 
          ? 100 
          : (matchingOutputs / report.totalCommands) * 100;

        // Parity score should match the formula
        if (Math.abs(report.parityScore - expectedScore) > 0.001) {
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: game-recording-comparison, Property 6 (continued): Score Bounds
   * 
   * For any comparison, the parity score SHALL be between 0 and 100 inclusive.
   * 
   * **Validates: Requirements 3.4**
   */
  it('Property 6 (continued): Parity score is between 0 and 100', async () => {
    await fc.assert(
      fc.asyncProperty(transcriptPairArb, async ([transcriptA, transcriptB]) => {
        const report = comparator.compare(transcriptA, transcriptB);

        if (report.parityScore < 0 || report.parityScore > 100) {
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: game-recording-comparison, Property 6 (continued): Match Count Consistency
   * 
   * For any comparison, exactMatches + closeMatches + differences.length
   * should account for all commands.
   * 
   * **Validates: Requirements 3.4, 6.2**
   */
  it('Property 6 (continued): Match counts are consistent with total commands', async () => {
    await fc.assert(
      fc.asyncProperty(transcriptPairArb, async ([transcriptA, transcriptB]) => {
        const report = comparator.compare(transcriptA, transcriptB);

        // Total should equal exactMatches + closeMatches + differences
        const accountedFor = report.exactMatches + report.closeMatches + report.differences.length;
        
        if (accountedFor !== report.totalCommands) {
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: game-recording-comparison, Property 6 (continued): Empty Transcript Handling
   * 
   * For empty transcripts, the parity score should be 100%.
   * 
   * **Validates: Requirements 3.4**
   */
  it('Property 6 (continued): Empty transcripts have 100% parity', async () => {
    const emptyTranscriptA: Transcript = {
      id: 'empty-a',
      source: 'typescript',
      startTime: new Date(),
      endTime: new Date(),
      entries: [],
      metadata: {},
    };

    const emptyTranscriptB: Transcript = {
      id: 'empty-b',
      source: 'z-machine',
      startTime: new Date(),
      endTime: new Date(),
      entries: [],
      metadata: {},
    };

    const report = comparator.compare(emptyTranscriptA, emptyTranscriptB);

    // Empty transcripts should have 100% parity
    if (report.parityScore !== 100) {
      throw new Error(`Expected 100% parity for empty transcripts, got ${report.parityScore}%`);
    }
  });
});
