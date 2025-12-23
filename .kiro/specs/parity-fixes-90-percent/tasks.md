# Implementation Plan: Parity Fixes for 90% Target

## Overview

This plan implements fixes to achieve 90%+ aggregate parity between the TypeScript Zork I implementation and the original Z-Machine game.

**Current State:** 83% aggregate parity
**Target State:** 90%+ aggregate parity

---

## Phase 1: Fix Batch Runner Process Cleanup

### Goal
Fix Z-Machine process cleanup to prevent timeout failures in batch mode.

---

- [x] 1. Fix Z-Machine recorder process cleanup
  - Make cleanup async and wait for process termination
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 Update cleanup method to be async
  - File: `src/testing/recording/zmRecorder.ts`
  - Change `cleanup(): void` to `async cleanup(): Promise<void>`
  - Add Promise that resolves when process exits
  - Add force kill with SIGKILL after 1 second timeout
  - _Requirements: 1.1, 1.3_

- [x] 1.2 Update record method to await cleanup
  - File: `src/testing/recording/zmRecorder.ts`
  - Change `this.cleanup()` to `await this.cleanup()` in finally block
  - _Requirements: 1.1_

- [x] 1.3 Write unit tests for process cleanup
  - File: `src/testing/recording/zmRecorder.test.ts`
  - Test cleanup waits for process termination
  - Test force kill on timeout
  - _Requirements: 1.1, 1.3_

- [x] 1.4 Commit to Git
  - Commit message: "fix: Z-Machine recorder process cleanup waits for termination"
  - Include zmRecorder.ts changes
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

---

## Phase 2: Fix Dark Room Display

### Goal
Remove room name from dark room look output.

---

- [ ] 2. Fix dark room display
  - Show only darkness message without room name
  - _Requirements: 2.1, 2.2_

- [ ] 2.1 Update formatRoomDescription function
  - File: `src/game/actions.ts`
  - Check lighting FIRST before adding room name
  - Return only darkness message for dark rooms
  - _Requirements: 2.1, 2.2_

- [ ] 2.2 Write property test for dark room output
  - File: `src/game/actions.test.ts`
  - **Property 2: Dark Room Output Format**
  - **Validates: Requirements 2.1, 2.2**
  - _Requirements: 2.1, 2.2_

- [ ] 2.3 Commit to Git
  - Commit message: "fix: Dark room look shows only darkness message without room name"
  - Include actions.ts changes
  - _Requirements: 2.1, 2.2_

---

## Phase 3: Fix Trap Door Close Message

### Goal
Update trap door close message to match Z-Machine.

---

- [ ] 3. Fix trap door close message
  - Show "The door swings shut and closes." from living room
  - _Requirements: 3.1_

- [ ] 3.1 Add special case for trap door in CloseAction
  - File: `src/game/actions.ts`
  - Check if closing trap door from LIVING-ROOM
  - Return "The door swings shut and closes." message
  - _Requirements: 3.1_

- [ ] 3.2 Write unit test for trap door close message
  - File: `src/game/actions.test.ts`
  - Test close from living room shows correct message
  - Test close from cellar shows different message
  - _Requirements: 3.1_

- [ ] 3.3 Commit to Git
  - Commit message: "fix: Trap door close message matches Z-Machine"
  - Include actions.ts changes
  - _Requirements: 3.1_

---

## Phase 4: Add Song Bird Message Suppression

### Goal
Add testing mode to suppress random atmospheric messages.

---

- [ ] 4. Add song bird message suppression for testing
  - Enable deterministic testing by suppressing random messages
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4.1 Add testingMode to GameState
  - File: `src/game/state.ts`
  - Add private testingMode: boolean = false
  - Add setTestingMode(enabled: boolean) method
  - Add isTestingMode(): boolean method
  - _Requirements: 4.1_

- [ ] 4.2 Update forest room daemon to check testing mode
  - File: `src/engine/daemons.ts`
  - Check state.isTestingMode() at start of forestRoomDaemon
  - Return false immediately if testing mode enabled
  - _Requirements: 4.1_

- [ ] 4.3 Add suppressRandomMessages to RecordingOptions
  - File: `src/testing/recording/types.ts`
  - Add suppressRandomMessages?: boolean to RecordingOptions interface
  - _Requirements: 4.4_

- [ ] 4.4 Update TypeScript recorder to enable testing mode
  - File: `src/testing/recording/tsRecorder.ts`
  - Check options.suppressRandomMessages in record method
  - Call state.setTestingMode(true) when option is enabled
  - _Requirements: 4.2_

- [ ] 4.5 Write property test for song bird suppression
  - File: `src/engine/daemons.test.ts`
  - **Property 3: Song Bird Suppression in Testing Mode**
  - **Validates: Requirements 4.1**
  - _Requirements: 4.1_

- [ ] 4.6 Commit to Git
  - Commit message: "feat: Add testing mode to suppress random song bird messages"
  - Include state.ts, daemons.ts, types.ts, tsRecorder.ts changes
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

---

## Phase 5: Fix Drop All Order

### Goal
Fix inventory ordering for drop all command.

---

- [ ] 5. Fix drop all inventory order
  - Drop items in reverse order (last acquired first)
  - _Requirements: 5.1_

- [ ] 5.1 Update DropAllAction to reverse inventory order
  - File: `src/game/actions.ts`
  - Change `[...state.inventory]` to `[...state.inventory].reverse()`
  - _Requirements: 5.1_

- [ ] 5.2 Write property test for drop all order
  - File: `src/game/actions.test.ts`
  - **Property 4: Drop All Reverse Order**
  - **Validates: Requirements 5.1**
  - _Requirements: 5.1_

- [ ] 5.3 Commit to Git
  - Commit message: "fix: Drop all uses reverse inventory order to match Z-Machine"
  - Include actions.ts changes
  - _Requirements: 5.1_

---

## Phase 6: Verification and Testing

### Goal
Verify 90%+ aggregate parity on all sequences.

---

- [ ] 6. Run parity comparison tests
  - Verify 90%+ aggregate parity on all sequences
  - _Requirements: All_

- [ ] 6.1 Run batch comparison with all fixes
  - Execute: `npx tsx scripts/record-and-compare.ts --batch --normalize --format text scripts/sequences/`
  - Verify all 10 sequences execute successfully (no 0% timeout failures)
  - Target: 90%+ aggregate parity
  - _Requirements: All_

- [ ] 6.2 Document final parity results
  - Update PARITY_DIFFERENCES.md with final scores
  - List any remaining differences
  - Mark spec as complete if 90%+ achieved
  - _Requirements: All_

- [ ] 6.3 Final commit
  - Commit message: "docs: Parity fixes complete - 90%+ achieved"
  - Include documentation updates
  - _Requirements: All_

---

## Notes

- Phase 1 (process cleanup) is critical - fixes batch runner reliability
- Phase 2 (dark room) and Phase 3 (trap door) are simple targeted fixes
- Phase 4 (song bird) requires changes across multiple files
- Phase 5 (drop all) is a one-line fix with high impact
- Phase 6 (verification) confirms 90%+ parity achieved
- All tasks including property-based tests are required
