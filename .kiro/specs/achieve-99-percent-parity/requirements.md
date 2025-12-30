# Requirements Document

## Introduction

This specification defines the requirements for achieving 99% behavioral parity between the TypeScript Zork I implementation and the original Z-Machine implementation. The current parity ranges from 66-76% across different test seeds, with approximately 48-67 differences per 200 commands. The goal is to reduce this to ≤2 differences (99% parity) consistently across all test seeds.

## Glossary

- **TypeScript_Implementation**: The modern TypeScript rewrite of Zork I located in `src/`
- **Z_Machine**: The original Infocom Z-Machine interpreter running the compiled `COMPILED/zork1.z3` game file via dfrotz
- **Parity_Score**: Percentage of commands that produce identical output between TypeScript and Z-Machine implementations
- **Status_Bar_Contamination**: When status bar content (Score/Moves) leaks into game output text
- **Daemon**: Background processes that run periodically (lamp timer, thief movement, atmospheric messages)
- **Atmospheric_Message**: Random ambient messages that add flavor (bird singing, wind blowing)
- **Parser**: The natural language processing system that interprets player commands
- **Vocabulary**: The set of words recognized by the parser
- **Root_Cause_Category**: Classification of difference types (11 categories defined in RootCauseAnalysisSystem)
- **Spot_Test**: Random command sequence testing for parity validation
- **dfrotz**: The Z-Machine interpreter used for reference testing at `/opt/homebrew/bin/dfrotz`

## Requirements

### Requirement 1: Parser Error Message Alignment

**User Story:** As a player, I want error messages to match the original Z-Machine exactly, so that the game feels authentic.

#### Acceptance Criteria

1. WHEN a player enters an unknown word, THE Parser SHALL respond with "I don't know the word 'X'." exactly matching Z-Machine format
2. WHEN a player references an object not present, THE Parser SHALL respond with "You can't see any X here!" for known vocabulary words
3. WHEN a player enters a verb without required object, THE Parser SHALL respond with "What do you want to [verb]?" matching Z-Machine phrasing
4. WHEN a player enters an incomplete PUT/PLACE command, THE Parser SHALL respond with "Where do you want to put it?" or equivalent Z-Machine message
5. WHEN a player enters an empty or whitespace-only command, THE Parser SHALL respond with "I beg your pardon?"
6. WHEN a player enters a command with excessive repetition or special characters, THE Parser SHALL respond with "I don't understand that sentence."

### Requirement 2: Object Interaction Error Harmonization

**User Story:** As a player, I want object interaction errors to match the original game, so that puzzle feedback is consistent.

#### Acceptance Criteria

1. WHEN a player tries to TAKE scenery objects (forest, house), THE TypeScript_Implementation SHALL respond with Z-Machine messages like "What a concept!" or "An interesting idea..."
2. WHEN a player tries to TURN objects without tools, THE TypeScript_Implementation SHALL respond with "Your bare hands don't appear to be enough." instead of "This has no effect."
3. WHEN a player tries to PUSH immovable objects, THE TypeScript_Implementation SHALL respond with "Pushing the X isn't notably helpful." matching Z-Machine format
4. WHEN a player tries to PULL the board, THE TypeScript_Implementation SHALL respond with "You can't move the board." instead of "Pulling the board isn't notably helpful."
5. WHEN a player tries to OPEN the white house, THE TypeScript_Implementation SHALL respond with "I can't see how to get in from here." instead of "You can't open the white house."
6. WHEN a player tries to PUT an object they don't possess, THE TypeScript_Implementation SHALL respond with "You don't have that!" instead of "You can't see any X here!"

### Requirement 3: Vocabulary Alignment

**User Story:** As a player, I want the game to recognize the same words as the original, so that my commands work consistently.

#### Acceptance Criteria

1. THE Parser SHALL NOT recognize "room", "area", "place", "location", "spot", "zone", "region" as valid vocabulary words
2. THE Parser SHALL recognize all object names, verbs, and directions from the original Z-Machine vocabulary
3. WHEN a player uses a word not in Z-Machine vocabulary, THE Parser SHALL respond with "I don't know the word 'X'." before checking object visibility
4. THE Parser SHALL handle word synonyms identically to Z-Machine (e.g., "get" = "take", "examine" = "look at")

### Requirement 4: Status Bar Contamination Prevention

