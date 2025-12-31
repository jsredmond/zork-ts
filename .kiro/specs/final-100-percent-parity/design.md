# Design Document: Final 100% Parity Achievement

## Overview

This design addresses the final steps to achieve 100% logic parity between the TypeScript Zork I implementation and the original Z-Machine, along with exhaustive testing to verify and certify this achievement. The implementation focuses on fixing the remaining LOOK output formatting issue and establishing comprehensive validation infrastructure.

## Architecture

The solution consists of three main components:

1. **LOOK Output Formatter** - Updates to match Z-Machine room name prefix formatting
2. **Exhaustive Parity Validator** - Extended testing infrastructure with multi-seed support
3. **Parity Certification Generator** - Automated documentation of parity achievement

```
┌─────────────────────────────────────────────────────────────────┐
│                    Parity Validation System                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  LOOK Formatter │  │ Exhaustive      │  │ Certification   │ │
│  │  (display.ts)   │  │ Validator       │  │ Generator       │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│           ▼                    ▼                    ▼           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Difference Classifier                          ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   ││
│  │  │ RNG Pool │  │ State    │  │ Logic    │  │ Report   │   ││
│  │  │ Detector │  │ Diverge  │  │ Diff     │  │ Generator│   ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. LOOK Output Formatter

**Location**: `src/io/display.ts`

**Interface**:
```typescript
interface LookOutputFormatter {
  formatRoomName(room: Room, isFirstVisit: boolean): string;
  formatLookOutput(room: Room, state: GameState): string;
}
```

**Behavior**:
- Formats room name with proper prefix to match Z-Machine output
- Preserves all existing LOOK functionality
- Handles both first visit and revisit scenarios

### 2. Exhaustive Parity Validator

**Location**: `src/testing/exhaustiveParityValidator.ts`

**Interface**:
```typescript
interface ExhaustiveParityValidator {
  runWithSeeds(seeds: number[]): Promise<ParityResults>;
  runExtendedSequence(seed: number, commandCount: number): Promise<SequenceResult>;
  classifyDifference(diff: Difference): DifferenceType;
}

interface ParityResults {
  totalTests: number;
  totalDifferences: number;
  rngDifferences: number;
  stateDivergences: number;
  logicDifferences: number;
  seedResults: Map<number, SeedResult>;
}

type DifferenceType = 'RNG_DIFFERENCE' | 'STATE_DIVERGENCE' | 'LOGIC_DIFFERENCE';
```

**Behavior**:
- Executes parity tests across 10+ seeds
- Runs 250+ commands per seed
- Classifies all differences into RNG, State Divergence, or Logic categories
- Fails if any Logic differences are detected

### 3. Difference Classifier

**Location**: `src/testing/differenceClassifier.ts`

**Interface**:
```typescript
interface DifferenceClassifier {
  classify(tsDiff: string, zmDiff: string, context: CommandContext): DifferenceType;
  isYuksPoolMessage(message: string): boolean;
  isHoHumPoolMessage(message: string): boolean;
  isHellosPoolMessage(message: string): boolean;
  isStateDivergence(context: CommandContext): boolean;
}
```

**RNG Pool Detection**:
```typescript
const YUKS_POOL = [
  "A valiant attempt.",
  "You can't be serious.",
  "An interesting idea...",
  "What a concept!"
];

const HO_HUM_POOL = [
  " doesn't seem to work.",
  " isn't notably helpful.",
  " has no effect."
];

const HELLOS_POOL = [
  "Hello.",
  "Good day.",
  "Nice weather we've been having lately."
];
```

### 4. Certification Generator

**Location**: `src/testing/certificationGenerator.ts`

**Interface**:
```typescript
interface CertificationGenerator {
  generate(results: ParityResults): string;
  writeToFile(certification: string, path: string): Promise<void>;
}
```

**Output Format**:
- Markdown document with test results
- Difference classification breakdown
- Timestamp and version information
- Confirmation of zero logic differences

## Data Models

### ParityTestConfig
```typescript
interface ParityTestConfig {
  seeds: number[];
  commandsPerSeed: number;
  commandSequences: CommandSequence[];
  timeout: number; // milliseconds
}

