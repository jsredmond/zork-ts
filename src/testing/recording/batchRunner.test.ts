/**
 * Unit tests for BatchRunner
 * 
 * Tests batch execution with multiple sequences,
 * aggregate score calculation, and error handling.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchRunner, createBatchRunner } from './batchRunner.js';
import { TypeScriptRecorder } from './tsRecorder.js';
import { ZMachineRecorder } from './zmRecorder.js';
import { TranscriptComparator } from './comparator.js';
import { CommandSequence, Transcript, DiffReport } from './types.js';

// Mock the recorders
vi.mock('./tsRecorder.js', () => ({
  TypeScriptRecorder: vi.fn(),
  GameRecorder: vi.fn()
}));

vi.mock('./zmRecorder.js', () => ({
  ZMachineRecorder: vi.fn()
}));

describe('BatchRunner', () => {
  let mockTsRecorder: TypeScriptRecorder;
  let mockZmRecorder: ZMachineRecorder;
  let mockComparator: TranscriptComparator;
  let batchRunner: BatchRunner;

  const createMockTranscript = (id: string, source: 'typescript' | 'z-machine'): Transcript => ({
    id,
    source,
    startTime: new Date(),
    endTime: new Date(),
    entries: [
      { index: 0, command: '', output: 'Initial output', turnNumber: 0 },
      { index: 1, command: 'look', output: 'Room description', turnNumber: 1 }
    ],
    metadata: {}
  });

  const createMockDiffReport = (parityScore: number, diffCount: number): DiffReport => ({
    transcriptA: 'zm-test',
    transcriptB: 'ts-test',
    totalCommands: 2,
    exactMatches: diffCount === 0 ? 2 : 1,
    closeMatches: 0,
    differences: Array(diffCount).fill({
      index: 1,
      command: 'look',
      expected: 'Expected',
      actual: 'Actual',
      similarity: 0.5,
      severity: 'major' as const,
      category: 'room description'
    }),
    parityScore,
    summary: { critical: 0, major: diffCount, minor: 0, formatting: 0 }
  });

  beforeEach(() => {
    // Create mock instances
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

    batchRunner = new BatchRunner(mockTsRecorder, mockZmRecorder, mockComparator);
  });

  describe('run', () => {
    it('should execute sequences and return aggregated results', async () => {
      const sequences: CommandSequence[] = [
        { id: 'seq1', name: 'Sequence 1', commands: ['look', 'inventory'] },
        { id: 'seq2', name: 'Sequence 2', commands: ['north', 'south'] }
      ];

      // Setup mocks
      vi.mocked(mockTsRecorder.record)
        .mockResolvedValueOnce(createMockTranscript('ts-1', 'typescript'))
        .mockResolvedValueOnce(createMockTranscript('ts-2', 'typescript'));

      vi.mocked(mockZmRecorder.record)
        .mockResolvedValueOnce(createMockTranscript('zm-1', 'z-machine'))
        .mockResolvedValueOnce(createMockTranscript('zm-2', 'z-machine'));

      vi.mocked(mockComparator.compare)
        .mockReturnValueOnce(createMockDiffReport(100, 0))
        .mockReturnValueOnce(createMockDiffReport(50, 1));

      const result = await batchRunner.run(sequences);

      expect(result.sequences).toHaveLength(2);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.totalDifferences).toBe(1);
      expect(mockTsRecorder.record).toHaveBeenCalledTimes(2);
      expect(mockZmRecorder.record).toHaveBeenCalledTimes(2);
    });

    it('should handle Z-Machine recorder not available', async () => {
      const sequences: CommandSequence[] = [
        { id: 'seq1', name: 'Sequence 1', commands: ['look'] }
      ];

      vi.mocked(mockTsRecorder.record)
        .mockResolvedValue(createMockTranscript('ts-1', 'typescript'));
      vi.mocked(mockZmRecorder.isAvailable).mockResolvedValue(false);

      const result = await batchRunner.run(sequences);

      expect(result.sequences).toHaveLength(1);
      expect(result.sequences[0].parityScore).toBe(100);
      expect(result.detailedResults[0].error).toContain('not available');
    });

    it('should handle null Z-Machine recorder', async () => {
      const runnerWithoutZm = new BatchRunner(mockTsRecorder, null, mockComparator);
      const sequences: CommandSequence[] = [
        { id: 'seq1', name: 'Sequence 1', commands: ['look'] }
      ];

      vi.mocked(mockTsRecorder.record)
        .mockResolvedValue(createMockTranscript('ts-1', 'typescript'));

      const result = await runnerWithoutZm.run(sequences);

      expect(result.sequences).toHaveLength(1);
      expect(result.sequences[0].parityScore).toBe(100);
    });

    it('should stop on failure when stopOnFailure is true', async () => {
      const sequences: CommandSequence[] = [
        { id: 'seq1', name: 'Sequence 1', commands: ['look'] },
        { id: 'seq2', name: 'Sequence 2', commands: ['north'] }
      ];

      vi.mocked(mockTsRecorder.record)
        .mockRejectedValueOnce(new Error('Recording failed'));

      const result = await batchRunner.run(sequences, { stopOnFailure: true });

      expect(result.sequences).toHaveLength(1);
      expect(result.failureCount).toBe(1);
      expect(mockTsRecorder.record).toHaveBeenCalledTimes(1);
    });

    it('should continue on failure when stopOnFailure is false', async () => {
      const sequences: CommandSequence[] = [
        { id: 'seq1', name: 'Sequence 1', commands: ['look'] },
        { id: 'seq2', name: 'Sequence 2', commands: ['north'] }
      ];

      vi.mocked(mockTsRecorder.record)
        .mockRejectedValueOnce(new Error('Recording failed'))
        .mockResolvedValueOnce(createMockTranscript('ts-2', 'typescript'));

      vi.mocked(mockZmRecorder.record)
        .mockResolvedValue(createMockTranscript('zm-2', 'z-machine'));

      vi.mocked(mockComparator.compare)
        .mockReturnValue(createMockDiffReport(100, 0));

      const result = await batchRunner.run(sequences, { stopOnFailure: false });

      expect(result.sequences).toHaveLength(2);
      expect(result.failureCount).toBe(1);
      expect(result.successCount).toBe(1);
    });

    it('should identify worst sequences by diff count', async () => {
      const sequences: CommandSequence[] = [
        { id: 'seq1', name: 'Sequence 1', commands: ['look'] },
        { id: 'seq2', name: 'Sequence 2', commands: ['north'] },
        { id: 'seq3', name: 'Sequence 3', commands: ['south'] }
      ];

      vi.mocked(mockTsRecorder.record)
        .mockResolvedValue(createMockTranscript('ts', 'typescript'));
      vi.mocked(mockZmRecorder.record)
        .mockResolvedValue(createMockTranscript('zm', 'z-machine'));

      vi.mocked(mockComparator.compare)
        .mockReturnValueOnce(createMockDiffReport(90, 1))
        .mockReturnValueOnce(createMockDiffReport(50, 5))
        .mockReturnValueOnce(createMockDiffReport(70, 3));

      const result = await batchRunner.run(sequences);

      expect(result.worstSequences).toEqual(['seq2', 'seq3', 'seq1']);
    });
  });

  describe('runTypeScriptOnly', () => {
    it('should run sequences against TypeScript only', async () => {
      const sequences: CommandSequence[] = [
        { id: 'seq1', name: 'Sequence 1', commands: ['look'] }
      ];

      vi.mocked(mockTsRecorder.record)
        .mockResolvedValue(createMockTranscript('ts-1', 'typescript'));

      const result = await batchRunner.runTypeScriptOnly(sequences);

      expect(result.sequences).toHaveLength(1);
      expect(result.sequences[0].parityScore).toBe(100);
      expect(mockZmRecorder.record).not.toHaveBeenCalled();
    });
  });

  describe('aggregate parity score calculation', () => {
    it('should calculate weighted average parity score', async () => {
      const sequences: CommandSequence[] = [
        { id: 'seq1', name: 'Sequence 1', commands: ['look'] },
        { id: 'seq2', name: 'Sequence 2', commands: ['north'] }
      ];

      vi.mocked(mockTsRecorder.record)
        .mockResolvedValue(createMockTranscript('ts', 'typescript'));
      vi.mocked(mockZmRecorder.record)
        .mockResolvedValue(createMockTranscript('zm', 'z-machine'));

      // First sequence: 100% parity with 2 commands
      // Second sequence: 50% parity with 2 commands
      // Weighted average: (100*2 + 50*2) / 4 = 75%
      vi.mocked(mockComparator.compare)
        .mockReturnValueOnce(createMockDiffReport(100, 0))
        .mockReturnValueOnce(createMockDiffReport(50, 1));

      const result = await batchRunner.run(sequences);

      expect(result.aggregateParityScore).toBe(75);
    });
  });
});

describe('createBatchRunner', () => {
  it('should create a BatchRunner with default components', () => {
    const runner = createBatchRunner();
    expect(runner).toBeInstanceOf(BatchRunner);
  });

  it('should accept optional Z-Machine recorder', () => {
    const runner = createBatchRunner(null);
    expect(runner).toBeInstanceOf(BatchRunner);
  });
});
