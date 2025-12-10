# Design Document: Complete 100% Behavioral Parity

## Overview

This design outlines the systematic approach to achieve **complete 100% behavioral parity** by fixing all identified issues from the comprehensive verification report. The approach prioritizes fixing root causes first (parser, move counter), then systematically fixing each failing transcript until 100% pass rate is achieved.

**Current State (December 10, 2025):**
- Transcript Pass Rate: 25.9% (14/54)
- Unit Test Pass Rate: 92.6% (813/879)
- 65 failing unit tests
- 40 failing transcripts

**Target State:**
- Transcript Pass Rate: 100% (54/54)
- Unit Test Pass Rate: 100% (879/879)
- Zero failing tests
- Zero failing transcripts

## Architecture

### Fix-First Approach

```
Phase 1: Fix Root Causes (Parser, Move Counter)
    ↓
Phase 2: Fix Unit Test Failures
    ↓
Phase 3: Fix Transcript Failures (by priority)
    ↓
Phase 4: Final Verification (must be 100%)
```

Each phase must achieve its targets before proceeding. The final verification phase cannot be marked complete until 100% is achieved.

## Components and Interfaces

### Verification System

```typescript
interface VerificationResult {
  transcriptsPassed: number;
  transcriptsTotal: number;
  transcriptPassRate: number;
  unitTestsPassed: number;
  unitTestsTotal: number;
  unitTestPassRate: number;
  isComplete: boolean; // true only when both are 100%
}

interface TranscriptResult {
  name: string;
  commandsMatched: number;
  commandsTotal: number;
  similarity: number;
  passed: boolean; // true only when similarity is 100%
}
```

### Fix Tracking

```typescript
interface FixStatus {
  issue: string;
  status: 'not_started' | 'in_progress' | 'fixed' | 'verified';
  affectedTests: string[];
  affectedTranscripts: string[];
  verificationResult?: boolean;
}
```

## Data Models

### Known Issues to Fix

#### Root Cause Issues (Must Fix First)

1. **Parser Token Handling Bug**
   - Error: `tokens.find is not a function`
   - Affected: 11 EdgeCaseTester tests, 7 TestScripts tests
   - Root cause: Parser returning non-array in some cases
   - Fix: Ensure parser always returns array

2. **Move Counter Not Incrementing**
   - Error: `expected +0 to be 1`
   - Affected: Movement tests, Wait tests, Score display
   - Root cause: Move increment logic not being called
   - Fix: Add move increment to movement and wait actions

#### Unit Test Failures (65 total)

| Category | Count | Root Cause |
|----------|-------|------------|
| Token handling | 18 | Parser returns non-array |
| Move counter | 4 | Increment not called |
| Inventory display | 3 | Case sensitivity |
| Ambiguity detection | 4 | Wrong error type returned |
| Magic word puzzle | 3 | CYCLOPS_FLAG not set |
| Script runner | 7 | Empty command results |
| Other | 26 | Various |

#### Transcript Failures (40 total)

| Priority | Count | Key Issues |
|----------|-------|------------|
| Critical | 5 | Navigation, combat, puzzles |
| High | 22 | NPC, combat, puzzles |
| Medium | 5 | Error messages, edge cases |
| Low | 8 | Timing, flavor text |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Parser Token Array Validity
*For any* input string, the parser SHALL return a valid array that supports array methods (find, filter, map)
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Move Counter Increment on Movement
*For any* valid movement command that succeeds, the moves counter SHALL increment by exactly 1
**Validates: Requirements 2.1, 2.5**

### Property 3: Score Display Accuracy
*For any* game state, the displayed move count SHALL equal the actual moves counter value
**Validates: Requirements 2.3**

### Property 4: Inventory Display Consistency
*For any* inventory display, item names SHALL match the original game's capitalization and formatting exactly
**Validates: Requirements 3.1, 3.2**

