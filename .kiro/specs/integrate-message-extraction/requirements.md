# Requirements Document

## Introduction

The parity validation pipeline has a critical integration gap. The `ExhaustiveParityValidator` class was designed to validate behavioral parity between the TypeScript Zork I implementation and the original Z-Machine, but it fails to use the message extraction and classification components that were built specifically for this purpose.

The `TranscriptComparator.compareAndClassify()` method properly extracts action responses using `MessageExtractor` and classifies differences using `classifyExtracted()`, but the `ExhaustiveParityValidator.compareAndClassify()` method bypasses this entirely, comparing raw outputs directly. This results in 12,996+ differences being incorrectly classified as `LOGIC_DIFFERENCE` when most are actually structural differences (status bar formatting, headers, whitespace).

## Glossary

- **ExhaustiveParityValidator**: The main validation class that runs parity tests across multiple seeds and command sequences
- **TranscriptComparator**: A component that compares transcripts and classifies differences using message extraction
- **MessageExtractor**: A component that extracts action responses from raw game output, stripping status bars, headers, and formatting
- **DifferenceClassifier**: A component that classifies differences as RNG_DIFFERENCE, STATE_DIVERGENCE, or LOGIC_DIFFERENCE
- **classifyExtracted**: A method on DifferenceClassifier that classifies differences using pre-extracted messages
- **ExtractedMessage**: The result of message extraction containing the isolated action response
- **Raw_Output**: The complete game output including status bars, headers, and formatting
- **Action_Response**: The actual game response to a command, extracted from raw output

## Requirements

### Requirement 1: Use Message Extraction in ExhaustiveParityValidator

**User Story:** As a developer, I want the ExhaustiveParityValidator to use message extraction before comparing outputs, so that structural differences (status bars, headers) don't pollute the parity results.

#### Acceptance Criteria

1. WHEN the ExhaustiveParityValidator compares two transcript entries, THE ExhaustiveParityValidator SHALL extract action responses using MessageExtractor before comparison
2. WHEN classifying differences, THE ExhaustiveParityValidator SHALL call classifyExtracted() with ExtractedMessage objects instead of raw output strings
3. WHEN the ExhaustiveParityValidator processes a transcript, THE ExhaustiveParityValidator SHALL strip status bars, game headers, and loading messages from outputs before extraction

### Requirement 2: Delegate to TranscriptComparator

**User Story:** As a developer, I want the ExhaustiveParityValidator to delegate comparison logic to TranscriptComparator, so that we have a single source of truth for comparison behavior.

#### Acceptance Criteria

1. WHEN the ExhaustiveParityValidator needs to compare transcripts, THE ExhaustiveParityValidator SHALL use TranscriptComparator.compareAndClassify() method
2. WHEN TranscriptComparator.compareAndClassify() returns results, THE ExhaustiveParityValidator SHALL map the ExtendedDiffReport to its internal ClassifiedDifference format
3. THE ExhaustiveParityValidator SHALL configure TranscriptComparator with useMessageExtraction: true and trackDifferenceTypes: true

### Requirement 3: Preserve Existing API

**User Story:** As a developer, I want the ExhaustiveParityValidator API to remain unchanged, so that existing tests and scripts continue to work.

#### Acceptance Criteria

1. THE ExhaustiveParityValidator SHALL continue to return SeedResult objects with the same structure
2. THE ExhaustiveParityValidator SHALL continue to return ParityResults objects with the same structure
3. WHEN external code calls runWithSeeds() or runWithSeed(), THE ExhaustiveParityValidator SHALL return results in the expected format

### Requirement 4: Isolate Status Bar from Logic Comparison

**User Story:** As a developer, I want status bar differences to be completely isolated from logic comparison, so that status bar formatting issues never affect the parity percentage.

#### Acceptance Criteria

1. WHEN extracting action responses, THE MessageExtractor SHALL completely remove status bar content before any comparison occurs
2. WHEN two outputs differ only in status bar content, THE ExhaustiveParityValidator SHALL count this as a matching response (100% parity)
3. THE ExhaustiveParityValidator SHALL track status bar differences separately from logic differences
4. WHEN reporting parity results, THE ExhaustiveParityValidator SHALL report status bar differences as informational only, not as failures

### Requirement 5: Accurate Logic Difference Classification

**User Story:** As a developer, I want differences to be accurately classified, so that I can distinguish between acceptable RNG differences and actual logic bugs.

#### Acceptance Criteria

1. WHEN two outputs have identical extracted action responses (after status bar removal), THE ExhaustiveParityValidator SHALL count this as a matching response
2. WHEN two outputs differ only in game header content, THE DifferenceClassifier SHALL NOT classify this as LOGIC_DIFFERENCE
3. WHEN two outputs have different extracted action responses due to RNG, THE DifferenceClassifier SHALL classify this as RNG_DIFFERENCE
4. WHEN two outputs have different extracted action responses NOT due to RNG, THE DifferenceClassifier SHALL classify this as LOGIC_DIFFERENCE

### Requirement 6: Improved Parity Percentage Calculation

**User Story:** As a developer, I want the parity percentage to reflect actual behavioral parity, so that I can track progress toward 100% parity.

#### Acceptance Criteria

1. WHEN calculating parity percentage, THE ExhaustiveParityValidator SHALL count responses as matching if their extracted action responses (after status bar removal) are identical
2. WHEN calculating parity percentage, THE ExhaustiveParityValidator SHALL count responses as matching if their differences are classified as RNG_DIFFERENCE or STATE_DIVERGENCE
3. WHEN calculating parity percentage, THE ExhaustiveParityValidator SHALL only count LOGIC_DIFFERENCE as non-matching responses
4. THE ExhaustiveParityValidator SHALL report a separate "status bar parity" metric that tracks status bar formatting differences independently
