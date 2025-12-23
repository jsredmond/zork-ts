# Requirements Document

## Introduction

A testing utility system that runs the TypeScript Zork I implementation, records the output from command sequences, and compares the results against the original game (via the compiled z3 file run through a Z-machine interpreter). This system is separate from the main game and exists solely to verify behavioral parity between the TypeScript rewrite and the original Infocom implementation.

## Glossary

- **Recorder**: The component that captures game output from command sequences
- **Session**: A single playthrough recording containing commands and their corresponding outputs
- **Transcript**: The complete record of a game session including all commands and responses
- **Comparator**: The component that analyzes differences between TypeScript and original game outputs
- **Z_Machine_Interpreter**: An external program (like Frotz) that runs the original compiled z3 game file
- **Command_Sequence**: An ordered list of player commands to execute against both game versions
- **Diff_Report**: A structured report showing differences between two transcripts
- **Parity_Score**: A metric indicating how closely the TypeScript output matches the original

## Requirements

### Requirement 1: Record TypeScript Game Sessions

**User Story:** As a developer, I want to run command sequences against the TypeScript game and record all output, so that I can capture the game's behavior for comparison.

#### Acceptance Criteria

1. WHEN a command sequence is provided, THE Recorder SHALL execute each command against the TypeScript game engine and capture all output
2. WHEN recording a session, THE Recorder SHALL capture the room descriptions, object interactions, and all game messages
3. WHEN a session completes, THE Recorder SHALL produce a Transcript containing timestamped commands and their responses
4. WHEN recording, THE Recorder SHALL preserve the exact formatting and whitespace of game output
5. IF a command causes a game error, THEN THE Recorder SHALL capture the error message and continue recording

### Requirement 2: Record Original Game Sessions

**User Story:** As a developer, I want to run the same command sequences against the original z3 game file, so that I have a baseline for comparison.

#### Acceptance Criteria

1. WHEN a command sequence is provided, THE Recorder SHALL execute each command against the Z_Machine_Interpreter running the original z3 file
2. WHEN recording from the original game, THE Recorder SHALL capture output in the same format as TypeScript recordings
3. WHEN the Z_Machine_Interpreter is not available, THE Recorder SHALL report a clear error message
4. THE Recorder SHALL support configurable interpreter paths for different Z-machine implementations

### Requirement 3: Compare Transcripts

**User Story:** As a developer, I want to compare transcripts from both game versions, so that I can identify behavioral differences.

#### Acceptance Criteria

1. WHEN two transcripts are provided, THE Comparator SHALL identify differences in output for each command
2. WHEN comparing, THE Comparator SHALL normalize whitespace and formatting differences that don't affect meaning
3. WHEN differences are found, THE Comparator SHALL produce a Diff_Report showing the specific variations
4. THE Comparator SHALL calculate a Parity_Score indicating the percentage of matching outputs
5. WHEN outputs match semantically but differ in formatting, THE Comparator SHALL flag these as minor differences

### Requirement 4: Generate Comparison Reports

**User Story:** As a developer, I want detailed reports of comparison results, so that I can prioritize which differences to fix.

#### Acceptance Criteria

1. WHEN a comparison completes, THE Diff_Report SHALL categorize differences by severity (critical, minor, formatting)
2. WHEN generating a report, THE Diff_Report SHALL include the command that produced each difference
3. THE Diff_Report SHALL provide a summary with total commands, matches, and differences by category
4. WHEN requested, THE Diff_Report SHALL output in both human-readable and machine-parseable formats

### Requirement 5: Manage Command Sequences

**User Story:** As a developer, I want to create and manage reusable command sequences, so that I can consistently test specific game scenarios.

#### Acceptance Criteria

1. THE Command_Sequence SHALL support loading commands from text files (one command per line)
2. THE Command_Sequence SHALL support comments (lines starting with #) for documentation
3. WHEN a command sequence file is invalid, THE Recorder SHALL report the specific parsing error
4. THE Command_Sequence SHALL support including other sequence files for composability

### Requirement 6: Batch Testing

**User Story:** As a developer, I want to run multiple command sequences and aggregate results, so that I can get a comprehensive parity assessment.

#### Acceptance Criteria

1. WHEN multiple command sequences are provided, THE Recorder SHALL execute each and produce individual transcripts
2. WHEN batch testing completes, THE Comparator SHALL produce an aggregate Parity_Score across all sequences
3. THE Diff_Report SHALL identify which command sequences have the most differences
4. WHEN running batch tests, THE Recorder SHALL support parallel execution for performance

### Requirement 7: Deterministic Testing Support

**User Story:** As a developer, I want to control randomness in both game versions, so that I can make meaningful comparisons of non-deterministic behaviors.

#### Acceptance Criteria

1. WHEN a seed value is provided, THE Recorder SHALL configure the TypeScript game to use deterministic random behavior
2. THE Recorder SHALL document which game behaviors are inherently non-deterministic and cannot be seeded
3. WHEN comparing non-deterministic outputs, THE Comparator SHALL flag these as expected variations
4. THE Comparator SHALL support configurable tolerance for known non-deterministic differences

