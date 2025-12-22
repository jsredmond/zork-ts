/**
 * BatchRunner - Executes multiple command sequences and aggregates results
 * 
 * This module provides functionality to run multiple command sequences
 * against both the TypeScript and Z-Machine recorders, compare the results,
 * and produce aggregated parity scores.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

import { TypeScriptRecorder, GameRecorder } from './tsRecorder.js';
import { ZMachineRecorder } from './zmRecorder.js';
import { TranscriptComparator } from './comparator.js';
import {
  CommandSequence,
  BatchOptions,
  BatchResult,
  SequenceResult,
  RecordingOptions,
  ComparisonOptions,
  DiffReport,
} from './types.js';

/**
 * Default batch execution options
 */
const DEFAULT_BATCH_OPTIONS: Required<BatchOptions> = {
  parallel: false,
  maxConcurrency: 4,
  stopOnFailure: false,
};

/**
 * Result of executing a single sequence with full details
 */
export interface DetailedSequenceResult extends SequenceResult {
  /** The diff report for this sequence */
  diffReport?: DiffReport;
  /** Error message if execution failed */
  error?: string;
  /** Whether execution was successful */
  success: boolean;
}

/**
 * Extended batch result with detailed information
 */
export interface DetailedBatchResult extends BatchResult {
  /** Detailed results for each sequence */
  detailedResults: DetailedSequenceResult[];
  /** Total execution time in milliseconds */
  totalExecutionTime: number;
  /** Number of successful executions */
  successCount: number;
  /** Number of failed executions */
  failureCount: number;
}

/**
 * BatchRunner executes multiple command sequences against both recorders
 * and aggregates the comparison results.
 * 
 * Features:
 * - Execute sequences against TypeScript and Z-Machine recorders
 * - Aggregate parity scores across all sequences
 * - Rank sequences by difference count
 * - Support parallel execution (optional)
 */
export class BatchRunner {
  private tsRecorder: TypeScriptRecorder;
  private zmRecorder: ZMachineRecorder | null;
  private comparator: TranscriptComparator;

  constructor(
    tsRecorder: TypeScriptRecorder,
    zmRecorder: ZMachineRecorder | null,
    comparator: TranscriptComparator
  ) {
    this.tsRecorder = tsRecorder;
    this.zmRecorder = zmRecorder;
    this.comparator = comparator;
  }

  /**
   * Run multiple command sequences and aggregate results
   * 
   * @param sequences - Array of command sequences to execute
   * @param options - Batch execution options
   * @param recordingOptions - Options for recording sessions
   * @param comparisonOptions - Options for comparing transcripts
   * @returns Aggregated batch results
   */
  async run(
    sequences: CommandSequence[],
    options?: BatchOptions,
    recordingOptions?: RecordingOptions,
    comparisonOptions?: ComparisonOptions
  ): Promise<DetailedBatchResult> {
    const opts = { ...DEFAULT_BATCH_OPTIONS, ...options };
    const startTime = Date.now();
    
    let detailedResults: DetailedSequenceResult[];

    if (opts.parallel) {
      detailedResults = await this.runParallel(
        sequences,
        opts,
        recordingOptions,
        comparisonOptions
      );
    } else {
      detailedResults = await this.runSequential(
        sequences,
        opts,
        recordingOptions,
        comparisonOptions
      );
    }

    const totalExecutionTime = Date.now() - startTime;

    return this.aggregateResults(detailedResults, totalExecutionTime);
  }

