# Implementation Plan: Parity Phase 3 - Full Parity

## Overview

This plan implements the remaining fixes to achieve 95%+ content parity between the TypeScript Zork I implementation and the original Z-Machine game.

**Current State:** 76.47% aggregate parity
**Target State:** 95%+ aggregate parity

---

## Phase 1: Deterministic Testing Infrastructure

### Goal
Add seeded RNG support for reproducible combat outcomes during testing.

---

- [x] 1. Add seeded RNG to GameState
  - Enable deterministic random number generation
  - _Requirements: 1.1, 1.3_

- [x] 1.1 Create SeededRandom class
  - File: `src/game/state.ts`
  - Implement linear congruential generator
  - Add next() and nextInt() methods
  - _Requirements: 1.1_

- [x] 1.2 Add RNG methods to GameState
  - File: `src/game/state.ts`
  - Add setSeed(), random(), randomInt() methods
  - Use seeded RNG when seed is set, Math.random() otherwise
  - _Requirements: 1.1, 1.3_

- [x] 1.3 Update combat to use GameState RNG
  - File: `src/engine/combat.ts`
  - Replace Math.random() calls with state.random()
  - _Requirements: 1.3_

- [x] 1.4 Add seed support to TypeScript recorder
  - File: `src/testing/recording/tsRecorder.ts`
  - Pass seed to game state when recording
  - _Requirements: 1.1_

- [x] 1.5 Add unit tests for seeded RNG
  - File: `src/game/state.test.ts`
  - Test same seed produces same sequence
  - Test different seeds produce different sequences
  - _Requirements: 1.1, 1.3_

- [x] 1.6 Commit to Git
  - Commit message: "feat: Add seeded RNG for deterministic testing"
  - _Requirements: 1.1, 1.3_

---

## Phase 2: Room Description Fixes

### Goal
Fix mailbox display, object order, and living room description.

---

- [x] 2. Fix mailbox display in West of House
  - Show mailbox in initial room description
  - _Requirements: 2.1, 2.2_

- [x] 2.1 Add mailbox to West of House room objects
  - File: `src/game/data/rooms-complete.ts`
  - Add 'MAILBOX' to objects array for WEST-OF-HOUSE
  - _Requirements: 2.1_

- [x] 2.2 Verify mailbox object has correct description flags
  - File: `src/game/data/objects-complete.ts`
  - Ensure mailbox has firstDescription for room display
  - _Requirements: 2.2_

- [x] 2.3 Test mailbox display
  - Verify initial room shows "There is a small mailbox here."
  - Verify look command shows mailbox
  - _Requirements: 2.1, 2.2_

- [x] 2.4 Commit to Git
  - Commit message: "fix: Show mailbox in West of House description"
  - _Requirements: 2.1, 2.2_

---

- [x] 3. Fix object order in room descriptions
  - List objects in Z-Machine order
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3.1 Analyze Z-Machine object order
  - Determine how Z-Machine orders objects in room descriptions
  - Document expected order for attic (rope, knife) and kitchen (bottle, sack)
  - _Requirements: 3.1_

- [x] 3.2 Update room description generation
  - File: `src/game/rooms.ts` or relevant file
  - Sort objects by definition order or priority
  - _Requirements: 3.1_

- [x] 3.3 Test object order
  - Verify attic shows rope before knife
  - Verify kitchen shows bottle before sack
  - _Requirements: 3.2, 3.3_

- [x] 3.4 Commit to Git
  - Commit message: "fix: Object order in room descriptions matches Z-Machine"
  - _Requirements: 3.1, 3.2, 3.3_

---

- [x] 4. Fix living room description for rug/trap door state
  - Dynamic description based on game state
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.1 Implement dynamic living room description
  - File: `src/game/data/rooms-complete.ts` or `src/game/rooms.ts`
  - Check rug-moved flag and trap door state
  - Return appropriate description variant
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.2 Test living room description states
  - Test rug not moved: "a large oriental rug in the center of the room"
  - Test rug moved, door closed: "a closed trap door at your feet"
  - Test rug moved, door open: "a rug lying beside an open trap door"
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.3 Commit to Git
  - Commit message: "fix: Living room description reflects rug and trap door state"
  - _Requirements: 4.1, 4.2, 4.3_

---

## Phase 3: Sword Glow System

