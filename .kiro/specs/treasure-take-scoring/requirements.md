# Requirements Document

## Introduction

Fix the scoring system to match the original Zork I ZIL implementation. The original game awards points in two stages for treasures: VALUE points when first taking a treasure, and TVALUE points when placing it in the trophy case. The current TypeScript implementation only awards points when placing treasures in the trophy case, missing the VALUE component entirely.

## Glossary

- **VALUE**: Points awarded when first taking (TAKE) a treasure object (one-time only)
- **TVALUE**: Points awarded when placing a treasure in the trophy case
- **SCORE-OBJ**: ZIL routine that awards VALUE points and sets VALUE to 0 to prevent double-scoring
- **Treasure**: An object with both VALUE and TVALUE properties that contributes to the player's score
- **Trophy_Case**: The container in the living room where treasures are deposited for TVALUE points

## Requirements

### Requirement 1: Award VALUE Points on First Take

**User Story:** As a player, I want to receive VALUE points when I first take a treasure, so that my score matches the original Zork I behavior.

#### Acceptance Criteria

1. WHEN a player takes a treasure for the first time, THE Scoring_System SHALL award the treasure's VALUE points to the player's score
2. WHEN a player takes a treasure that has already been taken before, THE Scoring_System SHALL NOT award any VALUE points
3. WHEN a player takes a non-treasure object, THE Scoring_System SHALL NOT award any points
4. THE Scoring_System SHALL track which treasures have had their VALUE points awarded to prevent double-scoring

### Requirement 2: Maintain TVALUE Points on Trophy Case Deposit

**User Story:** As a player, I want to receive TVALUE points when I place treasures in the trophy case, so that the existing scoring behavior is preserved.

#### Acceptance Criteria

1. WHEN a player places a treasure in the trophy case, THE Scoring_System SHALL award the treasure's TVALUE points
2. WHEN a player removes and re-deposits a treasure in the trophy case, THE Scoring_System SHALL NOT award duplicate TVALUE points
3. THE Scoring_System SHALL calculate total score as BASE_SCORE plus sum of TVALUE for treasures currently in trophy case

### Requirement 3: Correct Treasure VALUE Definitions

**User Story:** As a developer, I want accurate VALUE definitions for all treasures, so that the scoring matches the original ZIL source.

#### Acceptance Criteria

1. THE Scoring_System SHALL define VALUE points for each treasure matching 1dungeon.zil:
   - SKULL: VALUE 10, TVALUE 10
   - SCEPTRE: VALUE 4, TVALUE 6
   - COFFIN: VALUE 10, TVALUE 5
   - TRIDENT: VALUE 4, TVALUE 11
   - CHALICE: VALUE 10, TVALUE 15
   - DIAMOND: VALUE 10, TVALUE 10
   - JADE: VALUE 5, TVALUE 5
   - BAG-OF-COINS: VALUE 10, TVALUE 5
   - EMERALD: VALUE 5, TVALUE 10
   - PAINTING: VALUE 4, TVALUE 6
   - BAR: VALUE 10, TVALUE 5
   - POT-OF-GOLD: VALUE 10, TVALUE 10
   - BRACELET: VALUE 5, TVALUE 5
   - SCARAB: VALUE 5, TVALUE 5
   - TORCH: VALUE 14, TVALUE 6
   - TRUNK: VALUE 15, TVALUE 5
   - EGG: VALUE 5, TVALUE 5
   - BAUBLE: VALUE 1, TVALUE 1
   - CANARY: VALUE 6, TVALUE 4
   - BROKEN-EGG: VALUE 0, TVALUE 2
   - BROKEN-CANARY: VALUE 0, TVALUE 1

### Requirement 4: Remove Invalid Action Points

**User Story:** As a developer, I want to remove incorrect action point definitions, so that the scoring system is accurate.

#### Acceptance Criteria

1. THE Scoring_System SHALL NOT award points for 'OPEN_EGG' action (player cannot open the egg)
2. THE Scoring_System SHALL preserve valid action points for room entry, combat, and puzzle completion

### Requirement 5: Score Display Accuracy

**User Story:** As a player, I want the SCORE command to display my accurate total score, so that I can track my progress correctly.

#### Acceptance Criteria

1. WHEN a player types SCORE, THE System SHALL display the sum of BASE_SCORE and TVALUE points for treasures in trophy case
2. THE System SHALL display the correct rank based on total score
3. THE System SHALL display the maximum possible score as 350 points
