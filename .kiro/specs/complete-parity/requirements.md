# Requirements Document: Complete 100% Behavioral Parity

## Introduction

This document specifies requirements for achieving **complete 100% behavioral parity** between the original Zork I (ZIL) and the TypeScript rewrite. Based on comprehensive verification (December 10, 2025), the current state shows:

- **Transcript Pass Rate:** 25.9% (14/54 passing)
- **Unit Test Pass Rate:** 92.6% (813/879 passing)
- **Puzzle Verification:** 100% (17/17 passing)
- **NPC Verification:** 100% (38/38 passing)

**Goal:** Achieve 100% pass rate on ALL transcripts with 100% command matching, and 100% unit test pass rate.

## Glossary

- **Behavioral Parity**: Identical command sequences produce identical outputs in both games
- **Transcript**: JSON file containing command/response pairs from the original game
- **Command Match**: A command produces output identical to the original game
- **Pass Rate**: Percentage of transcripts where ALL commands match (100% similarity)
- **Unit Test**: Automated test verifying specific functionality

## Requirements

### Requirement 1: Fix Parser Token Handling

**User Story:** As a developer, I want the parser to handle tokens correctly, so that all command parsing works without errors.

#### Acceptance Criteria

1. WHEN the parser receives input THEN the system SHALL return a valid token array
2. WHEN tokens.find() is called THEN the system SHALL operate on a valid array without errors
3. WHEN parsing any valid command THEN the system SHALL not throw "tokens.find is not a function" error
4. THE system SHALL pass all EdgeCaseTester tests without token errors
5. THE system SHALL pass all TestScripts tests without token errors

### Requirement 2: Fix Move Counter Tracking

**User Story:** As a developer, I want the move counter to increment correctly, so that game progression is tracked accurately.

#### Acceptance Criteria

1. WHEN a player moves to a new room THEN the system SHALL increment the moves counter by 1
2. WHEN a player executes a WAIT command THEN the system SHALL increment the moves counter by 1
3. WHEN displaying score THEN the system SHALL show the correct move count
4. THE system SHALL pass all movement-related unit tests
5. THE system SHALL match original game move counting behavior

### Requirement 3: Fix Inventory Display Format

**User Story:** As a developer, I want inventory display to match the original game exactly, so that transcript verification passes.

#### Acceptance Criteria

1. WHEN displaying inventory THEN the system SHALL use proper capitalization matching original game
2. WHEN listing items THEN the system SHALL format item names identically to original
3. THE system SHALL pass inventory-related unit tests with exact string matching
4. THE system SHALL achieve 100% similarity on inventory-related transcript commands

### Requirement 4: Fix Ambiguity Detection

**User Story:** As a developer, I want the parser to detect ambiguous object references, so that disambiguation works correctly.

#### Acceptance Criteria

1. WHEN multiple objects match a noun THEN the system SHALL return AMBIGUOUS type (not UNKNOWN_WORD)
2. WHEN ambiguity is detected THEN the system SHALL list candidate objects
3. WHEN using synonyms that match multiple objects THEN the system SHALL detect ambiguity
4. THE system SHALL pass all ambiguity detection unit tests
5. THE system SHALL pass all ambiguity detection property tests

### Requirement 5: Fix Magic Word Puzzle

**User Story:** As a developer, I want the magic word puzzle to work correctly, so that cyclops behavior matches original.

#### Acceptance Criteria

1. WHEN saying "ODYSSEUS" or "ULYSSES" to cyclops THEN the system SHALL set CYCLOPS_FLAG to true
2. WHEN cyclops is scared THEN the system SHALL update cyclops state correctly
3. THE system SHALL pass magic word puzzle unit tests
4. THE system SHALL achieve 100% similarity on cyclops-related transcript commands

### Requirement 6: Fix Transcript Format Consistency

**User Story:** As a developer, I want all transcripts to use consistent format, so that verification works correctly.

#### Acceptance Criteria

