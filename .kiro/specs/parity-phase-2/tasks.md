# Implementation Plan: Parity Phase 2 - Critical Fixes

## Overview

This plan fixes the remaining critical parity issues blocking 95%+ parity. The primary focus is:
1. Death/resurrection system (causing cascade failures in puzzle-solutions)
2. Comparison tool normalization (for accurate parity measurement)
3. Minor behavioral fixes (darkness messages, drop order)

**Current State:**
- Aggregate Parity: 2.94%
- Primary Blocker: Death/resurrection corrupts game state

**Target State:** 95%+ content parity on all test sequences

---

## Phase 1: Death/Resurrection System Fix (P0)

### Goal
Fix the death/resurrection system to preserve game state and match Z-Machine behavior.

---

- [x] 1. Fix resurrection state handling
  - Ensure player resurrects correctly without state corruption
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 1.1 Review and fix resurrectPlayer function
  - File: `src/game/death.ts`
  - Ensure player moves to FOREST-1
  - Turn off lamp before scattering if lit
  - Verify trap door TOUCHBIT is cleared correctly
  - _Requirements: 1.2, 1.5_

- [x] 1.2 Fix randomizeObjects function
  - File: `src/game/death.ts`
  - Ensure lamp goes to LIVING-ROOM (already implemented, verify)
  - Ensure coffin goes to EGYPT-ROOM (already implemented, verify)
  - Ensure other items scatter to valid locations
  - _Requirements: 1.3, 1.5_

- [x] 1.3 Verify puzzle state preservation
  - File: `src/game/death.ts`
  - Trap door state should NOT be reset (only TOUCHBIT cleared)
  - Rug state should be preserved
  - Defeated enemy states should be preserved
  - Treasures in trophy case should remain
  - _Requirements: 1.4, 7.1, 7.2, 7.3, 7.4_

- [x] 1.4 Add death/resurrection unit tests
  - File: `src/game/death.test.ts`
  - Test resurrection location is FOREST-1
  - Test lamp is in LIVING-ROOM and off after death
  - Test inventory is empty after resurrection
  - Test puzzle states are preserved
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 1.5 Commit to Git
  - Commit message: "fix: Death/resurrection preserves game state correctly"
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

---

## Phase 2: Darkness Handling Fixes (P1)

### Goal
Fix darkness-related behaviors to match Z-Machine exactly.

---

- [x] 2. Fix dark room entry display
  - Show correct message when entering dark room
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.1 Update movement handler for dark room entry
  - File: `src/game/actions.ts`
  - When entering dark room, show "You have moved into a dark place."
  - Do NOT show room name on entry
  - Then show darkness warning
  - _Requirements: 2.1, 2.2_

- [x] 2.2 Update look command for dark rooms
  - File: `src/game/actions.ts`
  - When looking in dark room, show room name first
  - Then show darkness warning
  - _Requirements: 2.3_

- [x] 2.3 Test dark room entry and look
  - Verify entry shows "You have moved into a dark place."
  - Verify look shows room name then darkness message
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2.4 Commit to Git
  - Commit message: "fix: Dark room entry and look match Z-Machine behavior"
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

---

- [x] 3. Fix "take all" in darkness
  - Return correct message in dark rooms
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3.1 Update TakeAllAction for darkness
  - File: `src/game/actions.ts`
  - In darkness, return "There's nothing here you can take."
  - NOT "It's too dark to see!"
  - _Requirements: 3.1, 3.2_

- [x] 3.2 Test "take all" in darkness
  - Enter dark room
  - Verify "take all" returns "There's nothing here you can take."
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3.3 Commit to Git
  - Commit message: "fix: 'take all' in darkness matches Z-Machine response"
  - _Requirements: 3.1, 3.2, 3.3_

---

- [x] 4. Fix "drop all" order
  - Drop items in inventory order, not reverse
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.1 Update DropAllAction order
  - File: `src/game/actions.ts`
  - Iterate inventory in forward order (first to last)
  - NOT reverse order
  - _Requirements: 4.1, 4.2_

- [x] 4.2 Test "drop all" order
  - Add multiple items to inventory
  - Verify "drop all" lists them in inventory order
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.3 Commit to Git
  - Commit message: "fix: 'drop all' drops items in inventory order"
  - _Requirements: 4.1, 4.2, 4.3_

---

## Phase 3: Comparison Tool Normalization (P1)

### Goal
Add normalization to comparison tool for accurate content parity measurement.

---

