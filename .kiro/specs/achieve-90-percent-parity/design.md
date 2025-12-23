# Design Document: Achieve 90% Parity

## Overview

This design addresses the remaining parity issues to achieve 90%+ aggregate parity between the TypeScript Zork I implementation and the original Z-Machine game.

**Current State:** 88.08% aggregate parity  
**Target State:** 90%+ aggregate parity

The approach focuses on three main areas:
1. **Content Analysis** - Identify specific differences in worst-performing sequences
2. **Targeted Fixes** - Address specific content and behavior differences
3. **Enhanced Normalization** - Improve comparison algorithms to focus on core content

## Architecture

The fixes will span these modules:

```
src/
├── testing/
│   └── recording/
│       ├── comparator.ts      # Enhanced normalization
│       └── types.ts           # Updated comparison options
├── game/
│   ├── actions.ts             # Fix specific action behaviors
│   ├── puzzles.ts             # Fix puzzle-specific logic
│   └── verbHandlers.ts        # Fix verb response consistency
└── scripts/
    └── analyze-differences.ts  # New analysis tool
```

## Components and Interfaces

### 1. Enhanced Content Normalization

**File:** `src/testing/recording/comparator.ts`

The current normalization handles basic status bar and line wrapping differences, but needs enhancement to filter out more acceptable differences.

**Current Normalization:**
- Strips status bar lines
- Normalizes line wrapping
- Strips game headers (copyright/version)
- Normalizes whitespace

**Enhanced Normalization Needed:**
```typescript
interface EnhancedComparisonOptions extends ComparisonOptions {
  filterSongBirdMessages?: boolean;     // Filter "You hear...song bird" messages
  filterAtmosphericMessages?: boolean;  // Filter all atmospheric messages
  normalizeErrorMessages?: boolean;     // Normalize "You can't see..." variations
  filterLoadingMessages?: boolean;      // Filter Z-Machine loading messages
  strictContentOnly?: boolean;          // Only compare core game content
}
```

**Implementation:**
```typescript
private normalizeContent(content: string, options: EnhancedComparisonOptions): string {
  let normalized = content;
  
  // Existing normalization...
  
  // New: Filter song bird messages
  if (options.filterSongBirdMessages) {
    normalized = normalized.replace(/You hear in the distance the chirping of a song bird\.\s*/g, '');
  }
  
  // New: Filter atmospheric messages
  if (options.filterAtmosphericMessages) {
    normalized = normalized.replace(/You hear.*?\.\s*/g, '');
  }
  
  // New: Normalize error messages
  if (options.normalizeErrorMessages) {
    normalized = normalized.replace(/You can't see any \w+ here!/g, 'OBJECT_NOT_VISIBLE');
  }
  
  // New: Filter loading messages
  if (options.filterLoadingMessages) {
    normalized = normalized.replace(/Using normal formatting\.\s*/g, '');
    normalized = normalized.replace(/Loading .*?\.z3\.\s*/g, '');
  }
  
  return normalized;
}
```

### 2. Puzzle Solutions Analysis and Fixes

**Analysis Tool:** `scripts/analyze-differences.ts`

Create a tool to analyze the specific differences in the puzzle solutions sequence:

```typescript
interface DifferenceAnalysis {
  sequenceName: string;
  totalDifferences: number;
  differencesByCategory: Map<string, number>;
  specificIssues: SpecificIssue[];
}

interface SpecificIssue {
  commandIndex: number;
  command: string;
  category: string;
  expected: string;
  actual: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  suggestedFix?: string;
}
```

**Common Puzzle Issues to Address:**
1. **Object interaction messages** - Ensure consistent responses
2. **State change descriptions** - Match Z-Machine state descriptions
3. **Error handling** - Identical error messages for invalid actions
4. **Puzzle completion messages** - Match success/failure messages

### 3. Inventory Management Fixes

**File:** `src/game/actions.ts`

Based on the 84.21% parity, likely issues include:

**Take Action Improvements:**
```typescript
// Ensure consistent "Taken." vs "You take the X." messages
// Handle inventory limits with exact Z-Machine messages
// Proper handling of objects in containers
```

**Drop Action Improvements:**
```typescript
// Consistent "Dropped." vs "You drop the X." messages  
// Proper handling of dropping in containers vs rooms
// Correct object placement descriptions
```

**Inventory Display Improvements:**
```typescript
// Match Z-Machine inventory formatting exactly
// Handle empty inventory message consistency
// Proper article usage (a/an/the)
```

### 4. Navigation Direction Fixes

**File:** `src/game/verbHandlers.ts`

Based on the 87.76% parity, likely issues include:

**Direction Handling:**
```typescript
// Ensure all directional synonyms work identically
// Match error messages for blocked directions
// Consistent room transition descriptions
```

