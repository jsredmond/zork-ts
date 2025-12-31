# Requirements Document

## Introduction

This specification defines the requirements for fixing the parity validation system to accurately measure and achieve behavioral parity between the TypeScript Zork I implementation and the original Z-Machine. The current system reports ~2.57% parity due to output format comparison issues, not actual behavioral differences. This spec addresses the root causes and establishes accurate parity measurement.

## Glossary

- **Action_Response**: The game's direct response to a player command, excluding room descriptions, prompts, and headers
- **Output_Block**: The complete text output from a command, including room descriptions, status bars, and prompts
- **Message_Extraction**: The process of isolating the Action_Response from a full Output_Block
- **RNG_Pool**: A set of equivalent messages randomly selected by the game (YUKS, HO-HUM, HELLOS, etc.)
- **Structural_Difference**: A difference in output format/structure rather than game behavior
- **Behavioral_Difference**: A difference in actual game logic or response content

## Requirements

### Requirement 1: Message Extraction from Output Blocks

**User Story:** As a developer, I want to extract action responses from full game output, so that I can compare actual game behavior rather than output formatting.

#### Acceptance Criteria

1. WHEN comparing outputs, THE Comparator SHALL extract the Action_Response from each Output_Block before comparison
2. THE Message_Extractor SHALL remove room descriptions that appear at the start of output
3. THE Message_Extractor SHALL remove command prompts (">") from output
4. THE Message_Extractor SHALL remove status bar lines from output
5. THE Message_Extractor SHALL preserve the core action response message
6. WHEN the output contains only a room description (e.g., after movement), THE Message_Extractor SHALL return the room name and description as the Action_Response

### Requirement 2: Improved RNG Pool Detection

**User Story:** As a developer, I want the difference classifier to detect RNG pool messages in extracted responses, so that RNG differences are correctly classified.

#### Acceptance Criteria

1. WHEN an extracted Action_Response matches a YUKS pool message, THE Classifier SHALL classify it as RNG_DIFFERENCE
2. WHEN an extracted Action_Response matches a HO-HUM pool message, THE Classifier SHALL classify it as RNG_DIFFERENCE
3. WHEN an extracted Action_Response matches a HELLOS pool message, THE Classifier SHALL classify it as RNG_DIFFERENCE
4. THE Classifier SHALL handle messages with leading/trailing whitespace
5. THE Classifier SHALL handle messages that are part of multi-line responses

### Requirement 3: Structural Difference Filtering

**User Story:** As a developer, I want to filter out structural differences, so that parity measurement reflects actual behavioral differences.

#### Acceptance Criteria

1. THE Comparator SHALL ignore differences in game header/intro text between implementations
2. THE Comparator SHALL ignore differences in whitespace and line wrapping
3. THE Comparator SHALL ignore differences in prompt formatting
4. WHEN both outputs convey the same semantic meaning, THE Comparator SHALL consider them matching
5. THE Comparator SHALL provide an option to report structural differences separately from behavioral differences

### Requirement 4: Accurate Parity Measurement

**User Story:** As a developer, I want accurate parity metrics, so that I can trust the reported parity percentage.

#### Acceptance Criteria

1. THE Validator SHALL report separate metrics for structural parity and behavioral parity
2. THE Validator SHALL correctly identify RNG differences vs logic differences
3. WHEN running validation, THE Validator SHALL use real Z-Machine output, not mock data
4. THE Validator SHALL generate a baseline only from actual validation results
5. THE Validator SHALL report the count of each difference type (RNG, structural, behavioral)

### Requirement 5: Real Validation Execution

**User Story:** As a developer, I want the certification to be based on real validation, so that parity claims are accurate.

#### Acceptance Criteria

1. THE Certification_Generator SHALL run actual parity validation before generating certification
2. THE Certification_Generator SHALL NOT use hardcoded or mock test results
3. WHEN Z-Machine is unavailable, THE Certification_Generator SHALL report that certification cannot be generated
4. THE Certification_Generator SHALL include actual command outputs in sample differences
5. THE Certification_Generator SHALL accurately report the parity percentage achieved

### Requirement 6: Regression Prevention with Accurate Baseline

**User Story:** As a developer, I want the baseline to reflect actual parity state, so that regression detection is meaningful.

#### Acceptance Criteria

1. THE Baseline SHALL be generated from actual validation results with proper classification
2. THE Baseline SHALL distinguish between RNG differences and logic differences
3. WHEN a new logic difference is detected, THE Regression_Detector SHALL fail the validation
4. THE Regression_Detector SHALL allow RNG differences to vary without failing
5. THE Baseline SHALL be regenerated after fixing the validation system
