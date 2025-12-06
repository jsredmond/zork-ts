# Implementation Plan: Complete Text Accuracy

- [x] 1. Enhance message extraction infrastructure
  - [x] 1.1 Enhance ZIL message extractor to capture full context
    - Modify scripts/extract-zil-messages.ts to extract object associations
    - Extract verb associations from routine names
    - Capture conditional logic (COND, EQUAL?, FSET? statements)
    - Parse multi-line TELL statements correctly
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 1.2 Write property test for message extraction
    - **Property 6.1: TELL statement parsing completeness**
    - **Validates: Requirements 6.1**
  
  - [x] 1.3 Write property test for context association
    - **Property 6.2: Message context identification**
    - **Validates: Requirements 6.2, 6.3**
  
  - [x] 1.4 Create message categorization system
    - Implement scripts/categorize-messages.ts
    - Define MessageCategory enum (scenery, special, conditional, generic, error, puzzle)
    - Define Priority enum (critical, high, medium, low)
    - Implement categorization logic based on object type and context
    - _Requirements: 5.3_
  
  - [x] 1.5 Write property test for message categorization
    - **Property 5.3: Message categorization correctness**
    - **Validates: Requirements 5.3**
  
  - [x] 1.6 Generate categorized message database
    - Run enhanced extractor on 1actions.zil and gverbs.zil
    - Apply categorization to all extracted messages
    - Save to .kiro/testing/categorized-messages.json
    - Generate statistics by category and priority
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. Implement critical and high-priority messages
  - [x] 2.1 Identify critical missing messages
    - Parse categorized-messages.json for priority=critical
    - Focus on puzzle-related messages
    - Identify NPC dialogue gaps
    - List critical error messages
    - _Requirements: 7.4_
  
  - [x] 2.2 Implement critical puzzle messages
    - Add missing dam puzzle messages
    - Add missing mirror puzzle messages
    - Add missing cyclops puzzle messages
    - Add missing thief encounter messages
    - Add missing troll encounter messages
    - _Requirements: 2.1, 2.2, 7.4_
  
  - [x] 2.3 Implement critical NPC dialogue
    - Add missing cyclops dialogue variations
    - Add missing thief dialogue variations
    - Add missing troll dialogue variations
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.4 Implement critical error messages
    - Add missing "impossible action" messages
    - Add missing puzzle failure messages
    - Add missing object misuse messages
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 2.5 Write property test for error message consistency
    - **Property 6: Error message consistency**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
  
  - [x] 2.6 Run validation and verify critical coverage
    - Run scripts/validate-messages.ts
    - Verify 100% of critical messages implemented
    - Fix any mismatches found
    - _Requirements: 5.4, 5.5_

- [x] 3. Implement scenery object handlers
  - [x] 3.1 Create scenery action handler framework
    - Create src/game/sceneryActions.ts
    - Define SceneryHandler interface
    - Implement handleSceneryAction function
    - Integrate with main action executor
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 3.2 Implement BOARD scenery handler
    - Add handler for TAKE, EXAMINE, REMOVE verbs
    - Message: "The boards are securely fastened."
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.3 Implement GRANITE-WALL scenery handler
    - Add conditional handler based on current room
    - NORTH-TEMPLE: "The west wall is solid granite here."
    - TREASURE-ROOM: "The east wall is solid granite here."
    - SLIDE-ROOM: "It only SAYS \"Granite Wall\"." or "The wall isn't granite."
    - Default: "There is no granite wall here."
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2_
  
  - [x] 3.4 Implement WHITE-HOUSE scenery handler
    - Add conditional handler based on current room
    - Inside house: "Why not find your brains?"
    - Outside house: appropriate directional messages
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.5 Implement FOREST scenery handler
    - Add handler for various forest interactions
    - Include messages for TAKE, EXAMINE, CLIMB, etc.
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.6 Implement SONGBIRD scenery handler
    - FIND/TAKE: "The songbird is not here but is probably nearby."
    - LISTEN: "You can't hear the songbird now."
    - FOLLOW: "It can't be followed."
    - Default: "You can't see any songbird here."
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.7 Implement TEETH scenery handler
    - BRUSH with PUTTY: death message (JIGS-UP)
    - BRUSH without object: "Dental hygiene is highly recommended..."
    - BRUSH with other: "A nice idea, but with a [object]?"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1_
  
  - [x] 3.8 Implement remaining scenery handlers
    - Review categorized-messages.json for category=scenery
    - Implement handlers for all remaining scenery objects
    - Include walls, trees, mountains, rivers, etc.
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.9 Write property test for scenery action coverage
    - **Property 2: Scenery action coverage**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  
  - [x] 3.10 Write property test for scenery message exactness
    - **Property 1: Message text exactness (scenery subset)**
    - **Validates: Requirements 1.5**
  
  - [x] 3.11 Validate scenery message coverage
    - Run validation for category=scenery
    - Verify 90%+ scenery messages implemented
    - Fix any mismatches
    - _Requirements: 5.1, 5.4_

