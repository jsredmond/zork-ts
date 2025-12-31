/**
 * Property-Based Tests for BatchRunner
 * 
 * These tests verify universal properties that should hold for all valid inputs.
 * 
 * Feature: game-recording-comparison, Property 8: Batch Execution Independence
 * **Validates: Requirements 6.1, 6.3**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { BatchRunner } from './batchRunner.js';
import { TypeScriptRecorder } from './tsRecorder.js';
import { ZMachineRecorder } from './zmRecorder.js';
import { TranscriptComparator } from './comparator.js';
import { CommandSequence, Transcript, DiffReport } from './types.js';

// Mock the recorders for controlled testing
vi.mock('./tsRecorder.js', () => ({
  TypeScriptRecorder: vi.fn(),
  GameRecorder: vi.fn()
}));

vi.mock('./zmRecorder.js', () => ({
  ZMachineRecorder: vi.fn()
}));

/**
 * Generator for command sequences
 */
const commandSequenceArb: fc.Arbitrary<CommandSequence> = fc.record({
  id: fc.string({ unit: fc.constantFrom('a', 'b', 'c', '1', '2', '3', '-'), minLength: 3, maxLength: 10 }),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  commands: fc.array(
    fc.string({ unit: fc.constantFrom('l', 'o', 'k', 'n', 's', 'e', 'w', ' '), minLength: 1, maxLength: 15 }),
    { minLength: 1, maxLength: 5 }
  ),
  description: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
});

/**
 * Generator for a list of unique command sequences
 */
const commandSequenceListArb = (minLength: number, maxLength: number): fc.Arbitrary<CommandSequence[]> =>
  fc.array(commandSequenceArb, { minLength, maxLength }).map(sequences => {
    // Ensure unique IDs
    const seen = new Set<string>();
    return sequences.map((seq, i) => {
      let id = seq.id;
      while (seen.has(id)) {
        id = `${seq.id}-${i}`;
      }
      seen.add(id);
      return { ...seq, id };
    });
  });

/**
 * Generator for parity scores (0-100)
 */
const parityScoreArb: fc.Arbitrary<number> = fc.float({ min: 0, max: 100, noNaN: true });

/**
 * Generator for diff counts (non-negative integers)
 */
const diffCountArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: 20 });

/**
 * Generator for command counts (positive integers)
 */
const commandCountArb: fc.Arbitrary<number> = fc.integer({ min: 1, max: 10 });

