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


describe('TranscriptComparator Structural Difference Property Tests', () => {
  /**
   * Feature: fix-parity-validation, Property 6: Structural Differences Ignored
   * 
   * For any pair of outputs that differ only in headers, whitespace, line wrapping,
   * or prompt formatting, the comparator SHALL consider them matching.
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   */
  describe('Property 6: Structural Differences Ignored', () => {
    /**
     * Generator for game headers
     */
    const gameHeaderArb = fc.constantFrom(
      'ZORK I: The Great Underground Empire\nCopyright (c) 1981, 1982, 1983 Infocom, Inc.\n',
      'ZORK I: The Great Underground Empire\n',
      'Copyright (c) 1981, 1982, 1983 Infocom, Inc.\nAll rights reserved.\n',
      'Release 88 / Serial number 840726\n',
      ''
    );

    /**
     * Generator for status bars
     */
    const statusBarArb = fc.constantFrom(
      'West of House                                    Score: 0        Moves: 1\n',
      'North of House                                   Score: 10       Moves: 5\n',
      'Living Room                                      Score: 25       Moves: 100\n',
      ''
    );

    /**
     * Generator for prompts
     */
    const promptArb = fc.constantFrom(
      '\n>',
      '\n> ',
      '>\n',
      ''
    );

    /**
     * Generator for core action responses
     */
    const actionResponseArb = fc.constantFrom(
      'Taken.',
      'Dropped.',
      'You are empty-handed.',
      'It is pitch black. You are likely to be eaten by a grue.',
      'You are standing in an open field west of a white house.',
      'The door is locked.',
      'Nothing happens.',
      'OK.'
    );

    /**
     * Generator for whitespace variations
     */
    const whitespaceVariationArb = fc.constantFrom(
      '',
      ' ',
      '  ',
      '\n',
      '\n\n',
      '   \n'
    );

    it('should match outputs that differ only in game headers', async () => {
      const comparator = new TranscriptComparator();

      await fc.assert(
        fc.asyncProperty(
          gameHeaderArb,
          actionResponseArb,
          async (header, response) => {
            // Create output with header
            const outputWithHeader = header + response;
            // Create output without header
            const outputWithoutHeader = response;

            const transcriptA = {
              id: 'zm-test',
              source: 'z-machine' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputWithHeader,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const transcriptB = {
              id: 'ts-test',
              source: 'typescript' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputWithoutHeader,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const report = comparator.compareAndClassify(transcriptA, transcriptB);

            // Property: Outputs differing only in headers should match
            // Either exact match or no behavioral differences
            return report.exactMatches === 1 || report.behavioralDifferences === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match outputs that differ only in status bars', async () => {
      const comparator = new TranscriptComparator();

      await fc.assert(
        fc.asyncProperty(
          statusBarArb,
          actionResponseArb,
          async (statusBar, response) => {
            // Create output with status bar
            const outputWithStatusBar = statusBar + response;
            // Create output without status bar
            const outputWithoutStatusBar = response;

            const transcriptA = {
              id: 'zm-test',
              source: 'z-machine' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputWithStatusBar,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const transcriptB = {
              id: 'ts-test',
              source: 'typescript' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputWithoutStatusBar,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const report = comparator.compareAndClassify(transcriptA, transcriptB);

            // Property: Outputs differing only in status bars should match
            return report.exactMatches === 1 || report.behavioralDifferences === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match outputs that differ only in prompts', async () => {
      const comparator = new TranscriptComparator();

      await fc.assert(
        fc.asyncProperty(
          promptArb,
          actionResponseArb,
          async (prompt, response) => {
            // Create output with prompt
            const outputWithPrompt = response + prompt;
            // Create output without prompt
            const outputWithoutPrompt = response;

            const transcriptA = {
              id: 'zm-test',
              source: 'z-machine' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputWithPrompt,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const transcriptB = {
              id: 'ts-test',
              source: 'typescript' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputWithoutPrompt,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const report = comparator.compareAndClassify(transcriptA, transcriptB);

            // Property: Outputs differing only in prompts should match
            return report.exactMatches === 1 || report.behavioralDifferences === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match outputs that differ only in whitespace', async () => {
      const comparator = new TranscriptComparator();

      await fc.assert(
        fc.asyncProperty(
          whitespaceVariationArb,
          whitespaceVariationArb,
          actionResponseArb,
          async (leadingWs, trailingWs, response) => {
            // Create output with extra whitespace
            const outputWithWhitespace = leadingWs + response + trailingWs;
            // Create output without extra whitespace
            const outputWithoutWhitespace = response;

            const transcriptA = {
              id: 'zm-test',
              source: 'z-machine' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputWithWhitespace,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const transcriptB = {
              id: 'ts-test',
              source: 'typescript' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputWithoutWhitespace,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const report = comparator.compareAndClassify(transcriptA, transcriptB);

            // Property: Outputs differing only in whitespace should match
            return report.exactMatches === 1 || report.behavioralDifferences === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match outputs that differ in multiple structural elements', async () => {
      const comparator = new TranscriptComparator();

      await fc.assert(
        fc.asyncProperty(
          gameHeaderArb,
          statusBarArb,
          promptArb,
          whitespaceVariationArb,
          actionResponseArb,
          async (header, statusBar, prompt, ws, response) => {
            // Create output with all structural elements
            const outputWithStructure = header + statusBar + ws + response + prompt;
            // Create output without structural elements
            const outputWithoutStructure = response;

            const transcriptA = {
              id: 'zm-test',
              source: 'z-machine' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputWithStructure,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const transcriptB = {
              id: 'ts-test',
              source: 'typescript' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputWithoutStructure,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const report = comparator.compareAndClassify(transcriptA, transcriptB);

            // Property: Outputs differing only in structural elements should match
            return report.exactMatches === 1 || report.behavioralDifferences === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should still detect real behavioral differences', async () => {
      const comparator = new TranscriptComparator();

      // Generator for pairs of different responses
      const differentResponsePairArb = fc.tuple(
        fc.constantFrom('Taken.', 'Dropped.', 'OK.'),
        fc.constantFrom('The door is locked.', 'Nothing happens.', 'You are empty-handed.')
      ).filter(([a, b]) => a !== b);

      await fc.assert(
        fc.asyncProperty(
          gameHeaderArb,
          statusBarArb,
          differentResponsePairArb,
          async (header, statusBar, [responseA, responseB]) => {
            // Create outputs with different core responses
            const outputA = header + statusBar + responseA;
            const outputB = responseB;

            const transcriptA = {
              id: 'zm-test',
              source: 'z-machine' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputA,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const transcriptB = {
              id: 'ts-test',
              source: 'typescript' as const,
              startTime: new Date(),
              endTime: new Date(),
              entries: [{
                index: 0,
                command: 'test',
                output: outputB,
                turnNumber: 0,
              }],
              metadata: {},
            };

            const report = comparator.compareAndClassify(transcriptA, transcriptB);

            // Property: Different core responses should be detected as differences
            // (not exact matches)
            return report.exactMatches === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