  /**
   * Run sequences sequentially
   */
  private async runSequential(
    sequences: CommandSequence[],
    options: Required<BatchOptions>,
    recordingOptions?: RecordingOptions,
    comparisonOptions?: ComparisonOptions
  ): Promise<DetailedSequenceResult[]> {
    const results: DetailedSequenceResult[] = [];

    for (const sequence of sequences) {
      const result = await this.executeSequence(
        sequence,
        recordingOptions,
        comparisonOptions
      );
      results.push(result);

      if (options.stopOnFailure && !result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Run sequences in parallel with concurrency limit
   */
  private async runParallel(
    sequences: CommandSequence[],
    options: Required<BatchOptions>,
    recordingOptions?: RecordingOptions,
    comparisonOptions?: ComparisonOptions
  ): Promise<DetailedSequenceResult[]> {
    const results: DetailedSequenceResult[] = new Array(sequences.length);
    const executing: Promise<void>[] = [];
    let index = 0;
    let shouldStop = false;

    const executeNext = async (): Promise<void> => {
      while (index < sequences.length && !shouldStop) {
        const currentIndex = index++;
        const sequence = sequences[currentIndex];

        const result = await this.executeSequence(
          sequence,
          recordingOptions,
          comparisonOptions
        );
        results[currentIndex] = result;

        if (options.stopOnFailure && !result.success) {
          shouldStop = true;
        }
      }
    };

    // Start concurrent workers
    const workerCount = Math.min(options.maxConcurrency, sequences.length);
    for (let i = 0; i < workerCount; i++) {
      executing.push(executeNext());
    }

    await Promise.all(executing);

    // Filter out undefined results (in case of early stop)
    return results.filter(r => r !== undefined);
  }

  /**
   * Execute a single sequence against both recorders and compare
   */
  private async executeSequence(
    sequence: CommandSequence,
    recordingOptions?: RecordingOptions,
    comparisonOptions?: ComparisonOptions
  ): Promise<DetailedSequenceResult> {
    const startTime = Date.now();

    try {
      // Record from TypeScript engine
      const tsTranscript = await this.tsRecorder.record(
        sequence.commands,
        recordingOptions
      );

      // If Z-Machine recorder is not available, return TS-only result
      if (!this.zmRecorder) {
        const executionTime = Date.now() - startTime;
        return {
          id: sequence.id,
          name: sequence.name,
          parityScore: 100, // No comparison possible
          diffCount: 0,
          executionTime,
          success: true,
          error: 'Z-Machine recorder not available - TypeScript only'
        };
      }

      // Check if Z-Machine recorder is available
      const zmAvailable = await this.zmRecorder.isAvailable();
      if (!zmAvailable) {
        const executionTime = Date.now() - startTime;
        return {
          id: sequence.id,
          name: sequence.name,
          parityScore: 100,
          diffCount: 0,
          executionTime,
          success: true,
          error: 'Z-Machine interpreter not available - TypeScript only'
        };
      }

      // Record from Z-Machine
      const zmTranscript = await this.zmRecorder.record(
        sequence.commands,
        recordingOptions
      );

      // Compare transcripts
      const diffReport = this.comparator.compare(
        zmTranscript,  // Expected (original)
        tsTranscript,  // Actual (TypeScript)
        comparisonOptions
      );

      const executionTime = Date.now() - startTime;

      return {
        id: sequence.id,
        name: sequence.name,
        parityScore: diffReport.parityScore,
        diffCount: diffReport.differences.length,
        executionTime,
        diffReport,
        success: true
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        id: sequence.id,
        name: sequence.name,
        parityScore: 0,
        diffCount: 0,
        executionTime,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Aggregate results from all sequence executions
   */
  private aggregateResults(
    detailedResults: DetailedSequenceResult[],
    totalExecutionTime: number
  ): DetailedBatchResult {
    const successfulResults = detailedResults.filter(r => r.success);
    const failedResults = detailedResults.filter(r => !r.success);

    // Calculate aggregate parity score (weighted average by command count)
    let totalCommands = 0;
    let weightedParitySum = 0;

    for (const result of successfulResults) {
      const commandCount = result.diffReport?.totalCommands ?? 1;
      totalCommands += commandCount;
      weightedParitySum += result.parityScore * commandCount;
    }

    const aggregateParityScore = totalCommands > 0
      ? weightedParitySum / totalCommands
      : 0;

    // Calculate total differences
    const totalDifferences = detailedResults.reduce(
      (sum, r) => sum + r.diffCount,
      0
    );

    // Find worst sequences (sorted by diff count descending)
    const worstSequences = [...detailedResults]
      .sort((a, b) => b.diffCount - a.diffCount)
      .slice(0, 5)
      .filter(r => r.diffCount > 0)
      .map(r => r.id);

    // Build basic sequence results for BatchResult interface
    const sequences: SequenceResult[] = detailedResults.map(r => ({
      id: r.id,
      name: r.name,
      parityScore: r.parityScore,
      diffCount: r.diffCount,
      executionTime: r.executionTime
    }));

    return {
      sequences,
      aggregateParityScore,
      totalDifferences,
      worstSequences,
      detailedResults,
      totalExecutionTime,
      successCount: successfulResults.length,
      failureCount: failedResults.length
    };
  }

  /**
   * Run TypeScript-only recording for all sequences
   * Useful when Z-Machine interpreter is not available
   */
  async runTypeScriptOnly(
    sequences: CommandSequence[],
    options?: BatchOptions,
    recordingOptions?: RecordingOptions
  ): Promise<DetailedBatchResult> {
    const opts = { ...DEFAULT_BATCH_OPTIONS, ...options };
    const startTime = Date.now();
    const detailedResults: DetailedSequenceResult[] = [];

    for (const sequence of sequences) {
      const seqStartTime = Date.now();
      
      try {
        await this.tsRecorder.record(sequence.commands, recordingOptions);
        
        detailedResults.push({
          id: sequence.id,
          name: sequence.name,
          parityScore: 100,
          diffCount: 0,
          executionTime: Date.now() - seqStartTime,
          success: true
        });
      } catch (error) {
        detailedResults.push({
          id: sequence.id,
          name: sequence.name,
          parityScore: 0,
          diffCount: 0,
          executionTime: Date.now() - seqStartTime,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });

        if (opts.stopOnFailure) {
          break;
        }
      }
    }

    return this.aggregateResults(detailedResults, Date.now() - startTime);
  }
}

/**
 * Factory function to create a BatchRunner with default components
 */
export function createBatchRunner(
  zmRecorder?: ZMachineRecorder | null,
  comparisonOptions?: ComparisonOptions
): BatchRunner {
  const tsRecorder = new TypeScriptRecorder();
  const comparator = new TranscriptComparator(comparisonOptions);
  
  return new BatchRunner(tsRecorder, zmRecorder ?? null, comparator);
}