- [-] 4. Implement special object behaviors
  - [x] 4.1 Create special behavior framework
    - Create src/game/specialBehaviors.ts
    - Define SpecialBehavior interface
    - Implement applySpecialBehavior function
    - Integrate with action executor
    - _Requirements: 2.1, 2.2_
  
  - [x] 4.2 Implement WATER special behaviors
    - DRINK: "The water is cool and refreshing."
    - TAKE without container: "You have nothing to carry it in."
    - TAKE with bottle: fill bottle logic
    - Location-dependent availability
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 4.3 Implement GHOSTS special behaviors
    - EXORCISE: special exorcism logic
    - ATTACK: "The ghosts do not seem to fear you."
    - Other interactions: ghostly responses
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 4.4 Implement BASKET special behaviors
    - RAISE/LOWER: rope and basket mechanics
    - State-dependent messages
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [x] 4.5 Implement BOAT special behaviors
    - INFLATE/DEFLATE: state changes
    - BOARD: enter boat logic
    - State-dependent descriptions
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [x] 4.6 Implement LAMP special behaviors
    - Dimming messages over time
    - "Your lamp is getting dim" warnings
    - "Your lamp has gone out" message
    - _Requirements: 2.1, 2.2, 3.1, 3.4_
  
  - [x] 4.7 Implement CANDLES special behaviors
    - Burning messages over time
    - Melting warnings
    - State-dependent availability
    - _Requirements: 2.1, 2.2, 3.1, 3.4_
  
  - [x] 4.8 Implement remaining special behaviors
    - Review categorized-messages.json for category=special
    - Implement all remaining special object behaviors
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 4.9 Write property test for special behavior completeness
    - **Property 4: Special behavior completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  
  - [ ] 4.10 Write property test for special behavior message exactness
    - **Property 1: Message text exactness (special subset)**
    - **Validates: Requirements 2.5**
  
  - [x] 4.11 Validate special behavior coverage
    - Run validation for category=special
    - Verify 95%+ special behaviors implemented
    - Fix any mismatches
    - _Requirements: 5.1, 5.4_

- [-] 5. Implement conditional message system
  - [x] 5.1 Create conditional message framework
    - Create src/game/conditionalMessages.ts
    - Define ConditionalMessage interface
    - Implement getConditionalMessage function
    - Integrate with room and object descriptions
    - _Requirements: 3.1, 3.2_
  
  - [x] 5.2 Implement WEST-OF-HOUSE conditional description
    - Default: standard description
    - With WON_FLAG: add "A secret path leads southwest into the forest."
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 5.3 Implement EAST-OF-HOUSE conditional description
    - Window state: "open" vs "slightly ajar"
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 5.4 Implement flag-dependent message variations
    - Review categorized-messages.json for category=conditional
    - Identify all flag checks (FSET?, FCLEAR?, etc.)
    - Implement conditional logic for each
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 5.5 Implement time-dependent message variations
    - Lamp dimming stages
    - Candle burning stages
    - Troll/thief appearance timing
    - _Requirements: 3.1, 3.4_
  
  - [x] 5.6 Write property test for conditional message correctness
    - **Property 3: Conditional message correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [x] 5.7 Write property test for conditional message exactness
    - **Property 1: Message text exactness (conditional subset)**
    - **Validates: Requirements 3.5**
  
  - [x] 5.8 Validate conditional message coverage
    - Run validation for category=conditional
    - Verify 90%+ conditional messages implemented
    - Fix any mismatches
    - _Requirements: 5.1, 5.4_

