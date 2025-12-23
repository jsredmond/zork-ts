# Implementation Plan: Fix Parity Issues (December 2024)

## Overview

This plan fixes critical parity differences discovered through the record-and-compare system. The fixes are organized by priority and dependency order.

**Current State:**
- Basic Exploration: 29 differences, 0% parity
- Object Manipulation: 39 differences, 0% parity
- Key Puzzle Solutions: 68 differences, 1.47% parity

**Target State:** 95%+ parity on all test sequences

---

## Phase 1: Parser and Command Fixes (P0)

### Goal
Add missing commands ("all", "out") and fix parser to recognize them.

---

- [x] 1. Add "out" command to vocabulary
  - Add "out", "exit", "leave" as direction synonyms
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 1.1 Update vocabulary.ts with direction synonyms
  - File: `src/parser/vocabulary.ts`
  - Add 'OUT', 'EXIT', 'LEAVE' to DIRECTION_WORDS array
  - Ensure they map to appropriate exit direction
  - _Requirements: 3.1_

- [x] 1.2 Test "out" command recognition
  - Verify "out" is parsed as direction
  - Verify "out" returns "You can't go that way." when no exit
  - Verify "out" does NOT return "I don't understand that command."
  - _Requirements: 3.2, 3.3_

- [x] 1.3 Commit to Git
  - Commit message: "feat: Add 'out' command as direction synonym"
  - _Requirements: 3.1, 3.2, 3.3_

---

- [x] 2. Implement "all" object reference in parser
  - Add special handling for "take all" and "drop all"
  - _Requirements: 2.1, 2.2_

- [x] 2.1 Update parser.ts to detect "all" keyword
  - File: `src/parser/parser.ts`
  - Add isAllObjects flag to ParsedCommand interface
  - Detect "all" as direct object and set flag
  - _Requirements: 2.1_

- [x] 2.2 Implement TakeAllAction handler
  - File: `src/game/actions.ts`
  - Create TakeAllAction class
  - Get all takeable objects in room
  - Take each and list results
  - Handle empty room case: "There's nothing here you can take."
  - _Requirements: 2.1, 2.2_

- [x] 2.3 Implement DropAllAction handler
  - File: `src/game/actions.ts`
  - Create DropAllAction class
  - Drop all inventory items
  - List each dropped item
  - Handle empty inventory case
  - _Requirements: 2.1_

- [x] 2.4 Update executor to route "all" commands
  - File: `src/engine/executor.ts`
  - Check isAllObjects flag
  - Route to TakeAllAction or DropAllAction
  - _Requirements: 2.1, 2.2_

- [x] 2.5 Test "take all" and "drop all"
  - Test with items in room
  - Test with empty room
  - Test with empty inventory
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.6 Commit to Git
  - Commit message: "feat: Implement 'take all' and 'drop all' commands"
  - _Requirements: 2.1, 2.2_

---

## Phase 2: Darkness Enforcement (P0)

### Goal
Enforce darkness restrictions on object manipulation.

---

- [x] 3. Add darkness checks to object actions
  - Prevent take/examine in dark rooms
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 3.1 Add darkness check to TakeAction
  - File: `src/game/actions.ts`
  - Add isRoomLit() check at start of execute()
  - Return "It's too dark to see!" if dark
  - _Requirements: 4.1, 4.2_

- [x] 3.2 Add darkness check to ExamineAction
  - File: `src/game/actions.ts`
  - Add isRoomLit() check at start of execute()
  - Return "It's too dark to see!" if dark
  - _Requirements: 4.3_

- [x] 3.3 Add darkness check to TakeAllAction
  - File: `src/game/actions.ts`
  - Add isRoomLit() check at start of execute()
  - Return "It's too dark to see!" if dark
  - _Requirements: 4.1, 4.2_

- [x] 3.4 Test darkness enforcement
  - Enter dark room (Attic without lamp)
  - Verify "take rope" fails with darkness message
  - Verify "examine rope" fails with darkness message
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 3.5 Commit to Git
  - Commit message: "fix: Enforce darkness restrictions on take/examine"
  - _Requirements: 4.1, 4.2, 4.3_

---

- [x] 4. Show room name in darkness
  - Display room name even when dark
  - _Requirements: 4.4_