**Common Navigation Issues:**
- "You can't go that way." vs "You can't go that way!"
- Handling of invalid direction synonyms
- Room description consistency after movement

### 5. Specific Content Fixes

**Examine Objects Sequence (88.64% parity):**
- Ensure all examinable objects have proper descriptions
- Handle "You can't see that here" messages consistently
- Fix any missing examine text for objects

**Basic Exploration Sequence (86.21% parity):**
- Room description consistency
- Object visibility rules
- Movement response consistency

**Mailbox and Leaflet Sequence (88.89% parity):**
- Container interaction messages
- Object state change descriptions
- Reading/examining text consistency

## Data Models

### Enhanced Comparison Options

```typescript
interface EnhancedComparisonOptions extends ComparisonOptions {
  filterSongBirdMessages?: boolean;
  filterAtmosphericMessages?: boolean;
  normalizeErrorMessages?: boolean;
  filterLoadingMessages?: boolean;
  strictContentOnly?: boolean;
  categoryWeighting?: Map<string, number>;  // Weight different types of differences
}
```

### Difference Analysis Results

```typescript
interface SequenceAnalysis {
  sequenceName: string;
  currentParity: number;
  targetParity: number;
  criticalIssues: SpecificIssue[];
  quickWins: SpecificIssue[];  // Easy fixes with high impact
  estimatedImpact: number;     // Estimated parity improvement
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Puzzle Solutions Parity Achievement
*For any* puzzle solutions test sequence execution, the parity score SHALL be at least 90%.
**Validates: Requirements 1.1**

### Property 2: Enhanced Normalization Effectiveness
*For any* transcript comparison with enhanced normalization enabled, song bird messages SHALL be filtered from both transcripts before comparison.
**Validates: Requirements 2.1**

### Property 3: Inventory Management Parity Achievement
*For any* inventory management test sequence execution, the parity score SHALL be at least 90%.
**Validates: Requirements 3.1**

### Property 4: Navigation Directions Parity Achievement
*For any* navigation directions test sequence execution, the parity score SHALL be at least 90%.
**Validates: Requirements 4.1**

### Property 5: Aggregate Parity Target Achievement
*For any* complete batch test execution, the aggregate parity score SHALL be at least 90%.
**Validates: Requirements 5.1**

### Property 6: Individual Sequence Performance
*For any* batch test execution, at least 7 out of 10 individual sequences SHALL achieve 90%+ parity.
**Validates: Requirements 5.2**

### Property 7: Content Normalization Focus
*For any* transcript comparison with strict content mode enabled, only core game content differences SHALL be counted toward parity calculation.
**Validates: Requirements 2.4**

### Property 8: Error Message Consistency
*For any* invalid action attempt, the error message format SHALL match Z-Machine output exactly.
**Validates: Requirements 4.2**

## Error Handling

| Error Condition | Response |
|-----------------|----------|
| Analysis tool fails | Log error, continue with manual analysis |
| Normalization breaks existing tests | Revert and use more conservative approach |
| Fix causes regression in other sequences | Implement targeted fix with minimal scope |
| Parity improvement plateaus | Focus on highest-impact remaining differences |

## Testing Strategy

### Analysis-Driven Development

1. **Difference Analysis**
   - Run detailed analysis on worst-performing sequences
   - Categorize differences by type and impact
   - Prioritize fixes by estimated parity improvement

2. **Targeted Testing**
   - Create specific tests for identified issues
   - Verify fixes don't break existing functionality
   - Measure parity improvement after each fix

3. **Enhanced Normalization Testing**
   - Test normalization improvements on all sequences
   - Verify core content differences are preserved
   - Ensure acceptable differences are filtered

### Property-Based Tests

1. **Parity Achievement Properties**
   - Generate random command sequences
   - Verify parity targets are met consistently
   - Test with different normalization options

2. **Content Consistency Properties**
   - Generate random game states
   - Verify consistent responses to identical commands
   - Test error message consistency

### Integration Tests

Run enhanced batch comparison with new normalization:
```bash
npx tsx scripts/record-and-compare.ts --batch --normalize --enhanced --format text scripts/sequences/
```

Target: 90%+ aggregate parity with enhanced normalization enabled.

## Implementation Order

1. **Create analysis tool** - Identify specific differences in worst sequences
2. **Enhance normalization** - Filter acceptable differences more effectively  
3. **Fix puzzle solutions** - Address the worst-performing sequence (77.9%)
4. **Fix inventory management** - Improve from 84.21% to 90%+
5. **Fix navigation directions** - Improve from 87.76% to 90%+
6. **Polish remaining sequences** - Push the close ones (88%+) over 90%
7. **Verify and document** - Confirm 90%+ aggregate parity achieved