### Property 5: Ambiguity Detection Correctness
*For any* command where multiple objects match the noun, the parser SHALL return AMBIGUOUS type with candidate list
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Transcript Processing Robustness
*For any* transcript file in the transcripts directory, the verification system SHALL process it without errors
**Validates: Requirements 6.1, 6.3**

### Property 7: Command Output Parity
*For any* command in a transcript, the TypeScript output SHALL exactly match the original game output
**Validates: Requirements 12.2**

## Error Handling

### Fix Verification
- After each fix, run affected tests immediately
- If tests still fail, investigate further before proceeding
- Do not mark a fix as complete until all affected tests pass

### Transcript Verification
- A transcript only passes if ALL commands match (100% similarity)
- Partial matches (e.g., 99%) are still failures
- Each failing command must be investigated and fixed

### Regression Prevention
- Run full test suite after each major fix
- If new failures appear, fix them before proceeding
- Maintain a "no new failures" policy

## Testing Strategy

### Dual Testing Approach

**Unit Tests:**
- Fix all 65 failing unit tests
- Verify each fix with targeted test runs
- Run full suite to check for regressions

**Property-Based Tests:**
- Use fast-check library (already configured)
- Each property test runs minimum 100 iterations
- Tag each test with: `**Feature: complete-parity, Property {number}: {property_text}**`

### Verification Commands

```bash
# Run all unit tests
npm test

# Run transcript verification
npx tsx scripts/verify-all-transcripts.ts

# Run specific test file
npx vitest --run src/path/to/test.ts

# Run with verbose output
npx vitest --run --reporter=verbose
```

### Success Criteria

**Unit Tests:**
- 879/879 tests passing (100%)
- Zero failures
- Zero errors

**Transcripts:**
- 54/54 transcripts passing (100%)
- 909/909 commands matching (100%)
- Zero failures

## Implementation Phases

### Phase 1: Fix Root Causes

**Goal:** Fix parser token handling and move counter issues

**Tasks:**
1. Fix parser to always return valid array
2. Fix move counter increment logic
3. Verify all affected tests pass

**Success Criteria:**
- All token-related tests pass
- All move counter tests pass
- No new failures introduced

### Phase 2: Fix Remaining Unit Test Failures

**Goal:** Achieve 100% unit test pass rate

**Tasks:**
1. Fix inventory display format
2. Fix ambiguity detection
3. Fix magic word puzzle
4. Fix script runner issues
5. Fix remaining failures

**Success Criteria:**
- 879/879 unit tests passing
- Zero failures

### Phase 3: Fix Transcript Failures

**Goal:** Achieve 100% transcript pass rate

**Tasks:**
1. Fix critical transcripts (5)
2. Fix high-priority transcripts (22)
3. Fix medium-priority transcripts (5)
4. Fix low-priority transcripts (8)

**Success Criteria:**
- 54/54 transcripts passing
- 100% command match on each transcript

### Phase 4: Final Verification

**Goal:** Confirm 100% parity achieved

**Tasks:**
1. Run full test suite
2. Run full transcript verification
3. Document results
4. Confirm 100% achieved

**Success Criteria:**
- Unit tests: 100% (879/879)
- Transcripts: 100% (54/54)
- Commands: 100% (909/909)

**CRITICAL:** This phase cannot be marked complete until 100% is achieved on ALL metrics.

## Timeline Estimate

- **Phase 1:** 1-2 days (root causes)
- **Phase 2:** 2-3 days (unit tests)
- **Phase 3:** 5-7 days (transcripts)
- **Phase 4:** 1 day (verification)

**Total:** 9-13 days

## Conclusion

This design provides a systematic approach to achieving 100% behavioral parity. By fixing root causes first, then systematically addressing each failure, we will achieve complete parity. The key constraint is that **no phase is complete until its success criteria are met**, and the **final verification cannot be marked complete until 100% is achieved on all metrics**.

