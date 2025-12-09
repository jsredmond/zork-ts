# Requirements Document: Achieve 100% Behavioral Parity

## Introduction

This document specifies requirements for achieving **true 100% behavioral parity** between the original Zork I (ZIL) and the TypeScript rewrite. Based on comprehensive assessment of the current state (16.7% transcript pass rate), this spec addresses all identified issues including mislabeled transcripts, missing puzzle tests, RNG-based combat differences, and critical code bugs.

**Current State:**
- Only 7 of 42 transcripts passing (16.7%)
- Multiple transcripts mislabeled (testing wrong content)
- Critical bugs blocking puzzle completion (dam navigation, troll death)
- Combat transcripts RNG-limited (75-93% similarity)

**Goal:** 100% confidence in behavioral parity through accurate transcripts and complete bug fixes.

## Glossary

- **Behavioral Parity**: Identical command sequences produce identical outputs in both games
- **Reference Transcript**: Recorded sequence from **original Zork I** (not TypeScript)
- **Mislabeled Transcript**: Transcript whose label doesn't match actual content
- **RNG-Limited**: Combat transcripts affected by deterministic RNG differences
- **Critical Bug**: Code issue preventing puzzle completion or causing major differences

## Requirements

### Requirement 1: Accurate Transcript Creation

**User Story:** As a developer, I want to create accurate reference transcripts from the original game, so that I verify the correct behavior.

#### Acceptance Criteria

1. WHEN creating transcripts THEN the system SHALL record them from the **original Zork I game** (Frotz interpreter)
2. THE system SHALL verify transcript labels match actual content
3. THE system SHALL create transcripts for every major puzzle (15+ puzzles)
4. THE system SHALL create transcripts for every NPC interaction (4 NPCs)
5. THE system SHALL organize transcripts by actual content tested
6. THE system SHALL achieve minimum 50 accurate transcripts

### Requirement 2: Fix Mislabeled Transcripts

**User Story:** As a developer, I want to identify and fix all mislabeled transcripts, so that tests verify what they claim to verify.

#### Acceptance Criteria

1. WHEN auditing transcripts THEN the system SHALL identify all mislabeled files
2. THE system SHALL relabel transcripts to match actual content
3. THE system SHALL create new transcripts for missing puzzle tests
4. THE system SHALL verify every transcript tests what its label claims
5. THE system SHALL document what each transcript actually tests

### Requirement 3: Fix Critical Code Bugs

**User Story:** As a developer, I want to fix all critical bugs blocking puzzle completion, so that all puzzles can be verified.

#### Acceptance Criteria

1. WHEN fixing dam puzzle THEN the system SHALL enable navigation to dam (SE direction or alternative)
2. WHEN troll dies THEN the system SHALL remove troll body from room
3. WHEN troll dies THEN the system SHALL open all passages
4. THE system SHALL fix cyclops puzzle logic (currently 2.1% similarity)
5. THE system SHALL fix bell/book/candle puzzle logic (currently 6.6% similarity)
6. THE system SHALL fix treasure collection logic (currently 5.1% similarity)

### Requirement 4: Handle Combat RNG Differences

**User Story:** As a developer, I want to handle RNG-based combat differences, so that combat transcripts can achieve 95%+ similarity.

#### Acceptance Criteria

1. WHEN recording combat transcripts THEN the system SHALL use TypeScript game with deterministic RNG
2. THE system SHALL record actual combat sequences produced by seed 12345
3. THE system SHALL replace original random combat transcripts with deterministic versions
4. THE system SHALL achieve 95%+ similarity for all combat transcripts
5. THE system SHALL document RNG seed used for each combat transcript

### Requirement 5: Verify All Puzzles

**User Story:** As a developer, I want to verify all 15+ major puzzles work identically, so that puzzle parity is confirmed.

#### Acceptance Criteria

1. WHEN verifying puzzles THEN the system SHALL test all 15+ major puzzles
2. THE system SHALL verify each puzzle solution step matches original
3. THE system SHALL verify puzzle failure conditions match original
4. THE system SHALL verify puzzle state changes match original
5. THE system SHALL achieve 100% puzzle parity (all puzzles work identically)

### Requirement 6: Verify All NPCs

**User Story:** As a developer, I want to verify all NPC behaviors match exactly, so that NPC parity is confirmed.

#### Acceptance Criteria

1. WHEN verifying NPCs THEN the system SHALL test all 4 major NPCs (thief, troll, cyclops, bat)
2. THE system SHALL verify NPC movement patterns match original
3. THE system SHALL verify NPC combat behavior matches original
4. THE system SHALL verify NPC special actions match original
5. THE system SHALL achieve 100% NPC parity (all NPCs behave identically)

### Requirement 7: Fix All High-Priority Issues

**User Story:** As a developer, I want to fix all high-priority behavioral differences, so that major game features work identically.

#### Acceptance Criteria