- [-] 6. Implement generic message variations
  - [x] 6.1 Implement generic refusal messages
    - "You can't do that."
    - "That doesn't make sense."
    - "I don't understand that."
    - All variations from gverbs.zil
    - _Requirements: 4.2_
  
  - [x] 6.2 Implement humorous response variations
    - Silly command responses
    - Easter egg messages
    - Personality-driven responses
    - _Requirements: 4.3_
  
  - [x] 6.3 Implement parser feedback variations
    - Ambiguity messages
    - "I don't see that here" variations
    - "You don't have that" variations
    - _Requirements: 4.4_
  
  - [x] 6.4 Implement repeated action variations
    - PICK-ONE style message rotation
    - Context-appropriate variations
    - _Requirements: 4.1_
  
  - [x] 6.5 Write property test for generic message exactness
    - **Property 1: Message text exactness (generic subset)**
    - **Validates: Requirements 4.5**
  
  - [x] 6.6 Validate generic message coverage
    - Run validation for category=generic
    - Verify 90%+ generic messages implemented
    - Fix any mismatches
    - _Requirements: 5.1, 5.4_

- [-] 7. Comprehensive validation and testing
  - [x] 7.1 Run complete message validation
    - Execute scripts/validate-messages.ts
    - Generate full validation report
    - Identify any remaining gaps
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [x] 7.2 Verify 95% coverage threshold
    - Check total coverage percentage
    - Verify coverage by category
    - Verify coverage by priority
    - _Requirements: 5.5_
  
  - [x] 7.3 Write property test for message coverage threshold
    - **Property 5: Message coverage threshold**
    - **Validates: Requirements 5.5**
  
  - [x] 7.4 Write property test for overall message exactness
    - **Property 1: Message text exactness (all messages)**
    - **Validates: Requirements 1.5, 2.5, 3.5, 4.5, 7.5**
  
  - [x] 7.5 Run integration tests with message validation
    - Execute major game scenarios
    - Compare outputs with original game
    - Validate puzzle sequences
    - Validate NPC interactions
    - _Requirements: 2.1, 2.2, 7.1, 7.2_
  
  - [x] 7.6 Fix any remaining message mismatches
    - Address validation failures
    - Correct text differences
    - Handle edge cases
    - _Requirements: 5.4_
  
  - [x] 7.7 Run full test suite
    - Execute npm test
    - Verify all existing tests pass
    - Verify all new property tests pass
    - Ensure zero regressions
    - _Requirements: All_

- [x] 8. Final validation and documentation
  - [x] 8.1 Generate final accuracy report
    - Total messages: 921
    - Implemented messages: X (target ≥ 875)
    - Coverage percentage: X% (target ≥ 95%)
    - Coverage by category
    - Coverage by priority
    - _Requirements: 5.1, 5.5_
  
  - [x] 8.2 Document implementation approach
    - Update .kiro/testing/text-validation-status.md
    - Document scenery handler patterns
    - Document special behavior patterns
    - Document conditional message patterns
    - _Requirements: All_
  
  - [x] 8.3 Create message accuracy summary
    - What was implemented
    - What remains (if < 100%)
    - Rationale for any omissions
    - Impact assessment
    - _Requirements: 5.1, 5.2_
  
  - [x] 8.4 Update project documentation
    - Update README with text accuracy status
    - Note achievement of 95%+ accuracy
    - Document any known limitations
    - _Requirements: All_
  
  - [x] 8.5 Final verification
    - Run validation three times
    - Verify consistent 95%+ coverage
    - Verify zero test failures
    - Verify zero regressions
    - _Requirements: 5.5_
