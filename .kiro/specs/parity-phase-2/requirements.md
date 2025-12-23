# Requirements Document: Parity Phase 2 - Critical Fixes

## Introduction

This document specifies requirements for fixing critical parity issues discovered during Phase 1 verification testing. The record-and-compare system showed only 2.94% aggregate parity, far below the 95% target. Analysis revealed that while many P0/P1 issues were fixed, the death/resurrection system and comparison methodology are the primary blockers.

**Current State (December 22, 2024):**
- Basic Exploration: 0.00% parity (29 differences)
- Object Manipulation: 5.13% parity (37 differences)
- Key Puzzle Solutions: 1.47% parity (67 differences)
- Aggregate: 2.94% parity

**Root Causes Identified:**
1. Death/resurrection corrupts game state (CRITICAL)
2. Status bar differences inflate difference count (METHODOLOGY)
3. Line wrapping differences inflate difference count (METHODOLOGY)
4. Minor behavioral differences (drop all order, darkness messages)

**Goal:** Achieve 95%+ content parity by fixing critical bugs and normalizing comparison methodology.

## Glossary

- **Z-Machine**: The original Zork I game running via dfrotz interpreter
- **TypeScript_Engine**: The TypeScript rewrite implementation
- **Content_Parity**: Percentage match excluding acceptable formatting differences
- **Status_Bar**: The Z-Machine header line showing room name, score, and moves
- **Resurrection_System**: Game mechanic that revives player after death

## Requirements

### Requirement 1: Fix Death/Resurrection System

**User Story:** As a player, I want death and resurrection to work correctly, so that I can continue playing after dying without losing progress inappropriately.

#### Acceptance Criteria

1. WHEN a player dies from a grue THEN THE TypeScript_Engine SHALL display the death message and resurrection text
2. WHEN a player is resurrected THEN THE TypeScript_Engine SHALL place them in Forest (FOREST-1) as per original game
3. WHEN a player is resurrected THEN THE TypeScript_Engine SHALL scatter inventory items to appropriate locations
4. WHEN a player is resurrected THEN THE TypeScript_Engine SHALL preserve game flags and puzzle state
5. IF a player dies while holding the lamp THEN THE TypeScript_Engine SHALL move the lamp to Living Room
6. THE TypeScript_Engine SHALL NOT corrupt room connections or object locations after resurrection
7. WHEN a player dies for the third time THEN THE TypeScript_Engine SHALL end the game permanently

### Requirement 2: Fix Darkness Entry Display

**User Story:** As a player, I want to see the room name when entering a dark room, so that I know where I am.

#### Acceptance Criteria

1. WHEN a player enters a dark room THEN THE TypeScript_Engine SHALL display "You have moved into a dark place." before the darkness message
2. WHEN a player enters a dark room THEN THE TypeScript_Engine SHALL NOT display the room name on entry
3. WHEN a player types "look" in a dark room THEN THE TypeScript_Engine SHALL display the room name followed by darkness message
4. THE TypeScript_Engine SHALL match Z-Machine behavior for dark room entry exactly

### Requirement 3: Fix "take all" in Darkness

**User Story:** As a player, I want "take all" in darkness to behave like the original game.

#### Acceptance Criteria

1. WHEN a player types "take all" in a dark room THEN THE TypeScript_Engine SHALL respond "There's nothing here you can take."
2. THE TypeScript_Engine SHALL NOT respond "It's too dark to see!" for "take all" in darkness
3. THE TypeScript_Engine SHALL match Z-Machine behavior for "take all" in darkness

### Requirement 4: Fix "drop all" Order

**User Story:** As a player, I want "drop all" to list items in the same order as the original game.

#### Acceptance Criteria

1. WHEN a player types "drop all" THEN THE TypeScript_Engine SHALL drop items in inventory order (first to last)
2. THE TypeScript_Engine SHALL NOT drop items in reverse order
3. THE TypeScript_Engine SHALL match Z-Machine output format for "drop all"

### Requirement 5: Normalize Comparison Tool

**User Story:** As a developer, I want the comparison tool to measure content parity accurately, so that acceptable formatting differences don't inflate the difference count.

#### Acceptance Criteria

1. WHEN comparing transcripts THEN THE Comparison_Tool SHALL strip status bar lines before comparison
2. WHEN comparing transcripts THEN THE Comparison_Tool SHALL normalize line wrapping differences
3. WHEN comparing transcripts THEN THE Comparison_Tool SHALL report "content parity" separately from "exact parity"
4. THE Comparison_Tool SHALL provide a --normalize flag to enable content-focused comparison
5. WHEN --normalize is enabled THEN THE Comparison_Tool SHALL ignore status bar and line wrapping differences

### Requirement 6: Fix Lamp State on Death

**User Story:** As a player, I want the lamp to be properly handled when I die, so that I can find it again after resurrection.

#### Acceptance Criteria

1. WHEN a player dies while holding a lit lamp THEN THE TypeScript_Engine SHALL turn off the lamp
2. WHEN a player dies while holding the lamp THEN THE TypeScript_Engine SHALL move the lamp to Living Room
3. WHEN a player is resurrected THEN THE TypeScript_Engine SHALL allow the player to retrieve the lamp from Living Room

### Requirement 7: Preserve Puzzle State on Death

**User Story:** As a player, I want puzzle progress to be preserved when I die, so that I don't have to redo completed puzzles.

#### Acceptance Criteria

1. WHEN a player dies THEN THE TypeScript_Engine SHALL preserve the trap door state (open/closed)
2. WHEN a player dies THEN THE TypeScript_Engine SHALL preserve the rug state (moved/not moved)
3. WHEN a player dies THEN THE TypeScript_Engine SHALL preserve defeated enemy states (troll dead, etc.)
4. WHEN a player dies THEN THE TypeScript_Engine SHALL preserve collected treasure locations

## Success Metrics

- Basic Exploration sequence: 95%+ content parity
- Object Manipulation sequence: 95%+ content parity
- Key Puzzle Solutions sequence: 95%+ content parity
- Death/resurrection test: 100% behavioral match
- No game state corruption after death

## Out of Scope

- Status bar implementation (acceptable difference)
- Exact line wrapping (acceptable difference)
- Song bird message timing (minor atmospheric difference)

## Verification

Run comparison tests with normalization:
```bash
npx tsx scripts/record-and-compare.ts --batch --normalize --format text scripts/sequences/
```

Run death/resurrection specific test:
```bash
npx tsx scripts/test-death-resurrection.ts
```