describe('BatchRunner Property Tests', () => {
  let mockTsRecorder: TypeScriptRecorder;
  let mockZmRecorder: ZMachineRecorder;
  let mockComparator: TranscriptComparator;

  const createMockTranscript = (id: string, source: 'typescript' | 'z-machine', commandCount: number): Transcript => ({
    id,
    source,
    startTime: new Date(),
    endTime: new Date(),
    entries: Array.from({ length: commandCount }, (_, i) => ({
      index: i,
      command: i === 0 ? '' : `cmd${i}`,
      output: `output${i}`,
      turnNumber: i
    })),
    metadata: {}
  });

  const createMockDiffReport = (parityScore: number, diffCount: number, totalCommands: number): DiffReport => ({
    transcriptA: 'zm-test',
    transcriptB: 'ts-test',
    totalCommands,
    exactMatches: Math.max(0, totalCommands - diffCount),
    closeMatches: 0,
    differences: Array(diffCount).fill(null).map((_, i) => ({
      index: i,
      command: `cmd${i}`,
      expected: 'expected',
      actual: 'actual',
      similarity: 0.5,
      severity: 'major' as const,
      category: 'test'
    })),
    parityScore,
    summary: { critical: 0, major: diffCount, minor: 0, formatting: 0 }
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockTsRecorder = {
      record: vi.fn(),
      isAvailable: vi.fn().mockResolvedValue(true)
    } as unknown as TypeScriptRecorder;

    mockZmRecorder = {
      record: vi.fn(),
      isAvailable: vi.fn().mockResolvedValue(true)
    } as unknown as ZMachineRecorder;

    mockComparator = {
      compare: vi.fn()
    } as unknown as TranscriptComparator;
  });

  /**
   * Feature: game-recording-comparison, Property 8: Batch Execution Independence
   * 
   * For any set of command sequences run in batch mode, each sequence SHALL produce
   * an independent transcript, and the aggregate parity score SHALL equal the
   * weighted average of individual scores.
   * 
   * **Validates: Requirements 6.1, 6.3**
   */
  it('Property 8: Batch Execution Independence - aggregate score equals weighted average', async () => {
    await fc.assert(
      fc.asyncProperty(
        commandSequenceListArb(1, 5),
        fc.array(
          fc.tuple(parityScoreArb, diffCountArb, commandCountArb),
          { minLength: 1, maxLength: 5 }
        ),
        async (sequences, scoreData) => {
          // Ensure we have matching data for each sequence
          const effectiveSequences = sequences.slice(0, scoreData.length);
          const effectiveScoreData = scoreData.slice(0, sequences.length);

          if (effectiveSequences.length === 0) {
            return true; // Skip empty case
          }

          // Setup mocks for each sequence
          for (let i = 0; i < effectiveSequences.length; i++) {
            const [parityScore, diffCount, commandCount] = effectiveScoreData[i];
            
            vi.mocked(mockTsRecorder.record).mockResolvedValueOnce(
              createMockTranscript(`ts-${i}`, 'typescript', commandCount)
            );
            vi.mocked(mockZmRecorder.record).mockResolvedValueOnce(
              createMockTranscript(`zm-${i}`, 'z-machine', commandCount)
            );
            vi.mocked(mockComparator.compare).mockReturnValueOnce(
              createMockDiffReport(parityScore, diffCount, commandCount)
            );
          }

          const batchRunner = new BatchRunner(mockTsRecorder, mockZmRecorder, mockComparator);
          const result = await batchRunner.run(effectiveSequences);

          // Verify each sequence produced an independent result
          expect(result.sequences).toHaveLength(effectiveSequences.length);

          // Calculate expected weighted average
          let totalCommands = 0;
          let weightedSum = 0;

          for (let i = 0; i < effectiveSequences.length; i++) {
            const [parityScore, , commandCount] = effectiveScoreData[i];
            totalCommands += commandCount;
            weightedSum += parityScore * commandCount;
          }

          const expectedAggregateScore = totalCommands > 0 ? weightedSum / totalCommands : 0;

          // Verify aggregate score equals weighted average (with floating point tolerance)
          expect(Math.abs(result.aggregateParityScore - expectedAggregateScore)).toBeLessThan(0.01);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: game-recording-comparison, Property 8 (continued): Independence Verification
   * 
   * Each sequence in a batch should be recorded independently - the result of one
   * sequence should not affect another.
   * 
   * **Validates: Requirements 6.1, 6.3**
   */
  it('Property 8 (continued): Each sequence produces independent results', async () => {
    await fc.assert(
      fc.asyncProperty(
        commandSequenceListArb(2, 4),
        async (sequences) => {
          if (sequences.length < 2) {
            return true;
          }

          // Setup mocks with distinct results for each sequence
          const expectedResults: Array<{ parityScore: number; diffCount: number }> = [];

          for (let i = 0; i < sequences.length; i++) {
            const parityScore = 50 + i * 10; // Different scores: 50, 60, 70, ...
            const diffCount = i + 1; // Different diff counts: 1, 2, 3, ...
            expectedResults.push({ parityScore, diffCount });

            vi.mocked(mockTsRecorder.record).mockResolvedValueOnce(
              createMockTranscript(`ts-${i}`, 'typescript', 5)
            );
            vi.mocked(mockZmRecorder.record).mockResolvedValueOnce(
              createMockTranscript(`zm-${i}`, 'z-machine', 5)
            );
            vi.mocked(mockComparator.compare).mockReturnValueOnce(
              createMockDiffReport(parityScore, diffCount, 5)
            );
          }

          const batchRunner = new BatchRunner(mockTsRecorder, mockZmRecorder, mockComparator);
          const result = await batchRunner.run(sequences);

          // Verify each sequence has its own independent result
          for (let i = 0; i < sequences.length; i++) {
            const seqResult = result.sequences[i];
            expect(seqResult.id).toBe(sequences[i].id);
            expect(seqResult.parityScore).toBe(expectedResults[i].parityScore);
            expect(seqResult.diffCount).toBe(expectedResults[i].diffCount);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: game-recording-comparison, Property 8 (continued): Total Differences Aggregation
   * 
   * The total differences in a batch result should equal the sum of individual
   * sequence differences.
   * 
   * **Validates: Requirements 6.1, 6.3**
   */
  it('Property 8 (continued): Total differences equals sum of individual differences', async () => {
    await fc.assert(
      fc.asyncProperty(
        commandSequenceListArb(1, 5),
        fc.array(diffCountArb, { minLength: 1, maxLength: 5 }),
        async (sequences, diffCounts) => {
          const effectiveSequences = sequences.slice(0, diffCounts.length);
          const effectiveDiffCounts = diffCounts.slice(0, sequences.length);

          if (effectiveSequences.length === 0) {
            return true;
          }

          // Setup mocks
          for (let i = 0; i < effectiveSequences.length; i++) {
            vi.mocked(mockTsRecorder.record).mockResolvedValueOnce(
              createMockTranscript(`ts-${i}`, 'typescript', 5)
            );
            vi.mocked(mockZmRecorder.record).mockResolvedValueOnce(
              createMockTranscript(`zm-${i}`, 'z-machine', 5)
            );
            vi.mocked(mockComparator.compare).mockReturnValueOnce(
              createMockDiffReport(80, effectiveDiffCounts[i], 5)
            );
          }

          const batchRunner = new BatchRunner(mockTsRecorder, mockZmRecorder, mockComparator);
          const result = await batchRunner.run(effectiveSequences);

          // Calculate expected total
          const expectedTotal = effectiveDiffCounts.reduce((sum, count) => sum + count, 0);

          // Verify total differences
          expect(result.totalDifferences).toBe(expectedTotal);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: game-recording-comparison, Property 8 (continued): Worst Sequences Ordering
   * 
   * The worst sequences should be ordered by difference count (descending).
   * 
   * **Validates: Requirements 6.3**
   */
  it('Property 8 (continued): Worst sequences are ordered by diff count descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        commandSequenceListArb(3, 6),
        fc.array(diffCountArb, { minLength: 3, maxLength: 6 }),
        async (sequences, diffCounts) => {
          const effectiveSequences = sequences.slice(0, diffCounts.length);
          const effectiveDiffCounts = diffCounts.slice(0, sequences.length);

          if (effectiveSequences.length < 3) {
            return true;
          }

          // Setup mocks
          for (let i = 0; i < effectiveSequences.length; i++) {
            vi.mocked(mockTsRecorder.record).mockResolvedValueOnce(
              createMockTranscript(`ts-${i}`, 'typescript', 5)
            );
            vi.mocked(mockZmRecorder.record).mockResolvedValueOnce(
              createMockTranscript(`zm-${i}`, 'z-machine', 5)
            );
            vi.mocked(mockComparator.compare).mockReturnValueOnce(
              createMockDiffReport(80, effectiveDiffCounts[i], 5)
            );
          }

          const batchRunner = new BatchRunner(mockTsRecorder, mockZmRecorder, mockComparator);
          const result = await batchRunner.run(effectiveSequences);

          // Verify worst sequences are ordered by diff count (descending)
          // Only sequences with differences should be in worstSequences
          const worstWithDiffs = result.worstSequences.filter(id => {
            const seq = result.sequences.find(s => s.id === id);
            return seq && seq.diffCount > 0;
          });

          for (let i = 1; i < worstWithDiffs.length; i++) {
            const prevSeq = result.sequences.find(s => s.id === worstWithDiffs[i - 1]);
            const currSeq = result.sequences.find(s => s.id === worstWithDiffs[i]);
            
            if (prevSeq && currSeq) {
              expect(prevSeq.diffCount).toBeGreaterThanOrEqual(currSeq.diffCount);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
