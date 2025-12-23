# Implementation Plan: Treasure Take Scoring

## Overview

Implement the two-part treasure scoring system matching the original Zork I ZIL behavior: VALUE points on first take, TVALUE points when in trophy case.

## Tasks

- [x] 1. Add TREASURE_TAKE_VALUES constant
  - Add VALUE points for all treasures matching 1dungeon.zil
  - Rename TREASURE_VALUES to TREASURE_CASE_VALUES for clarity
  - Update all references to use new constant name
  - _Requirements: 3.1_

- [x] 1.1 Create TREASURE_TAKE_VALUES in scoring.ts
  - Define VALUE points for each treasure from ZIL source
  - _Requirements: 3.1_

- [x] 1.2 Rename TREASURE_VALUES to TREASURE_CASE_VALUES
  - Update constant name for clarity
  - Update all imports and references throughout codebase
  - _Requirements: 3.1_

- [x] 1.3 Commit to Git
  - Commit message: "refactor: Add TREASURE_TAKE_VALUES and rename TREASURE_VALUES to TREASURE_CASE_VALUES"
  - _Requirements: 3.1_

---

- [x] 2. Implement scoreTreasureTake function
  - Award VALUE points when taking treasures for first time
  - Track which treasures have been scored
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2.1 Add scoreTreasureTake function to scoring.ts
  - Check if treasure has VALUE > 0
  - Check if already scored using globalVariables
  - Award points to BASE_SCORE
  - Mark treasure as scored
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2.2 Add isTreasureTakeScored helper function
  - Check if treasure's VALUE has been awarded
  - _Requirements: 1.4_

- [x] 2.3 Commit to Git
  - Commit message: "feat: Add scoreTreasureTake function for VALUE points on take"
  - _Requirements: 1.1, 1.2, 1.4_

---

- [x] 3. Integrate scoring into TakeAction
  - Call scoreTreasureTake after successful take
  - _Requirements: 1.1, 1.3_

- [x] 3.1 Modify TakeAction.execute in actions.ts
  - After successful take, call scoreTreasureTake
  - Only award points for treasures (non-treasures return 0)
  - _Requirements: 1.1, 1.3_

- [x] 3.2 Commit to Git
  - Commit message: "feat: Award VALUE points when taking treasures"
  - _Requirements: 1.1, 1.3_

---

- [x] 4. Remove invalid OPEN_EGG action
  - Remove from ACTION_VALUES
  - Update any references
  - _Requirements: 4.1, 4.2_

- [x] 4.1 Remove OPEN_EGG from ACTION_VALUES in scoring.ts
  - Delete the entry
  - Verify other action values preserved
  - _Requirements: 4.1, 4.2_

- [x] 4.2 Commit to Git
  - Commit message: "fix: Remove invalid OPEN_EGG action points"
  - _Requirements: 4.1_

---

- [x] 5. Update tests
  - Add unit tests for new functions
  - Add property tests for scoring behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

- [x] 5.1 Add unit tests for TREASURE_TAKE_VALUES
  - Verify all values match ZIL source
  - _Requirements: 3.1_

- [x] 5.2 Add unit tests for scoreTreasureTake
  - Test first take awards points
  - Test second take awards no points
  - Test non-treasure returns 0
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 5.3 Write property test for VALUE scoring idempotence
  - **Property 1: VALUE points awarded on first take only**
  - **Validates: Requirements 1.1, 1.2**
  - _Requirements: 1.1, 1.2_

- [x] 5.4 Write property test for total score formula
  - **Property 4: Total score formula consistency**
  - **Validates: Requirements 2.3, 5.1**
  - _Requirements: 2.3, 5.1_

- [x] 5.5 Commit to Git
  - Commit message: "test: Add tests for treasure take scoring"
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

---

- [x] 6. Update serialization for save/restore
  - Ensure VALUE_SCORED_TREASURES is persisted
  - _Requirements: 1.4_

- [x] 6.1 Update serializer to handle VALUE_SCORED_TREASURES
  - Add to serialization
  - Add to deserialization
  - Handle missing state for backward compatibility
  - _Requirements: 1.4_

- [x] 6.2 Commit to Git
  - Commit message: "feat: Persist VALUE scoring state in save files"
  - _Requirements: 1.4_

---

- [x] 7. Final verification
  - Run all tests
  - Verify scoring matches original game
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7.1 Run full test suite
  - Ensure all tests pass
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7.2 Manual verification
  - Test taking egg gives 5 points
  - Test putting egg in case gives additional 5 points
  - Verify SCORE command shows correct total
  - _Requirements: 1.1, 2.1, 5.1_

- [x] 7.3 Final commit
  - Commit message: "feat: Complete treasure take scoring implementation"
  - _Requirements: All_

## Notes

- All tasks are required including tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
