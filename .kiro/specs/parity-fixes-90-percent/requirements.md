# Requirements Document

## Introduction

This document specifies requirements for fixing remaining parity issues to achieve 90%+ aggregate parity between the TypeScript Zork I implementation and the original Z-Machine game. Current state is 83% aggregate parity across 10 test sequences.

**Current State (December 23, 2024):**
- Aggregate Parity: 83%
- 10 test sequences with varying parity scores
- Key issues: batch runner bug, dark room display, trap door message, song bird randomness, drop all order

**Target:** 90%+ aggregate parity on non-combat sequences

## Glossary

- **Z-Machine**: The original Zork I game running via dfrotz interpreter
- **TypeScript_Engine**: The TypeScript rewrite implementation
- **Batch_Runner**: Component that executes multiple test sequences
- **ZM_Recorder**: Z-Machine recorder that spawns dfrotz processes
- **Content_Parity**: Percentage match between Z-Machine and TypeScript output
- **Song_Bird_Daemon**: Random atmospheric message generator for forest rooms

## Requirements

### Requirement 1: Fix Batch Runner Process Cleanup

**User Story:** As a developer, I want the batch runner to properly clean up Z-Machine processes between runs, so that all test sequences execute successfully.

#### Acceptance Criteria

1. WHEN the ZM_Recorder cleanup method is called THEN THE ZM_Recorder SHALL wait for the process to fully terminate before returning
2. WHEN running batch mode with multiple sequences THEN THE Batch_Runner SHALL successfully execute all sequences without timeout failures
3. IF a Z-Machine process fails to terminate gracefully THEN THE ZM_Recorder SHALL force kill the process and wait for termination
4. WHEN the 6th sequence in batch mode is executed THEN THE Batch_Runner SHALL achieve non-zero parity (not 0% timeout failure)

### Requirement 2: Fix Dark Room Name Display

**User Story:** As a player, I want dark room descriptions to match the original game, so that the experience is authentic.

#### Acceptance Criteria

1. WHEN looking in a dark room THEN THE TypeScript_Engine SHALL NOT display the room name before the darkness message
2. WHEN looking in a dark room THEN THE TypeScript_Engine SHALL display only "It is pitch black. You are likely to be eaten by a grue."
3. THE TypeScript_Engine SHALL match Z-Machine behavior for dark room look output exactly

### Requirement 3: Fix Trap Door Close Message

**User Story:** As a player, I want the trap door close message to match the original game.

#### Acceptance Criteria

1. WHEN a player closes the trap door from the living room THEN THE TypeScript_Engine SHALL display "The door swings shut and closes."
2. THE TypeScript_Engine SHALL NOT display "Closed." for the trap door close action
3. THE TypeScript_Engine SHALL match Z-Machine trap door close message exactly

### Requirement 4: Add Song Bird Message Suppression for Testing

**User Story:** As a developer, I want to suppress random song bird messages during testing, so that parity comparisons are deterministic.

#### Acceptance Criteria

1. WHEN a testing mode flag is enabled THEN THE Song_Bird_Daemon SHALL NOT display random atmospheric messages
2. WHEN recording a transcript for comparison THEN THE TypeScript_Engine SHALL suppress song bird messages
3. THE Song_Bird_Daemon SHALL continue to function normally when testing mode is disabled
4. THE Recording_Options SHALL include a suppressRandomMessages option

### Requirement 5: Fix Drop All Inventory Order

**User Story:** As a player, I want items to drop in the same order as the original game.

#### Acceptance Criteria

1. WHEN a player executes "drop all" THEN THE TypeScript_Engine SHALL drop items in reverse inventory order (last acquired first)
2. THE TypeScript_Engine SHALL match Z-Machine "drop all" item order exactly
3. WHEN items are dropped THEN THE TypeScript_Engine SHALL display them in the same order as Z-Machine

## Success Metrics

- Batch runner: All 10 sequences execute successfully (no 0% timeout failures)
- Dark room display: 100% match with Z-Machine
- Trap door message: 100% match with Z-Machine
- Song bird suppression: Deterministic output during testing
- Drop all order: 100% match with Z-Machine
- Aggregate parity: 90%+ on non-combat sequences

## Verification

Run batch comparison tests:
```bash
npx tsx scripts/record-and-compare.ts --batch --normalize --format text scripts/sequences/
```

Target: 90%+ aggregate parity with all sequences executing successfully.
