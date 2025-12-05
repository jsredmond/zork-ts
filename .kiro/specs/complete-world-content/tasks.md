# Implementation Plan: Complete World Content

- [x] 1. Extract and add remaining rooms from ZIL source
  - [x] 1.1 Extract Reservoir area rooms (5 rooms)
    - Add RESERVOIR-SOUTH, STREAM-VIEW, IN-STREAM
    - Configure exits and water-related flags
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.2 Extract Mirror room area (9 rooms)
    - Added MIRROR-ROOM-1, MIRROR-ROOM-2, SMALL-CAVE, TINY-CAVE
    - Added COLD-PASSAGE, NARROW-PASSAGE, WINDING-PASSAGE, TWISTING-PASSAGE
    - Added ATLANTIS-ROOM
    - Configured mirror puzzle connections
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.3 Extract Round Room area (5 rooms)
    - Added DEEP-CANYON, DAMP-CAVE, LOUD-ROOM, NS-PASSAGE, CHASM-ROOM
    - Configured vertical connections and chasms
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.4 Extract Hades area (2 rooms)
    - Added ENTRANCE-TO-HADES, LAND-OF-LIVING-DEAD
    - Configured special Hades mechanics
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.5 Extract Temple/Egypt area (6 rooms)
    - Added ENGRAVINGS-CAVE, EGYPT-ROOM, DOME-ROOM
    - Added TORCH-ROOM, NORTH-TEMPLE, SOUTH-TEMPLE
    - Configured temple connections
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.6 Extract Dam area (3 rooms)
    - Added DAM-ROOM, DAM-LOBBY, MAINTENANCE-ROOM
    - Configured dam control connections
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.7 Extract River area (16 rooms)
    - Added DAM-BASE, RIVER-1, RIVER-2, RIVER-3, RIVER-4, RIVER-5
    - Added WHITE-CLIFFS-NORTH, WHITE-CLIFFS-SOUTH, SHORE, SANDY-BEACH
    - Added SANDY-CAVE, ARAGAIN-FALLS, ON-RAINBOW, END-OF-RAINBOW
    - Added CANYON-BOTTOM, CLIFF-MIDDLE, CANYON-VIEW
    - Configured river navigation
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.8 Extract Coal Mine area (17 rooms)
    - Added MINE-ENTRANCE, SQUEEKY-ROOM, BAT-ROOM, SHAFT-ROOM
    - Added SMELLY-ROOM, GAS-ROOM, LADDER-TOP, LADDER-BOTTOM
    - Added DEAD-END-5, TIMBER-ROOM, LOWER-SHAFT, MACHINE-ROOM
    - Added MINE-1, MINE-2, MINE-3, MINE-4, SLIDE-ROOM
    - Configured mine connections and gas room mechanics
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.9 Extract Cyclops area (3 rooms)
    - Added CYCLOPS-ROOM, STRANGE-PASSAGE, TREASURE-ROOM
    - Configured all connections
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.10 Extract any remaining miscellaneous rooms
    - Reviewed 1dungeon.zil for all rooms
    - Added all 111 rooms (110 from ZIL + 1 duplicate)
    - _Requirements: 1.1, 1.5_

- [x] 2. Extract and add remaining objects from ZIL source
  - [x] 2.1 Extract remaining tools and equipment
    - Add RUSTY-KNIFE, STILETTO, TOOL-CHEST
    - Add TUBE (toothpaste), CANDLES
    - Configure tool properties and flags
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.2 Extract remaining containers
    - Add RAISED-BASKET, MACHINE (as container)
    - Add INFLATED-BOAT, additional containers
    - Configure capacity and containment flags
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.3 Extract remaining readable items
    - Add OWNERS-MANUAL, BOAT-LABEL, BOOK (black book)
    - Add any other readable items
    - Include text content for each
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.4 Extract remaining consumables
    - Add any missing food/drink items
    - Configure consumption flags
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.5 Extract remaining scenery objects
    - Add RIVER, CRACK, PEDESTAL, ALTAR
    - Add various doors, windows, and room-specific scenery
    - Configure as non-takeable scenery
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.6 Extract remaining NPCs
    - Add GHOSTS, BAT if not already present
    - Configure NPC behaviors
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.7 Extract puzzle-specific objects
    - Add objects needed for dam puzzle
    - Add objects needed for mirror puzzle
    - Add objects needed for rainbow puzzle
    - Add objects needed for rope/basket puzzle
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 2.8 Review and add any remaining objects
    - Review 1dungeon.zil for any objects not yet added
    - Add to reach 100+ total objects
    - _Requirements: 2.1, 2.5_