**User Story:** As a tester, I want game output to be free of status bar content, so that parity comparisons are accurate.

#### Acceptance Criteria

1. THE StatusBarNormalizer SHALL remove all status bar lines matching pattern "Room Name    Score: X    Moves: Y" from output
2. THE StatusBarNormalizer SHALL preserve all non-status-bar content exactly
3. WHEN comparing outputs, THE Parity_Test_System SHALL normalize both TypeScript and Z-Machine outputs before comparison
4. THE StatusBarNormalizer SHALL handle edge cases like negative scores and long room names

### Requirement 5: Daemon Timing Synchronization

**User Story:** As a player, I want timed events to occur at the same intervals as the original game, so that gameplay timing is authentic.

#### Acceptance Criteria

1. THE Daemon_System SHALL trigger lamp dimming messages at the same move counts as Z-Machine
2. THE Daemon_System SHALL trigger candle flickering messages at the same move counts as Z-Machine
3. THE Daemon_System SHALL trigger thief appearance at intervals matching Z-Machine probability distribution
4. THE Daemon_System SHALL trigger troll recovery at the same intervals as Z-Machine
5. WHEN using a fixed random seed, THE Daemon_System SHALL produce deterministic timing matching Z-Machine

### Requirement 6: Atmospheric Message Alignment

**User Story:** As a player, I want ambient messages to appear at the same times as the original game, so that the atmosphere is authentic.

#### Acceptance Criteria

1. THE Atmospheric_Message_System SHALL generate messages at the same probability as Z-Machine
2. THE Atmospheric_Message_System SHALL use identical message text to Z-Machine
3. WHEN using a fixed random seed, THE Atmospheric_Message_System SHALL produce deterministic messages matching Z-Machine
4. THE Atmospheric_Message_System SHALL respect location-specific message rules (forest sounds only in forest, etc.)

### Requirement 7: Container and Inventory Behavior

**User Story:** As a player, I want container and inventory operations to work exactly like the original, so that puzzles behave correctly.

#### Acceptance Criteria

1. WHEN a player tries to PUT an object in a closed container, THE TypeScript_Implementation SHALL respond with "The X is closed."
2. WHEN a player tries to TAKE FROM a closed container, THE TypeScript_Implementation SHALL respond with "The X is closed."
3. WHEN a player's inventory is full, THE TypeScript_Implementation SHALL respond with the same message as Z-Machine
4. THE TypeScript_Implementation SHALL track inventory state identically to Z-Machine (same capacity limits, same object locations)

### Requirement 8: Ambiguity Resolution

**User Story:** As a player, I want disambiguation prompts to match the original game, so that I know how to clarify my commands.

#### Acceptance Criteria

1. WHEN a command is ambiguous between two objects, THE Parser SHALL respond with "Which X do you mean, the Y or the Z?"
2. WHEN a command is ambiguous between more than two objects, THE Parser SHALL respond with "Which X do you mean?"
3. THE Parser SHALL resolve ambiguity using the same priority rules as Z-Machine

### Requirement 9: Parity Validation and Regression Prevention

**User Story:** As a developer, I want automated validation of parity improvements, so that I can verify fixes don't cause regressions.

#### Acceptance Criteria

1. THE Parity_Test_System SHALL validate parity across multiple random seeds (12345, 67890, 54321, 99999, 11111)
2. THE Parity_Test_System SHALL report parity percentage and difference count for each seed
3. THE Parity_Test_System SHALL categorize differences by root cause (11 categories)
4. THE Parity_Test_System SHALL detect regressions when parity decreases after changes
5. THE Parity_Test_System SHALL achieve ≥99% parity (≤2 differences per 200 commands) on all test seeds

### Requirement 10: Specific Message Corrections

**User Story:** As a player, I want specific game messages to match the original exactly, so that the experience is authentic.

#### Acceptance Criteria

1. WHEN examining the white house, THE TypeScript_Implementation SHALL use Z-Machine's exact description
2. WHEN trying invalid actions on scenery, THE TypeScript_Implementation SHALL use Z-Machine's specific rejection messages
3. THE TypeScript_Implementation SHALL use "What a concept!" for taking abstract/large objects (matching Z-Machine)
4. THE TypeScript_Implementation SHALL use "An interesting idea..." for taking impossible objects (matching Z-Machine)
5. THE TypeScript_Implementation SHALL use exact Z-Machine messages for all common error conditions