- [x] 4.1 Update formatRoomDescription for darkness
  - File: `src/game/actions.ts`
  - Always output room name first
  - Then check darkness for rest of description
  - _Requirements: 4.4_

- [x] 4.2 Update getRoomDescriptionAfterMovement for darkness
  - File: `src/game/actions.ts`
  - Always output room name first
  - Then check darkness for rest of description
  - _Requirements: 4.4_

- [x] 4.3 Test room name in darkness
  - Enter dark room
  - Verify room name appears before darkness message
  - _Requirements: 4.4_

- [x] 4.4 Commit to Git
  - Commit message: "fix: Show room name even in dark rooms"
  - _Requirements: 4.4_

---

## Phase 3: Object Visibility and Display (P1)

### Goal
Fix mailbox visibility and container content display.

---

- [x] 5. Fix mailbox visibility at start
  - Mailbox should appear in West of House description
  - _Requirements: 1.1, 1.2_

- [x] 5.1 Add longDescription to mailbox
  - File: `src/game/data/objects-complete.ts`
  - Add: longDescription: 'There is a small mailbox here.'
  - _Requirements: 1.1_

- [x] 5.2 Verify mailbox appears in room description
  - Start game at West of House
  - Verify "There is a small mailbox here." in output
  - _Requirements: 1.1_

- [x] 5.3 Test leaflet accessibility
  - Open mailbox
  - Verify "take leaflet" works
  - Verify "read leaflet" shows welcome message
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 5.4 Commit to Git
  - Commit message: "fix: Mailbox visible in West of House description"
  - _Requirements: 1.1, 1.2_

---

- [x] 6. Fix container content display
  - Show contents indented under container
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 6.1 Update container display in formatRoomDescription
  - File: `src/game/actions.ts`
  - Change format to "The <container> contains:\n  <item>"
  - Don't show contents as separate room objects
  - _Requirements: 6.1, 6.2_

- [x] 6.2 Fix bottle/water display specifically
  - Verify bottle shows: "The glass bottle contains:\n  A quantity of water"
  - _Requirements: 6.2_

- [x] 6.3 Test container display
  - Look in Kitchen
  - Verify water shown inside bottle, not separately
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 6.4 Commit to Git
  - Commit message: "fix: Container contents displayed indented under container"
  - _Requirements: 6.1, 6.2, 6.3_

---

## Phase 4: Examine and Object Descriptions (P1)

### Goal
Fix examine command and object naming.

---

- [x] 7. Fix examine command output
  - Return proper descriptions, not object names
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7.1 Update ExamineAction to return descriptions
  - File: `src/game/actions.ts`
  - Check for examineText property first
  - Check for container contents
  - Default to "There's nothing special about the <object>."
  - Never return just the object name
  - _Requirements: 7.1, 7.2_

- [x] 7.2 Add examineText to objects that need it
  - File: `src/game/data/objects-complete.ts`
  - Add examineText for lamp: "The lamp is turned off." / "The lamp is on."
  - Add examineText for other objects as needed
  - _Requirements: 7.1_

- [x] 7.3 Test examine command
  - Examine sword: "There's nothing special about the sword."
  - Examine lamp: "The lamp is turned off."
  - Examine mailbox: "The small mailbox is closed."
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7.4 Commit to Git
  - Commit message: "fix: Examine command returns proper descriptions"
  - _Requirements: 7.1, 7.2, 7.3_

---

- [x] 8. Fix object naming consistency
  - Use correct names in inventory and descriptions
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 8.1 Fix sword name in inventory
  - File: `src/game/data/objects-complete.ts`
  - Change name from 'elvish sword' to 'sword'
  - Keep firstDescription with "elvish sword of great antiquity"
  - Add longDescription: "There is a sword here."
  - _Requirements: 8.1_

- [x] 8.2 Fix dropped object descriptions
  - Ensure dropped objects use longDescription
  - Not firstDescription (original placement)
  - _Requirements: 8.2, 8.3_

- [x] 8.3 Test object naming
  - Take sword, check inventory shows "A sword"
  - Drop sword, check room shows "There is a sword here."
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 8.4 Commit to Git
  - Commit message: "fix: Object naming consistency for inventory and dropped items"
  - _Requirements: 8.1, 8.2, 8.3_