### Goal
Add sword glow messages when near enemies.

---

- [x] 5. Implement sword glow messages
  - Show glow warnings near troll
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 5.1 Add sword glow check function
  - File: `src/engine/troll.ts` or `src/engine/combat.ts`
  - Check if player has sword and is near troll
  - Return appropriate glow message
  - _Requirements: 5.1, 5.2_

- [x] 5.2 Integrate sword glow into room entry
  - File: `src/game/actions.ts` or movement handler
  - Call sword glow check on room entry
  - Append glow message to room description
  - _Requirements: 5.1, 5.2_

- [x] 5.3 Add sword glow stop on troll death
  - File: `src/engine/troll.ts`
  - Include "Your sword is no longer glowing." in death message
  - _Requirements: 5.3_

- [x] 5.4 Test sword glow messages
  - Test glow when entering troll room
  - Test glow when adjacent to troll
  - Test glow stops when troll dies
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 5.5 Commit to Git
  - Commit message: "feat: Add sword glow messages near enemies"
  - _Requirements: 5.1, 5.2, 5.3_

---

## Phase 4: Comparison Tool Enhancements

### Goal
Add header normalization for accurate parity measurement.

---

- [x] 6. Add game header normalization
  - Strip version/copyright from comparison
  - _Requirements: 7.1_

- [x] 6.1 Implement stripGameHeader function
  - File: `src/testing/recording/comparator.ts`
  - Remove ZORK I header, copyright, version lines
  - Preserve gameplay content
  - _Requirements: 7.1_

- [x] 6.2 Add stripGameHeader option to ComparisonOptions
  - File: `src/testing/recording/types.ts`
  - Add stripGameHeader: boolean option
  - _Requirements: 7.1_

- [x] 6.3 Update compare method to use header stripping
  - File: `src/testing/recording/comparator.ts`
  - Apply header stripping when option is enabled
  - _Requirements: 7.1_

- [x] 6.4 Update --normalize flag to include header stripping
  - File: `scripts/record-and-compare.ts`
  - Enable stripGameHeader when --normalize is used
  - _Requirements: 7.1_

- [x] 6.5 Test header normalization
  - Verify header lines are stripped
  - Verify gameplay content is preserved
  - _Requirements: 7.1_

- [x] 6.6 Commit to Git
  - Commit message: "feat: Add game header normalization to comparator"
  - _Requirements: 7.1_

---

## Phase 5: Verification and Testing

### Goal
Verify 95%+ content parity on all sequences.

---

- [x] 7. Run parity comparison tests
  - Verify 95%+ content parity on all sequences
  - _Requirements: All_

- [x] 7.1 Run basic-exploration comparison
  - Execute: `npx tsx scripts/record-and-compare.ts --normalize --mode both scripts/sequences/basic-exploration.txt`
  - Target: 95%+ content parity
  - _Requirements: All_

- [x] 7.2 Run object-manipulation comparison
  - Execute: `npx tsx scripts/record-and-compare.ts --normalize --mode both scripts/sequences/object-manipulation.txt`
  - Target: 95%+ content parity
  - _Requirements: All_

- [x] 7.3 Run puzzle-solutions comparison
  - Execute: `npx tsx scripts/record-and-compare.ts --normalize --mode both scripts/sequences/puzzle-solutions.txt`
  - Target: 95%+ content parity
  - _Requirements: All_

- [x] 7.4 Run full batch comparison
  - Execute: `npx tsx scripts/record-and-compare.ts --batch --normalize --format text scripts/sequences/`
  - Verify aggregate content parity 95%+
  - _Requirements: All_

- [x] 7.5 Update PARITY_DIFFERENCES.md with final results
  - Document final parity scores
  - List any remaining differences
  - Mark spec as complete if 95%+ achieved
  - _Requirements: All_

- [x] 7.6 Commit to Git
  - Commit message: "docs: Parity Phase 3 verification complete - 95%+ achieved"
  - _Requirements: All_

---

## Notes

- Phase 1 (seeded RNG) enables deterministic combat testing
- Phase 2 (room descriptions) fixes visual parity issues
- Phase 3 (sword glow) adds missing gameplay feedback
- Phase 4 (header normalization) improves comparison accuracy
- Phase 5 (verification) confirms 95%+ parity achieved
- The .kiro directory is gitignored, so commits only affect source files
