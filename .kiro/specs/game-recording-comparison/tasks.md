# Implementation Plan: Game Recording and Comparison System

## Overview

This plan implements a testing utility for recording game sessions from both the TypeScript Zork I implementation and the original z3 file, then comparing outputs to verify behavioral parity. The system is built as standalone testing infrastructure in `src/testing/` and `scripts/`.

## Tasks

- [x] 1. Set up core interfaces and types
  - Create type definitions for transcripts, recordings, and comparisons
  - Define configuration interfaces
  - _Requirements: 1.3, 3.3, 4.1_

- [x] 1.1 Create transcript and recording types in `src/testing/recording/types.ts`
  - Define `TranscriptEntry`, `Transcript`, `RecordingOptions` interfaces
  - Define `DiffEntry`, `DiffReport`, `ComparisonOptions` interfaces
  - Define `CommandSequence`, `BatchResult` interfaces
  - _Requirements: 1.3, 3.3, 4.1_

- [x] 1.2 Commit to Git
  - Commit message: "feat: Add core types for game recording comparison system"
  - Include all type definition files
  - _Requirements: 1.3, 3.3, 4.1_

---

- [x] 2. Implement TypeScript game recorder
  - Record sessions from the TypeScript game engine
  - Support deterministic random seeding
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 7.1_

- [x] 2.1 Create `TypeScriptRecorder` class in `src/testing/recording/tsRecorder.ts`
  - Implement `record()` method using existing `CommandExecutor` and `Parser`
  - Integrate with `SeededRandom` for deterministic behavior
  - Capture all output including room descriptions and messages
  - Handle errors gracefully and continue recording
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 7.1_

- [x] 2.2 Write unit tests for TypeScriptRecorder
  - Test basic recording of command sequences
  - Test error handling and continuation
  - Test deterministic seeding produces same output
  - _Requirements: 1.1, 1.5, 7.1_

- [x] 2.3 Write property test for Recording Completeness
  - **Property 1: Recording Completeness**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 2.4 Write property test for Deterministic Behavior
  - **Property 9: Deterministic Behavior**
  - **Validates: Requirements 7.1, 7.3, 7.4**

- [x] 2.5 Commit to Git
  - Commit message: "feat: Implement TypeScript game recorder with deterministic support"
  - Include recorder implementation and tests
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 7.1_

---

- [x] 3. Implement Z-Machine recorder
  - Record sessions from original z3 file via external interpreter
  - Support dfrotz and other Z-machine interpreters
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3.1 Create `ZMachineRecorder` class in `src/testing/recording/zmRecorder.ts`
  - Implement child process spawning for dfrotz/frotz
  - Send commands via stdin, capture output from stdout
  - Parse interpreter output to match transcript format
  - Handle interpreter unavailability gracefully
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3.2 Create configuration loader in `src/testing/recording/config.ts`
  - Load interpreter path and game file path from config
  - Support environment variable overrides
  - Validate paths exist before recording
  - _Requirements: 2.3, 2.4_

- [x] 3.3 Write unit tests for ZMachineRecorder
  - Test interpreter availability check
  - Test error handling when interpreter not found
  - Test output parsing and transcript structure
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.4 Write property test for Cross-Platform Recording Consistency
  - **Property 4: Cross-Platform Recording Consistency**
  - **Validates: Requirements 2.1, 2.2**

- [x] 3.5 Commit to Git
  - Commit message: "feat: Implement Z-Machine recorder for original game comparison"
  - Include recorder implementation and tests
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

---

