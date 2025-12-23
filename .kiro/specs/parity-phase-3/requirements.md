# Requirements Document: Parity Phase 3 - Full Parity

## Introduction

This document specifies requirements for achieving 95%+ parity between the TypeScript Zork I implementation and the original Z-Machine game. Phase 2 achieved 76.47% aggregate parity. This phase addresses the remaining differences to reach the target.

**Current State (December 23, 2024):**
- Basic Exploration: 82.76% parity (5 differences)
- Object Manipulation: 87.18% parity (5 differences)
- Key Puzzle Solutions: 67.65% parity (23 differences)
- Aggregate: 76.47% parity

**Root Causes of Remaining Differences:**
1. Combat randomness (different RNG outcomes)
2. Missing mailbox in initial room description
3. Object order differences in room descriptions
4. Rug state not reflected in living room description
5. Missing sword glow messages near enemies
6. Song bird message timing differences
7. Initial game header differences

**Goal:** Achieve 95%+ content parity on all test sequences.

## Glossary

- **Z-Machine**: The original Zork I game running via dfrotz interpreter
- **TypeScript_Engine**: The TypeScript rewrite implementation
- **Content_Parity**: Percentage match excluding acceptable formatting differences
- **RNG**: Random Number Generator used for combat outcomes
- **Seed**: Initial value for deterministic random number generation

## Requirements

### Requirement 1: Deterministic Combat Testing

**User Story:** As a developer, I want combat outcomes to be deterministic during testing, so that parity comparisons are meaningful.

#### Acceptance Criteria

1. WHEN a seed is provided to the comparison tool THEN THE TypeScript_Engine SHALL use that seed for all random decisions
2. WHEN a seed is provided THEN THE Z-Machine_Recorder SHALL pass the seed to dfrotz
3. WHEN the same seed is used THEN combat outcomes SHALL be reproducible
4. THE Comparison_Tool SHALL support a --seed flag for deterministic testing

### Requirement 2: Fix Mailbox Display

**User Story:** As a player, I want to see the mailbox in the initial room description, so that I know it exists.

#### Acceptance Criteria

1. WHEN a player starts the game THEN THE TypeScript_Engine SHALL display "There is a small mailbox here." in the West of House description
2. WHEN a player looks at West of House THEN THE TypeScript_Engine SHALL include the mailbox in the room description
3. THE TypeScript_Engine SHALL match Z-Machine behavior for mailbox display

### Requirement 3: Fix Object Order in Room Descriptions

**User Story:** As a player, I want objects to appear in the same order as the original game, so that the experience matches.

#### Acceptance Criteria

1. WHEN displaying room contents THEN THE TypeScript_Engine SHALL list objects in the same order as Z-Machine
2. WHEN displaying attic contents THEN THE TypeScript_Engine SHALL show rope before knife (matching Z-Machine)
3. WHEN displaying kitchen contents THEN THE TypeScript_Engine SHALL show bottle before sack (matching Z-Machine)
4. THE TypeScript_Engine SHALL use consistent object ordering across all rooms

### Requirement 4: Fix Rug State in Living Room Description

**User Story:** As a player, I want the living room description to reflect the rug state, so that I can see my progress.

#### Acceptance Criteria

1. WHEN the rug has not been moved THEN THE TypeScript_Engine SHALL describe "a large oriental rug in the center of the room"
2. WHEN the rug has been moved and trap door is closed THEN THE TypeScript_Engine SHALL describe "a closed trap door at your feet"
3. WHEN the rug has been moved and trap door is open THEN THE TypeScript_Engine SHALL describe "a rug lying beside an open trap door"
4. THE TypeScript_Engine SHALL match Z-Machine living room descriptions exactly

### Requirement 5: Add Sword Glow Messages

**User Story:** As a player, I want to see sword glow messages when near enemies, so that I'm warned of danger.

#### Acceptance Criteria

1. WHEN a player enters a room with the troll while carrying the sword THEN THE TypeScript_Engine SHALL display "Your sword is glowing with a faint blue glow."
2. WHEN a player is in the troll room THEN THE TypeScript_Engine SHALL display "Your sword has begun to glow very brightly."
3. WHEN the troll dies THEN THE TypeScript_Engine SHALL display "Your sword is no longer glowing."
4. THE TypeScript_Engine SHALL match Z-Machine sword glow behavior exactly

### Requirement 6: Fix Song Bird Message Timing

**User Story:** As a player, I want song bird messages to appear at the same times as the original game.

#### Acceptance Criteria

1. WHEN in forest areas THEN THE TypeScript_Engine SHALL display song bird messages at the same frequency as Z-Machine
2. THE TypeScript_Engine SHALL use the same random timing logic as Z-Machine for song bird messages
3. IF deterministic testing is enabled THEN song bird messages SHALL appear at predictable times

### Requirement 7: Normalize Initial Game Header

**User Story:** As a developer, I want the comparison tool to handle header differences gracefully.

#### Acceptance Criteria

1. WHEN comparing transcripts THEN THE Comparison_Tool SHALL normalize game header differences
2. THE Comparison_Tool SHALL treat version/copyright differences as acceptable
3. THE Comparison_Tool SHALL focus on gameplay content, not metadata

## Success Metrics

- Basic Exploration sequence: 95%+ content parity
- Object Manipulation sequence: 95%+ content parity
- Key Puzzle Solutions sequence: 95%+ content parity
- Aggregate parity: 95%+

## Out of Scope

- Exact random number matching (use seeds for determinism)
- Pixel-perfect status bar (already normalized)
- Exact line wrapping (already normalized)

## Verification

Run comparison tests with seed and normalization:
```bash
npx tsx scripts/record-and-compare.ts --batch --normalize --seed 12345 --format text scripts/sequences/
```