---

## Phase 5: Death and Resurrection (P0)

### Goal
Fix death/resurrection to preserve game state properly.

---

- [x] 9. Fix resurrection state handling
  - Player should resurrect in correct location with proper state
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9.1 Review current resurrection implementation
  - File: `src/game/death.ts`
  - Identify state corruption issues
  - _Requirements: 5.1_

- [x] 9.2 Fix resurrectPlayer function
  - Ensure player moves to FOREST-1
  - Handle inventory properly (scatter items)
  - Reset trap door state
  - Clear death flags
  - _Requirements: 5.2, 5.3_

- [x] 9.3 Test death and resurrection
  - Die in dark room (grue)
  - Verify resurrection in FOREST-1
  - Verify game continues playable
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 9.4 Commit to Git
  - Commit message: "fix: Death/resurrection preserves game state"
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

---

## Phase 6: Room Description Fixes (P2)

### Goal
Fix room descriptions to match Z-Machine output.

---

- [x] 10. Fix Clearing room description
  - Match Z-Machine Clearing description
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 10.1 Identify Clearing room discrepancy
  - Compare TypeScript vs Z-Machine Clearing descriptions
  - Determine if multiple Clearing rooms exist
  - _Requirements: 9.1, 9.2_

- [x] 10.2 Update Clearing room data
  - File: `src/game/data/rooms-complete.ts`
  - Fix description to match Z-Machine
  - _Requirements: 9.3_

- [x] 10.3 Test Clearing room
  - Navigate to Clearing
  - Verify description matches Z-Machine
  - _Requirements: 9.1, 9.3_

- [x] 10.4 Commit to Git
  - Commit message: "fix: Clearing room description matches original"
  - _Requirements: 9.1, 9.2, 9.3_

---

- [x] 11. Add atmospheric messages
  - Add song bird messages in forest
  - _Requirements: 10.1, 10.2_

- [x] 11.1 Implement atmospheric message system
  - Add random atmospheric messages to forest rooms
  - "You hear in the distance the chirping of a song bird."
  - _Requirements: 10.1_

- [x] 11.2 Test atmospheric messages
  - Navigate through forest rooms
  - Verify song bird message appears occasionally
  - _Requirements: 10.1, 10.2_

- [x] 11.3 Commit to Git
  - Commit message: "feat: Add atmospheric messages in forest"
  - _Requirements: 10.1, 10.2_

---

## Phase 7: Verification and Testing

### Goal
Verify all fixes achieve target parity.

---

- [x] 12. Run parity comparison tests
  - Verify 95%+ parity on all sequences
  - _Requirements: All_

- [x] 12.1 Run basic-exploration comparison
  - Execute: `npx tsx scripts/record-and-compare.ts --mode both scripts/sequences/basic-exploration.txt`
  - Target: 95%+ parity
  - Document remaining differences
  - _Requirements: All_

- [x] 12.2 Run object-manipulation comparison
  - Execute: `npx tsx scripts/record-and-compare.ts --mode both scripts/sequences/object-manipulation.txt`
  - Target: 95%+ parity
  - Document remaining differences
  - _Requirements: All_

- [x] 12.3 Run puzzle-solutions comparison
  - Execute: `npx tsx scripts/record-and-compare.ts --mode both scripts/sequences/puzzle-solutions.txt`
  - Target: 95%+ parity
  - Document remaining differences
  - _Requirements: All_

- [x] 12.4 Run full batch comparison
  - Execute: `npx tsx scripts/record-and-compare.ts --batch --format text scripts/sequences/`
  - Verify aggregate parity 95%+
  - _Requirements: All_

- [x] 12.5 Document final parity status
  - Update PARITY_DIFFERENCES.md with results
  - List any remaining differences
  - _Requirements: All_

- [x] 12.6 Commit to Git
  - Commit message: "docs: Parity verification complete - 95%+ achieved"
  - _Requirements: All_

---

## Notes

- Tasks are ordered by dependency and priority
- P0 tasks are game-breaking and should be fixed first
- P1 tasks are major functionality issues
- P2 tasks are polish/parity issues
- Run comparison tests after each phase to track progress
- Some differences may be acceptable (status bar, line wrapping)