- [x] 5. Add status bar stripping
  - Strip Z-Machine status bar lines before comparison
  - _Requirements: 5.1_

- [x] 5.1 Implement stripStatusBar function
  - File: `src/testing/recording/comparator.ts`
  - Detect status bar pattern: "Room Name                                    Score: X        Moves: Y"
  - Remove matching lines from output
  - _Requirements: 5.1_

- [x] 5.2 Add unit tests for stripStatusBar
  - File: `src/testing/recording/comparator.test.ts`
  - Test status bar is removed
  - Test non-status-bar lines are preserved
  - _Requirements: 5.1_

- [x] 5.3 Commit to Git
  - Commit message: "feat: Add status bar stripping to comparator"
  - _Requirements: 5.1_

---

- [x] 6. Add line wrapping normalization
  - Normalize line wrapping differences
  - _Requirements: 5.2_

- [x] 6.1 Implement normalizeLineWrapping function
  - File: `src/testing/recording/comparator.ts`
  - Join lines that were wrapped mid-sentence
  - Preserve paragraph breaks
  - _Requirements: 5.2_

- [x] 6.2 Add unit tests for normalizeLineWrapping
  - File: `src/testing/recording/comparator.test.ts`
  - Test wrapped lines are joined
  - Test paragraph breaks are preserved
  - _Requirements: 5.2_

- [x] 6.3 Commit to Git
  - Commit message: "feat: Add line wrapping normalization to comparator"
  - _Requirements: 5.2_

---

- [x] 7. Add --normalize flag to CLI
  - Enable content-focused comparison
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 7.1 Update ComparisonOptions interface
  - File: `src/testing/recording/types.ts`
  - Add stripStatusBar: boolean
  - Add normalizeLineWrapping: boolean
  - _Requirements: 5.4_

- [x] 7.2 Update compare method to use normalization
  - File: `src/testing/recording/comparator.ts`
  - Apply normalization when options are set
  - _Requirements: 5.5_

- [x] 7.3 Add --normalize flag to CLI
  - File: `scripts/record-and-compare.ts`
  - Parse --normalize flag
  - Set normalization options when flag is present
  - _Requirements: 5.4_

- [x] 7.4 Test --normalize flag
  - Run comparison with and without --normalize
  - Verify normalized comparison ignores status bar and line wrapping
  - _Requirements: 5.4, 5.5_

- [x] 7.5 Commit to Git
  - Commit message: "feat: Add --normalize flag for content-focused comparison"
  - _Requirements: 5.3, 5.4, 5.5_

---

## Phase 4: Verification and Testing

### Goal
Verify all fixes achieve target parity.

---

- [x] 8. Run parity comparison tests
  - Verify 95%+ content parity on all sequences
  - _Requirements: All_

- [x] 8.1 Run basic-exploration comparison with normalization
  - Execute: `npx tsx scripts/record-and-compare.ts --normalize --mode both scripts/sequences/basic-exploration.txt`
  - Target: 95%+ content parity
  - Document remaining differences
  - _Requirements: All_

- [x] 8.2 Run object-manipulation comparison with normalization
  - Execute: `npx tsx scripts/record-and-compare.ts --normalize --mode both scripts/sequences/object-manipulation.txt`
  - Target: 95%+ content parity
  - Document remaining differences
  - _Requirements: All_

- [x] 8.3 Run puzzle-solutions comparison with normalization
  - Execute: `npx tsx scripts/record-and-compare.ts --normalize --mode both scripts/sequences/puzzle-solutions.txt`
  - Target: 95%+ content parity
  - Document remaining differences
  - _Requirements: All_

- [x] 8.4 Run full batch comparison with normalization
  - Execute: `npx tsx scripts/record-and-compare.ts --batch --normalize --format text scripts/sequences/`
  - Verify aggregate content parity 95%+
  - _Requirements: All_

- [x] 8.5 Update PARITY_DIFFERENCES.md with final results
  - Document final parity scores
  - List any remaining differences
  - Mark spec as complete if 95%+ achieved
  - _Requirements: All_

- [x] 8.6 Commit to Git
  - Commit message: "docs: Parity Phase 2 verification complete - 95%+ achieved"
  - _Requirements: All_

---

## Notes

- Phase 1 (death/resurrection) is the critical blocker - fix first
- Phase 2 (darkness) fixes behavioral differences
- Phase 3 (normalization) enables accurate measurement
- Phase 4 (verification) confirms success
- The .kiro directory is gitignored, so commits only affect source files
- Run tests after each phase to track progress

