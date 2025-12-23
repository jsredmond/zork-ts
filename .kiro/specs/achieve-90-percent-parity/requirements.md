# Requirements Document

## Introduction

This document specifies requirements for addressing the remaining parity issues to achieve 90%+ aggregate parity between the TypeScript Zork I implementation and the original Z-Machine game.

**Current State:** 88.08% aggregate parity (December 23, 2024)
**Target:** 90%+ aggregate parity

**Analysis of Remaining Issues:**
Based on the detailed comparison results, the primary remaining differences are:
1. Song bird atmospheric messages appearing inconsistently
2. Status bar formatting differences  
3. Copyright/version text differences
4. Puzzle-specific content differences (worst sequence: 77.9% parity)

## Glossary

- **Z-Machine**: The original Zork I game running via frotz interpreter
- **TypeScript_Engine**: The TypeScript rewrite implementation
- **Song_Bird_Messages**: Random atmospheric messages in forest rooms
- **Puzzle_Solutions_Sequence**: The worst-performing test sequence (77.9% parity)
- **Content_Normalization**: Process of stripping status bars and normalizing formatting

## Requirements

### Requirement 1: Improve Puzzle Solutions Sequence Parity

**User Story:** As a developer, I want the puzzle solutions sequence to achieve 90%+ parity, so that complex game mechanics work correctly.

#### Acceptance Criteria

1. WHEN running the puzzle solutions sequence THEN THE TypeScript_Engine SHALL achieve at least 90% parity with Z-Machine
2. WHEN puzzle-specific commands are executed THEN THE TypeScript_Engine SHALL produce output matching Z-Machine behavior
3. THE TypeScript_Engine SHALL handle all puzzle mechanics identically to Z-Machine
4. WHEN puzzle state changes occur THEN THE TypeScript_Engine SHALL maintain consistency with Z-Machine

### Requirement 2: Enhance Content Normalization

**User Story:** As a developer, I want improved content normalization to filter out acceptable differences, so that parity scores reflect actual content differences.

#### Acceptance Criteria

1. WHEN comparing transcripts THEN THE Content_Normalization SHALL filter out song bird atmospheric messages
2. WHEN comparing transcripts THEN THE Content_Normalization SHALL normalize status bar differences more effectively
3. WHEN comparing transcripts THEN THE Content_Normalization SHALL handle copyright/version text differences
4. THE Content_Normalization SHALL focus comparison on core game content only

### Requirement 3: Fix Inventory Management Sequence

**User Story:** As a player, I want inventory operations to match the original game exactly, so that item handling is authentic.

#### Acceptance Criteria

1. WHEN running inventory management commands THEN THE TypeScript_Engine SHALL achieve at least 90% parity
2. WHEN items are taken or dropped THEN THE TypeScript_Engine SHALL use identical messaging to Z-Machine
3. WHEN inventory limits are reached THEN THE TypeScript_Engine SHALL handle overflow identically to Z-Machine
4. THE TypeScript_Engine SHALL maintain inventory state consistency with Z-Machine

### Requirement 4: Improve Navigation Directions Sequence

**User Story:** As a player, I want movement and navigation to work identically to the original game.

#### Acceptance Criteria

1. WHEN executing navigation commands THEN THE TypeScript_Engine SHALL achieve at least 90% parity
2. WHEN invalid directions are attempted THEN THE TypeScript_Engine SHALL show identical error messages to Z-Machine
3. WHEN room transitions occur THEN THE TypeScript_Engine SHALL display identical descriptions to Z-Machine
4. THE TypeScript_Engine SHALL handle all directional synonyms identically to Z-Machine

### Requirement 5: Achieve 90% Aggregate Parity Target

**User Story:** As a developer, I want to achieve 90%+ aggregate parity across all test sequences, so that the TypeScript implementation is highly faithful to the original.

#### Acceptance Criteria

1. WHEN running all test sequences THEN THE TypeScript_Engine SHALL achieve at least 90% aggregate parity
2. WHEN individual sequences are tested THEN AT LEAST 7 out of 10 sequences SHALL achieve 90%+ parity
3. THE TypeScript_Engine SHALL maintain reliability with zero timeout failures in batch mode
4. WHEN parity is measured THEN THE improvement SHALL be sustained across multiple test runs

## Success Metrics

- **Primary Goal:** 90%+ aggregate parity across all sequences
- **Secondary Goal:** At least 7 out of 10 sequences above 90% individual parity
- **Reliability:** Zero batch test failures or timeouts
- **Consistency:** Results reproducible across multiple test runs

## Current Sequence Performance Analysis

Based on latest results (88.08% aggregate):

**Above 90% (4 sequences):**
- Object Manipulation: 97.44%
- Lamp Operations: 96.77% 
- House Exploration: 90.38%
- Forest Exploration: 90.70%

**Below 90% (6 sequences - need improvement):**
- Mailbox and Leaflet: 88.89% (2 differences) - Close to target
- Examine Objects: 88.64% (5 differences) - Close to target  
- Navigation Directions: 87.76% (6 differences) - Needs work
- Basic Exploration: 86.21% (4 differences) - Needs work
- Inventory Management: 84.21% (6 differences) - Needs work
- Key Puzzle Solutions: 77.94% (16 differences) - Major work needed

## Priority Focus Areas

1. **High Priority:** Key Puzzle Solutions (77.94% → 90%+)
2. **Medium Priority:** Inventory Management (84.21% → 90%+)
3. **Medium Priority:** Navigation Directions (87.76% → 90%+)
4. **Low Priority:** Basic Exploration (86.21% → 90%+)
5. **Low Priority:** Examine Objects (88.64% → 90%+)
6. **Low Priority:** Mailbox and Leaflet (88.89% → 90%+)

## Verification

Run batch comparison tests to verify 90%+ aggregate parity:
```bash
npx tsx scripts/record-and-compare.ts --batch --normalize --format text scripts/sequences/
```

Target: 90%+ aggregate parity with at least 7 sequences above 90% individual parity.