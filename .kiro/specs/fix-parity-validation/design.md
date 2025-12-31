# Design Document: Fix Parity Validation System

## Overview

This design addresses the root causes of inaccurate parity measurement in the Zork I TypeScript implementation. The current system reports ~2.57% parity because it compares full output blocks (including room descriptions, headers, and prompts) rather than extracting and comparing the actual action responses. This design introduces a message extraction layer and improves the difference classification to achieve accurate parity measurement.

## Architecture

The solution adds a new Message Extraction layer between the recorders and the comparator:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Parity Validation System                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐           ┌─────────────────┐              │
│  │  TS Recorder    │           │  ZM Recorder    │              │
│  └────────┬────────┘           └────────┬────────┘              │
│           │                             │                        │
│           ▼                             ▼                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Message Extractor (NEW)                        ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   ││
│  │  │ Strip    │  │ Strip    │  │ Strip    │  │ Extract  │   ││
│  │  │ Header   │  │ Status   │  │ Prompt   │  │ Response │   ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│           │                             │                        │
│           ▼                             ▼                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Enhanced Comparator                            ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  ││
│  │  │ Semantic │  │ RNG Pool │  │ Classify │                  ││
│  │  │ Compare  │  │ Detect   │  │ Diff     │                  ││
│  │  └──────────┘  └──────────┘  └──────────┘                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. MessageExtractor

**Location**: `src/testing/recording/messageExtractor.ts`

**Interface**:
```typescript
interface MessageExtractor {
  extractActionResponse(output: string, command: string): ExtractedMessage;
  stripGameHeader(output: string): string;
  stripStatusBar(output: string): string;
  stripPrompt(output: string): string;
  stripRoomDescription(output: string, command: string): string;
  isMovementCommand(command: string): boolean;
}

interface ExtractedMessage {
  /** The extracted action response */
  response: string;
  /** The room description if present */
  roomDescription?: string;
  /** Whether this was a movement command */
  isMovement: boolean;
  /** Original full output for debugging */
  originalOutput: string;
}
```

**Behavior**:
- Strips game headers (ZORK I title, copyright, version info)
- Strips status bar lines (Score: X, Moves: Y)
- Strips command prompts (">")
- For movement commands, extracts room name and description
- For action commands, extracts the response message after any room description

### 2. Enhanced Difference Classifier

**Location**: `src/testing/differenceClassifier.ts` (updated)

**New Methods**:
```typescript
interface EnhancedClassifier {
  // Existing methods...
  
  /** Classify using extracted messages instead of full output */
  classifyExtracted(
    tsExtracted: ExtractedMessage,
    zmExtracted: ExtractedMessage,
    context: CommandContext
  ): ClassifiedDifference;
  
  /** Check if two responses are semantically equivalent */
  areSemanticallyEquivalent(response1: string, response2: string): boolean;
  
  /** Normalize a response for comparison */
  normalizeResponse(response: string): string;
}
```

### 3. Updated Comparator

**Location**: `src/testing/recording/comparator.ts` (updated)

**Changes**:
- Use MessageExtractor before comparison
- Compare extracted responses, not full output blocks
- Report structural vs behavioral differences separately

### 4. Real Certification Generator

**Location**: `src/testing/certificationGenerator.ts` (updated)

**Changes**:
- Remove mock data generation
- Run actual validation before generating certification
- Fail if Z-Machine is unavailable
- Include real sample differences

## Data Models

### ExtractedMessage
```typescript
interface ExtractedMessage {
  response: string;
  roomDescription?: string;
  isMovement: boolean;
  originalOutput: string;
}
```

### EnhancedParityResults
```typescript
interface EnhancedParityResults extends ParityResults {
  /** Structural differences (formatting, whitespace) */
  structuralDifferences: number;
  /** Behavioral differences (actual logic) */
  behavioralDifferences: number;
  /** Breakdown by difference type */
  differenceBreakdown: {
    rng: number;
    structural: number;
    behavioral: number;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: Message Extraction Preserves Action Response

*For any* output block containing an action response message, when the MessageExtractor processes it, the extracted response SHALL contain the original action response message.

**Validates: Requirements 1.1, 1.5**

### Property 2: Extraction Removes Non-Response Content

*For any* output block containing game headers, status bars, or prompts, when the MessageExtractor processes it, the extracted response SHALL NOT contain any of these elements.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 3: Movement Commands Return Room Description

*For any* movement command (n, s, e, w, u, d, etc.) that results in a room change, the extracted response SHALL contain the room name and description.

**Validates: Requirements 1.6**

### Property 4: RNG Pool Messages Classified Correctly

*For any* pair of extracted responses where both are from the same RNG pool (YUKS, HO-HUM, or HELLOS), the classifier SHALL return RNG_DIFFERENCE classification.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Whitespace Handling in Classification

*For any* RNG pool message with arbitrary leading/trailing whitespace, the classifier SHALL still correctly identify it as an RNG pool message.

**Validates: Requirements 2.4, 2.5**

### Property 6: Structural Differences Ignored

*For any* pair of outputs that differ only in headers, whitespace, line wrapping, or prompt formatting, the comparator SHALL consider them matching.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 7: Regression Detection Fails on New Logic Differences

*For any* validation result containing a new logic difference not in the baseline, the regression detector SHALL fail the validation.

**Validates: Requirements 6.3**

### Property 8: Regression Detection Allows RNG Variance

*For any* validation result where RNG differences vary from the baseline but no new logic differences exist, the regression detector SHALL pass the validation.

**Validates: Requirements 6.4**

## Error Handling

### Extraction Errors
- If output cannot be parsed, return the original output as the response
- Log warning for debugging but don't fail validation

### Z-Machine Unavailability
- Certification generation should fail with clear error message
- Validation should report "Z-Machine unavailable" status

### Malformed Output
- Handle empty outputs gracefully
- Handle outputs with unexpected formatting

## Testing Strategy

### Unit Tests
- Test MessageExtractor with various output formats
- Test classifier with RNG pool messages
- Test comparator with structural differences

### Property-Based Tests
- **Property 1**: Generate random output blocks with embedded responses
- **Property 2**: Generate outputs with headers/status/prompts
- **Property 4**: Generate RNG pool message pairs
- **Property 6**: Generate structurally different but semantically equivalent outputs
- **Property 7-8**: Test regression detection with injected differences

### Integration Tests
- Run actual validation with Z-Machine
- Verify certification generation with real data
- Verify baseline generation and regression detection

### Test Configuration
- Property tests: minimum 100 iterations
- Use fast-check for property-based testing
- Tag format: **Feature: fix-parity-validation, Property {number}: {property_text}**