- [x] 4. Implement command sequence loader
  - Load command sequences from text files
  - Support comments and file includes
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4.1 Create `CommandSequenceLoader` class in `src/testing/recording/sequenceLoader.ts`
  - Parse text files with one command per line
  - Handle comment lines (# prefix)
  - Resolve @include directives recursively
  - Report parsing errors with line numbers
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4.2 Write unit tests for CommandSequenceLoader
  - Test basic file parsing
  - Test comment handling
  - Test include resolution
  - Test error reporting for invalid files
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4.3 Write property test for Command Sequence Parsing
  - **Property 7: Command Sequence Parsing (Round-Trip)**
  - **Validates: Requirements 5.1, 5.2, 5.4**

- [x] 4.4 Commit to Git
  - Commit message: "feat: Implement command sequence loader with include support"
  - Include loader implementation and tests
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

---

- [x] 5. Implement transcript comparator
  - Compare transcripts and identify differences
  - Normalize whitespace and classify severity
  - Calculate parity scores
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3_

- [x] 5.1 Create `TranscriptComparator` class in `src/testing/recording/comparator.ts`
  - Implement output normalization (whitespace, line endings)
  - Calculate character-level similarity
  - Classify differences by severity (critical, major, minor, formatting)
  - Generate structured diff reports
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 4.1, 4.2_

- [x] 5.2 Implement parity score calculation
  - Calculate percentage of matching outputs
  - Support configurable tolerance threshold
  - _Requirements: 3.4_

- [x] 5.3 Write unit tests for TranscriptComparator
  - Test normalization of various whitespace patterns
  - Test similarity calculation accuracy
  - Test severity classification logic
  - Test parity score calculation
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 5.4 Write property test for Difference Detection Completeness
  - **Property 5: Difference Detection Completeness**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 4.1, 4.2, 4.3**

- [x] 5.5 Write property test for Parity Score Calculation
  - **Property 6: Parity Score Calculation**
  - **Validates: Requirements 3.4, 6.2**

- [x] 5.6 Commit to Git
  - Commit message: "feat: Implement transcript comparator with severity classification"
  - Include comparator implementation and tests
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3_

---

- [x] 6. Implement batch runner and report generator
  - Execute multiple sequences and aggregate results
  - Generate reports in multiple formats
  - _Requirements: 6.1, 6.2, 6.3, 4.4_

- [x] 6.1 Create `BatchRunner` class in `src/testing/recording/batchRunner.ts`
  - Execute sequences against both recorders
  - Aggregate parity scores across sequences
  - Rank sequences by difference count
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 6.2 Create `ReportGenerator` class in `src/testing/recording/reportGenerator.ts`
  - Generate text, JSON, markdown, and HTML reports
  - Include summary statistics and detailed differences
  - _Requirements: 4.3, 4.4_

- [x] 6.3 Write unit tests for BatchRunner and ReportGenerator
  - Test batch execution with multiple sequences
  - Test aggregate score calculation
  - Test report generation in all formats
  - _Requirements: 6.1, 6.2, 6.3, 4.4_

- [x] 6.4 Write property test for Batch Execution Independence
  - **Property 8: Batch Execution Independence**
  - **Validates: Requirements 6.1, 6.3**

- [x] 6.5 Commit to Git
  - Commit message: "feat: Implement batch runner and multi-format report generator"
  - Include batch runner, report generator, and tests
  - _Requirements: 6.1, 6.2, 6.3, 4.4_

---

- [x] 7. Create CLI tool and sample command sequences
  - Provide command-line interface for running comparisons
  - Include sample command sequences for common test scenarios
  - _Requirements: 1.1, 2.1, 5.1_

- [x] 7.1 Create CLI script in `scripts/record-and-compare.ts`
  - Support recording from TypeScript only, Z-Machine only, or both
  - Support single sequence or batch mode
  - Support output format selection
  - _Requirements: 1.1, 2.1_

- [x] 7.2 Create sample command sequences in `scripts/sequences/`
  - Create `basic-exploration.txt` for room navigation
  - Create `object-manipulation.txt` for take/drop/examine
  - Create `puzzle-solutions.txt` for key puzzles
  - _Requirements: 5.1_

- [x] 7.3 Add npm scripts for common operations
  - Add `npm run record:ts` for TypeScript recording
  - Add `npm run record:zm` for Z-Machine recording
  - Add `npm run compare` for comparison
  - _Requirements: 1.1, 2.1_

- [x] 7.4 Commit to Git
  - Commit message: "feat: Add CLI tool and sample command sequences"
  - Include CLI script, sample sequences, and npm scripts
  - _Requirements: 1.1, 2.1, 5.1_

---

- [x] 8. Final integration and documentation
  - Wire all components together
  - Create usage documentation
  - _Requirements: All_

- [x] 8.1 Create index file in `src/testing/recording/index.ts`
  - Export all public classes and types
  - Provide convenience factory functions
  - _Requirements: All_

- [x] 8.2 Create README in `src/testing/recording/README.md`
  - Document installation requirements (dfrotz)
  - Document configuration options
  - Provide usage examples
  - _Requirements: All_

- [x] 8.3 Checkpoint - Ensure all tests pass
  - Run full test suite
  - Verify property tests pass with 100+ iterations
  - Ask user if questions arise

- [x] 8.4 Final commit and tag
  - Commit message: "feat: Complete game recording comparison system"
  - Tag: v1.0.0-game-recording-comparison
  - _Requirements: All_

## Notes

- All property-based tests are required for comprehensive coverage
- The Z-Machine recorder requires dfrotz or another Z-machine interpreter to be installed
- Property tests use fast-check and run minimum 100 iterations each
- The system builds on existing infrastructure in `scripts/compare-transcript.ts`