const DEFAULT_CONFIG: ParityTestConfig = {
  seeds: [12345, 67890, 54321, 99999, 11111, 22222, 33333, 44444, 55555, 77777],
  commandsPerSeed: 250,
  commandSequences: [...], // Defined in extended sequences
  timeout: 300000 // 5 minutes
};
```

### CommandSequence
```typescript
interface CommandSequence {
  name: string;
  category: 'exploration' | 'puzzle' | 'edge-case';
  commands: string[];
}
```

### SeedResult
```typescript
interface SeedResult {
  seed: number;
  totalCommands: number;
  matchingResponses: number;
  differences: ClassifiedDifference[];
  parityPercentage: number;
}

interface ClassifiedDifference {
  commandIndex: number;
  command: string;
  tsResponse: string;
  zmResponse: string;
  classification: DifferenceType;
  reason: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: LOOK Output Format Matches Z-Machine

*For any* room in the game, when the LOOK command is executed, the TypeScript implementation SHALL produce output with room name formatting identical to the Z-Machine output.

**Validates: Requirements 1.1**

### Property 2: All Differences Get Classified

*For any* difference detected between TypeScript and Z-Machine outputs, the classifier SHALL assign exactly one classification from {RNG_DIFFERENCE, STATE_DIVERGENCE, LOGIC_DIFFERENCE}.

**Validates: Requirements 2.3**

### Property 3: Extended Sequences Reveal No New Logic Differences

*For any* command sequence of 200+ commands, when executed against both implementations, the number of LOGIC_DIFFERENCE classifications SHALL be zero.

**Validates: Requirements 3.4**

### Property 4: Regression Detection Works

*For any* introduced logic difference (simulated or real), the parity test SHALL fail with an error message identifying the difference.

**Validates: Requirements 4.2**

### Property 5: RNG Pool Messages Classified Correctly

*For any* message that matches a pattern in the YUKS, HO-HUM, or HELLOS pools, when that message differs between implementations, the classifier SHALL classify it as RNG_DIFFERENCE.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 6: State Divergence Classified Correctly

*For any* blocked exit message that appears in one implementation but not the other due to different player locations, the classifier SHALL classify it as STATE_DIVERGENCE.

**Validates: Requirements 5.4**

### Property 7: Unclassified Differences Flagged as Logic

*For any* difference that does not match RNG pool patterns and is not caused by state divergence, the classifier SHALL classify it as LOGIC_DIFFERENCE.

**Validates: Requirements 5.5**

## Error Handling

### Classification Errors
- If a message cannot be parsed, log warning and classify as LOGIC_DIFFERENCE (conservative approach)
- If Z-Machine process fails, retry up to 3 times before failing the test

### Timeout Handling
- Individual command timeout: 5 seconds
- Total test timeout: 5 minutes
- On timeout, report partial results and fail

### File I/O Errors
- Certification file write failures should not fail the test
- Log error and continue with console output

## Testing Strategy

### Unit Tests
- Test LOOK output formatting for various room types
- Test difference classifier with known RNG pool messages
- Test certification generator output format

### Property-Based Tests
- **Property 1**: Generate random room states, verify LOOK format matches expected pattern
- **Property 2**: Generate random differences, verify all get classified
- **Property 5**: Generate all RNG pool message combinations, verify classification
- **Property 6**: Generate state divergence scenarios, verify classification
- **Property 7**: Generate non-RNG differences, verify flagged as logic

### Integration Tests
- Run full parity validation with 5 seeds (subset for CI speed)
- Verify certification document generation
- Verify regression detection with injected difference

### Test Configuration
- Property tests: minimum 100 iterations
- Integration tests: 5 seeds × 100 commands = 500 command executions
- Full validation: 10 seeds × 250 commands = 2500 command executions