1. WHEN fixing high-priority issues THEN the system SHALL achieve 95%+ similarity for all high-priority transcripts
2. THE system SHALL fix mirror room puzzle (currently 88.0%)
3. THE system SHALL fix coffin puzzle (currently 88.0%)
4. THE system SHALL fix egg/nest puzzle (currently 81.3%)
5. THE system SHALL fix cyclops feeding (currently 92.1%)

### Requirement 8: Fix All Medium-Priority Issues

**User Story:** As a developer, I want to fix all medium-priority edge cases, so that error handling and edge cases work identically.

#### Acceptance Criteria

1. WHEN fixing medium-priority issues THEN the system SHALL achieve 90%+ similarity for all medium-priority transcripts
2. THE system SHALL fix error messages (currently 55.6%)
3. THE system SHALL fix inventory limits (currently 17.8%)
4. THE system SHALL fix unusual commands (currently 58.9%)
5. THE system SHALL fix death/resurrection (currently 28.7%)
6. THE system SHALL fix save/restore (currently 59.7%)

### Requirement 9: Fix All Low-Priority Issues

**User Story:** As a developer, I want to fix all low-priority timing and flavor text issues, so that complete parity is achieved.

#### Acceptance Criteria

1. WHEN fixing low-priority issues THEN the system SHALL achieve 85%+ similarity for all low-priority transcripts
2. THE system SHALL fix daemon timing (lamp fuel, candle, NPC movement)
3. THE system SHALL fix flavor text and scenery descriptions
4. THE system SHALL implement missing easter eggs
5. THE system SHALL fix verbose/brief mode handling

### Requirement 10: Achieve 100% Transcript Pass Rate

**User Story:** As a developer, I want to achieve 100% transcript pass rate, so that comprehensive parity is verified.

#### Acceptance Criteria

1. WHEN running all transcripts THEN the system SHALL achieve 100% pass rate for critical transcripts (10/10)
2. THE system SHALL achieve 100% pass rate for high-priority transcripts (10/10)
3. THE system SHALL achieve 100% pass rate for medium-priority transcripts (5/5)
4. THE system SHALL achieve 100% pass rate for low-priority transcripts (17/17)
5. THE system SHALL achieve overall pass rate of 100% (42/42 transcripts)

### Requirement 11: Verify Complete Game Playthrough

**User Story:** As a developer, I want to verify complete game playthrough matches original, so that end-to-end parity is confirmed.

#### Acceptance Criteria

1. WHEN completing game THEN the system SHALL enable collection of all 19 treasures
2. THE system SHALL enable achievement of maximum score (350 points)
3. THE system SHALL verify game completion sequence matches original
4. THE system SHALL verify multiple playthrough paths work identically
5. THE system SHALL achieve 100% playthrough parity

### Requirement 12: Document 100% Confidence

**User Story:** As a developer, I want to document 100% confidence achievement, so that parity is proven and verified.

#### Acceptance Criteria

1. WHEN documenting confidence THEN the system SHALL provide evidence for all claims
2. THE system SHALL document all transcript results (50+ transcripts)
3. THE system SHALL document all puzzle verifications (15+ puzzles)
4. THE system SHALL document all NPC verifications (4 NPCs)
5. THE system SHALL document complete playthrough verification
6. THE system SHALL declare 100% confidence with full evidence

## Success Metrics

### Transcript Pass Rates
- **Critical:** 100% pass (10/10) with 100% similarity
- **High:** 100% pass (10/10) with 95%+ similarity
- **Medium:** 100% pass (5/5) with 90%+ similarity
- **Low:** 100% pass (17/17) with 85%+ similarity
- **Overall:** 100% pass (42/42 transcripts)

### Component Verification
- **Puzzles:** 100% verified (15/15 puzzles)
- **NPCs:** 100% verified (4/4 NPCs)
- **Rooms:** 100% verified (110/110 rooms accessible)
- **Objects:** 95%+ verified (major objects tested)

### Overall Confidence
- **Target:** 100% confidence in behavioral parity
- **Evidence:** 50+ transcripts, 15+ puzzles, 4 NPCs, complete playthrough
- **Gaps:** Zero unexplained behavioral differences

## Out of Scope

The following are explicitly out of scope:
- Performance optimization (speed differences acceptable)
- UI/UX improvements (terminal display differences acceptable)
- Code refactoring (unless required for parity)
- Additional features (only original game features)

## Dependencies

- Original Zork I game file (zork1.z3)
- Frotz interpreter (for playing original game)
- TypeScript game (current implementation)
- Transcript comparison tools (already implemented)
- Deterministic RNG system (already implemented)

## Timeline

- **Phase 1 (Transcripts):** 2 weeks - Create 50+ accurate transcripts
- **Phase 2 (Critical Bugs):** 1 week - Fix dam, troll, critical puzzles
- **Phase 3 (High-Priority):** 1 week - Fix all high-priority issues
- **Phase 4 (Medium-Priority):** 1 week - Fix all medium-priority issues
- **Phase 5 (Low-Priority):** 1 week - Fix all low-priority issues
- **Phase 6 (Verification):** 1 week - Final verification and documentation

**Total:** 7 weeks to 100% parity