- [x] 3. Verify content completeness
  - [x] 3.1 Run content verification script
    - Execute src/game/factories/verifyContent.ts
    - Check room count >= 110
    - Check object count >= 100
    - _Requirements: 3.1, 3.2_
  
  - [x] 3.2 Validate all room connections
    - Verify no broken exit references
    - Verify all conditional exits have valid conditions
    - Check bidirectional connections where appropriate
    - _Requirements: 3.2, 1.2_
  
  - [x] 3.3 Validate all object locations
    - Verify all initial locations are valid rooms or containers
    - Check no objects reference non-existent locations
    - _Requirements: 3.3, 2.2_
  
  - [x] 3.4 Verify all treasures present and accessible
    - Confirm all 19 treasures exist
    - Verify each treasure location is reachable
    - Check treasure values sum to 350 points
    - _Requirements: 3.4, 3.5, 4.1, 4.2_
  
  - [x] 3.5 Generate completeness report
    - Document room count by area
    - Document object count by category
    - List any warnings or issues found
    - _Requirements: 3.1, 3.4_

- [x] 4. Test game completability
  - [x] 4.1 Run full test suite
    - Execute npm test
    - Verify all 678+ tests still pass
    - Fix any broken tests due to new content
    - _Requirements: 4.3_
  
  - [x] 4.2 Test navigation to all areas
    - Verify player can reach all major areas
    - Test conditional exits work correctly
    - Verify no unreachable rooms
    - _Requirements: 1.5, 4.4_
  
  - [x] 4.3 Test treasure collection
    - Verify all 19 treasures can be found
    - Test taking each treasure
    - Verify scoring works for all treasures
    - _Requirements: 4.1, 4.2_
  
  - [x] 4.4 Test puzzle solutions
    - Verify all puzzles are solvable
    - Test puzzle-specific objects work correctly
    - Verify puzzle completion unlocks appropriate areas
    - _Requirements: 4.3_
  
  - [x] 4.5 Perform complete playthrough
    - Play from start to finish
    - Collect all treasures
    - Achieve 350 points
    - Verify winning message appears
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Final verification and documentation
  - [x] 5.1 Update content extraction documentation
    - Update docs/CONTENT_EXTRACTION.md with final counts
    - Document any deviations from original
    - Note any content that couldn't be extracted
    - _Requirements: 3.1_
  
  - [x] 5.2 Run exhaustive test suite three times
    - Execute npm test three times
    - Verify consistent results
    - Document any flaky tests
    - _Requirements: 4.3_
  
  - [x] 5.3 Generate final content report
    - Total rooms: X/110+
    - Total objects: X/100+
    - All treasures: 19/19
    - Game completable: Yes/No
    - _Requirements: 3.1, 3.4, 4.5_
  
  - [x] 5.4 Update README with completion status
    - Document that world content is complete
    - Update feature list
    - Note any known limitations
    - _Requirements: All_

- [-] 6. UI/UX Improvements
  - [ ] 6.1 Add status bar display
    - Display score in top right corner
    - Display move count in top right corner
    - Update status bar after each command
    - Format: "Score: X    Moves: Y"
    - _Requirements: 4.1, 4.2_
  
  - [ ] 6.2 Fix inventory item indentation
    - Review current inventory display formatting
    - Ensure consistent indentation for all items
    - Fix any alignment issues with nested items (items in containers)
    - Test with various inventory configurations
    - _Requirements: 2.2, 2.3_
  
  - [ ] 6.3 Add blinking cursor for input prompt
    - Implement blinking cursor animation at command prompt
    - Use terminal escape sequences for cursor effect
    - Ensure cursor blinks at appropriate rate (500ms interval)
    - Cursor should appear after ">" prompt
    - Stop blinking when user starts typing
    - _Requirements: 4.4_