1. WHEN reading transcripts THEN the system SHALL handle 'entries' format correctly
2. THE system SHALL convert any 'commands' format transcripts to 'entries' format
3. THE system SHALL not crash when processing any transcript file
4. THE system SHALL successfully verify all 54 transcript files

### Requirement 7: Fix Critical Transcript Failures

**User Story:** As a developer, I want all critical transcripts to pass, so that core game functionality is verified.

#### Acceptance Criteria

1. THE system SHALL achieve 100% command match on Trap Door Entry transcript
2. THE system SHALL achieve 100% command match on Lamp and Darkness Navigation transcript
3. THE system SHALL achieve 100% command match on Troll Encounter and Defeat transcript
4. THE system SHALL achieve 100% command match on Dam and Bolt Puzzle transcript
5. THE system SHALL achieve 100% command match on Bell, Book, and Candle Puzzle transcript

### Requirement 8: Fix High-Priority Transcript Failures

**User Story:** As a developer, I want all high-priority transcripts to pass, so that major game features are verified.

#### Acceptance Criteria

1. THE system SHALL achieve 100% command match on all NPC transcripts (thief, troll, cyclops)
2. THE system SHALL achieve 100% command match on all combat transcripts
3. THE system SHALL achieve 100% command match on all puzzle transcripts
4. THE system SHALL achieve 100% command match on maze navigation transcript
5. THE system SHALL achieve 100% command match on mirror room transcript

### Requirement 9: Fix Medium-Priority Transcript Failures

**User Story:** As a developer, I want all medium-priority transcripts to pass, so that edge cases are verified.

#### Acceptance Criteria

1. THE system SHALL achieve 100% command match on Error Messages transcript
2. THE system SHALL achieve 100% command match on Inventory Limits transcript
3. THE system SHALL achieve 100% command match on Unusual Commands transcript
4. THE system SHALL achieve 100% command match on Death and Resurrection transcript
5. THE system SHALL achieve 100% command match on Save and Restore transcript

### Requirement 10: Fix Low-Priority Transcript Failures

**User Story:** As a developer, I want all low-priority transcripts to pass, so that timing and edge cases are verified.

#### Acceptance Criteria

1. THE system SHALL achieve 100% command match on Lamp Fuel transcripts
2. THE system SHALL achieve 100% command match on Troll Daemon Timing transcript
3. THE system SHALL achieve 100% command match on Flood Control Dam Timing transcript
4. THE system SHALL achieve 100% command match on Resurrection Timing transcript
5. THE system SHALL achieve 100% command match on all remaining timing transcripts

### Requirement 11: Achieve 100% Unit Test Pass Rate

**User Story:** As a developer, I want all unit tests to pass, so that code quality is verified.

#### Acceptance Criteria

1. THE system SHALL pass all 879 unit tests (currently 813 passing)
2. THE system SHALL pass all property-based tests
3. THE system SHALL have zero test failures
4. THE system SHALL have zero test errors

### Requirement 12: Achieve 100% Transcript Pass Rate

**User Story:** As a developer, I want all transcripts to pass with 100% command matching, so that complete behavioral parity is achieved.

#### Acceptance Criteria

1. THE system SHALL achieve 100% pass rate (54/54 transcripts)
2. THE system SHALL achieve 100% command match on every transcript
3. THE system SHALL have zero transcript failures
4. THE system SHALL document 100% behavioral parity achievement

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Transcript Pass Rate | 25.9% (14/54) | 100% (54/54) |
| Unit Test Pass Rate | 92.6% (813/879) | 100% (879/879) |
| Average Transcript Similarity | 47.9% | 100% |
| Command Match Rate | 32.0% (291/909) | 100% (909/909) |

## Completion Criteria

**This spec is NOT complete until:**
1. ALL 54 transcripts pass with 100% command matching
2. ALL 879 unit tests pass
3. Verification script shows 100% pass rate
4. No transcript has any failing commands

