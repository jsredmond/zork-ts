# Requirements Document: Complete Text Accuracy

## Introduction

This document specifies the requirements for achieving 100% text message accuracy in the Zork I TypeScript rewrite by adding all remaining TELL messages from the original ZIL source. The game is functionally complete with 100% test accuracy and 68.4% message coverage (630/921 messages). This spec focuses on adding the remaining 291 messages to reach 95%+ text accuracy, covering scenery interactions, special object behaviors, conditional messages, and generic variations.

## Glossary

- **TELL Message**: A text response displayed to the player in the original ZIL code using the TELL function
- **Scenery Object**: Non-takeable environmental objects that provide flavor text when examined or interacted with
- **Message Coverage**: The percentage of original TELL messages that have been implemented in the TypeScript version
- **ZIL Source**: The original 1dungeon.zil and 1actions.zil files containing all message text
- **Action Handler**: Code that responds to player commands with appropriate text messages
- **Conditional Message**: Text that varies based on game state, flags, or conditions

## Requirements

### Requirement 1

**User Story:** As a player, I want scenery objects to respond with appropriate messages, so that the world feels alive and interactive.

#### Acceptance Criteria

1. WHEN a player examines a scenery object THEN the system SHALL display the appropriate description message from the original game
2. WHEN a player attempts to take a scenery object THEN the system SHALL display the appropriate refusal message
3. WHEN a player attempts to interact with a scenery object THEN the system SHALL display contextually appropriate messages
4. THE system SHALL include messages for all boards, walls, trees, and other environmental scenery
5. THE system SHALL ensure scenery messages match the original ZIL text exactly

### Requirement 2

**User Story:** As a player, I want special object behaviors to produce correct messages, so that unusual interactions work as expected.

#### Acceptance Criteria

1. WHEN a player performs an unusual action on an object THEN the system SHALL display the appropriate special behavior message
2. WHEN game state affects object behavior THEN the system SHALL display conditional messages based on that state
3. THE system SHALL include all edge case messages for object interactions
4. THE system SHALL handle multi-state objects with appropriate messages for each state
5. THE system SHALL ensure special behavior messages match the original ZIL text exactly

### Requirement 3

**User Story:** As a player, I want conditional and state-dependent messages to appear correctly, so that the game responds appropriately to different situations.

#### Acceptance Criteria

1. WHEN game conditions change THEN the system SHALL display messages that reflect the current state
2. WHEN a player revisits a location after changing game state THEN the system SHALL display updated messages
3. THE system SHALL include all flag-dependent message variations
4. THE system SHALL include all time-dependent message variations
5. THE system SHALL ensure conditional messages match the original ZIL text exactly

### Requirement 4

**User Story:** As a player, I want generic action variations to provide variety, so that repeated actions don't feel monotonous.

#### Acceptance Criteria

1. WHEN a player performs the same action multiple times THEN the system SHALL vary response messages appropriately
2. THE system SHALL include all generic refusal messages for invalid actions
3. THE system SHALL include all humorous responses to silly commands
4. THE system SHALL include all parser feedback variations
5. THE system SHALL ensure generic messages match the original ZIL text exactly

### Requirement 5

**User Story:** As a developer, I want to validate message completeness, so that I can verify all original messages are implemented.

#### Acceptance Criteria

1. WHEN message validation runs THEN the system SHALL report the percentage of messages implemented
2. THE system SHALL identify which specific messages are missing by ZIL line reference
3. THE system SHALL categorize missing messages by type (scenery, special, conditional, generic)
4. THE system SHALL validate that implemented messages match original text exactly
5. THE system SHALL achieve at least 95% message coverage

### Requirement 6

**User Story:** As a developer, I want to extract messages systematically from ZIL source, so that no messages are overlooked.

#### Acceptance Criteria

1. WHEN extracting messages THEN the system SHALL parse all TELL statements from ZIL files
2. THE system SHALL associate each message with its triggering action or condition
3. THE system SHALL identify the object or room associated with each message
4. THE system SHALL preserve message formatting including line breaks and punctuation
5. THE system SHALL handle multi-line TELL statements correctly

### Requirement 7

**User Story:** As a player, I want error messages and edge cases to match the original, so that the game feels authentic.

#### Acceptance Criteria

1. WHEN a player attempts an impossible action THEN the system SHALL display the original error message
2. WHEN a player uses an object incorrectly THEN the system SHALL display the appropriate failure message
3. THE system SHALL include all "you can't do that" variations from the original
4. THE system SHALL include all puzzle-specific failure messages
5. THE system SHALL ensure error messages match the original ZIL text exactly
