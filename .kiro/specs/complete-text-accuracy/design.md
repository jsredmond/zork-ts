# Design Document: Complete Text Accuracy

## Overview

This design outlines the approach to achieve 95%+ text message accuracy by systematically adding the remaining 291 TELL messages from the original ZIL source. The current implementation has 68.4% message coverage (630/921 messages found). The missing messages fall into four categories: scenery object interactions (40%), special object behaviors (30%), conditional/state messages (20%), and generic variations (10%).

The design focuses on:
1. Extracting and categorizing missing messages from ZIL source
2. Implementing action handlers for scenery objects
3. Adding special behavior messages to existing objects
4. Implementing conditional message variations
5. Adding generic response variations
6. Validating message accuracy against the original

## Architecture

### Message Extraction Pipeline

```
ZIL Source Files (1actions.zil, gverbs.zil)
    ↓
Message Extractor (Enhanced)
    ↓
Message Categorizer
    ↓
Priority Classifier
    ↓
Implementation Queue
    ↓
TypeScript Action Handlers
    ↓
Validation Tests
```

### Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                    Message Implementation                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │ ZIL Message  │─────▶│  Categorize  │                    │
│  │  Extractor   │      │  & Prioritize│                    │
│  └──────────────┘      └──────┬───────┘                    │
│                               │                             │
│                               ▼                             │
│  ┌──────────────────────────────────────────────┐          │
│  │         Implementation Strategy              │          │
│  ├──────────────────────────────────────────────┤          │
│  │ • Scenery Object Handlers                    │          │
│  │ • Special Behavior Extensions                │          │
│  │ • Conditional Message Logic                  │          │
│  │ • Generic Response Variations                │          │
│  └──────────────┬───────────────────────────────┘          │
│                 │                                           │
│                 ▼                                           │
│  ┌──────────────────────────────────────────────┐          │
│  │      TypeScript Action Handlers              │          │
│  │  • actions.ts (main handlers)                │          │
│  │  • sceneryActions.ts (new)                   │          │
│  │  • specialBehaviors.ts (new)                 │          │
│  └──────────────┬───────────────────────────────┘          │
│                 │                                           │
│                 ▼                                           │
│  ┌──────────────────────────────────────────────┐          │
│  │         Message Validator                    │          │
│  │  • Exact text matching                       │          │
│  │  • Coverage reporting                        │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced Message Extractor

**Purpose**: Extract all TELL messages from ZIL source with context

**Location**: `scripts/extract-zil-messages.ts` (enhance existing)

**Key Functions**:
```typescript
interface ZilMessage {
  file: string;
  line: number;
  context: string;        // Function/routine name
  message: string;        // The actual text
  type: 'TELL' | 'JIGS-UP' | 'DESC' | 'LDESC' | 'TEXT' | 'FDESC';
  object?: string;        // Associated object (if any)
  verb?: string;          // Associated verb (if any)
  condition?: string;     // Any conditional logic
}

function extractMessagesWithContext(zilFile: string): ZilMessage[]
function categorizeMessage(msg: ZilMessage): MessageCategory
function prioritizeMessage(msg: ZilMessage): Priority
```

### 2. Message Categorizer

**Purpose**: Classify messages by type and priority

**Location**: `scripts/categorize-messages.ts` (new)

**Categories**:
```typescript
enum MessageCategory {
  SCENERY_INTERACTION = 'scenery',      // Boards, walls, trees
  SPECIAL_BEHAVIOR = 'special',         // Water, ghosts, complex objects
  CONDITIONAL_STATE = 'conditional',    // State-dependent messages
  GENERIC_VARIATION = 'generic',        // Alternative phrasings
  ERROR_MESSAGE = 'error',              // Failure/refusal messages
  PUZZLE_SPECIFIC = 'puzzle'            // Puzzle-related feedback
}

enum Priority {
  CRITICAL = 'critical',    // Affects gameplay
  HIGH = 'high',            // Important for experience
  MEDIUM = 'medium',        // Nice to have
  LOW = 'low'               // Polish/flavor
}

interface CategorizedMessage extends ZilMessage {
  category: MessageCategory;
  priority: Priority;
  implementationNotes: string;
}
```

### 3. Scenery Action Handlers

**Purpose**: Handle interactions with non-takeable scenery objects

**Location**: `src/game/sceneryActions.ts` (new)

**Interface**:
```typescript
interface SceneryHandler {
  objectId: string;
  actions: Map<string, (state: GameState) => string>;
}

// Example handlers
const sceneryHandlers: SceneryHandler[] = [
  {
    objectId: 'BOARD',
    actions: new Map([
      ['TAKE', () => 'The boards are securely fastened.'],
      ['EXAMINE', () => 'The boards are securely fastened.'],
      ['REMOVE', () => 'The boards are securely fastened.']
    ])
  },
  {
    objectId: 'GRANITE-WALL',
    actions: new Map([
      ['TAKE', (state) => {
        if (state.currentRoom === 'SLIDE-ROOM') {
          return "The wall isn't granite.";
        }
        return "It's solid granite.";
      }],
      ['FIND', (state) => {
        if (state.currentRoom === 'NORTH-TEMPLE') {
          return 'The west wall is solid granite here.';
        }
        if (state.currentRoom === 'TREASURE-ROOM') {
          return 'The east wall is solid granite here.';
        }
        if (state.currentRoom === 'SLIDE-ROOM') {
          return 'It only SAYS "Granite Wall".';
        }
        return 'There is no granite wall here.';
      }]
    ])
  }
];

function handleSceneryAction(
  objectId: string,
  verb: string,
  state: GameState
): string | null
```

### 4. Special Behavior Extensions

**Purpose**: Add complex state-dependent behaviors to existing objects

**Location**: `src/game/specialBehaviors.ts` (new)

**Interface**:
```typescript
interface SpecialBehavior {
  objectId: string;
  condition: (state: GameState) => boolean;
  handler: (verb: string, state: GameState) => string | null;
}

// Example: Water behavior
const waterBehavior: SpecialBehavior = {
  objectId: 'WATER',
  condition: (state) => state.currentRoom === 'STREAM' || state.currentRoom === 'RESERVOIR',
  handler: (verb, state) => {
    if (verb === 'DRINK') {
      return 'The water is cool and refreshing.';
    }
    if (verb === 'TAKE') {
      if (!state.inventory.includes('BOTTLE')) {
        return 'You have nothing to carry it in.';
      }
      // ... more logic
    }
    return null;
  }
};

function applySpecialBehavior(
  objectId: string,
  verb: string,
  state: GameState
): string | null
```

### 5. Conditional Message System

**Purpose**: Select appropriate message based on game state

**Location**: `src/game/conditionalMessages.ts` (new)

**Interface**:
```typescript
interface ConditionalMessage {
  messageId: string;
  variants: Array<{
    condition: (state: GameState) => boolean;
    message: string;
  }>;
  defaultMessage: string;
}

// Example: Room description that changes
const westHouseDescription: ConditionalMessage = {
  messageId: 'WEST-HOUSE-DESC',
  variants: [
    {
      condition: (state) => state.flags.WON_FLAG,
      message: 'You are standing in an open field west of a white house, with a boarded front door. A secret path leads southwest into the forest.'
    }
  ],
  defaultMessage: 'You are standing in an open field west of a white house, with a boarded front door.'
};

function getConditionalMessage(
  messageId: string,
  state: GameState
): string
```

### 6. Message Validator

**Purpose**: Validate implemented messages against ZIL source

**Location**: `scripts/validate-messages.ts` (enhance existing)

**Enhancements**:
```typescript
interface ValidationReport {
  totalMessages: number;
  foundMessages: number;
  missingMessages: ZilMessage[];
  incorrectMessages: Array<{
    zilMessage: string;
    tsMessage: string;
    similarity: number;
  }>;
  coverageByCategory: Map<MessageCategory, number>;
  coverageByPriority: Map<Priority, number>;
}

function validateMessageAccuracy(): ValidationReport
function generateCoverageReport(report: ValidationReport): string
function identifyHighPriorityGaps(report: ValidationReport): ZilMessage[]
```

## Data Models

### Message Database

**Location**: `.kiro/testing/categorized-messages.json`

**Structure**:
```json
{
  "messages": [
    {
      "id": "BOARD-TAKE-1",
      "zilFile": "1actions.zil",
      "zilLine": 56,
      "context": "BOARD-F",
      "message": "The boards are securely fastened.",
      "type": "TELL",
      "object": "BOARD",
      "verb": "TAKE",
      "category": "scenery",
      "priority": "low",
      "implemented": false,
      "tsLocation": null
    },
    {
      "id": "GRANITE-WALL-TAKE-1",
      "zilFile": "1actions.zil",
      "zilLine": 72,
      "context": "GRANITE-WALL-F",
      "message": "It's solid granite.",
      "type": "TELL",
      "object": "GRANITE-WALL",
      "verb": "TAKE",
      "condition": "EQUAL? ,HERE ,NORTH-TEMPLE",
      "category": "scenery",
      "priority": "low",
      "implemented": false,
      "tsLocation": null
    }
  ],
  "statistics": {
    "total": 921,
    "implemented": 630,
    "missing": 291,
    "byCategory": {
      "scenery": 116,
      "special": 87,
      "conditional": 58,
      "generic": 30
    },
    "byPriority": {
      "critical": 15,
      "high": 45,
      "medium": 110,
      "low": 121
    }
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Message text exactness
*For any* implemented message, the text displayed to the player should match the original ZIL message exactly (ignoring whitespace normalization)
**Validates: Requirements 1.5, 2.5, 3.5, 4.5, 7.5**

### Property 2: Scenery action coverage
*For any* scenery object and any verb attempted on it, if the original ZIL has a message for that combination, the TypeScript implementation should display that message
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 3: Conditional message correctness
*For any* conditional message, the variant displayed should match the game state conditions exactly as specified in the original ZIL
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 4: Special behavior completeness
*For any* object with special behaviors in the ZIL source, all those behaviors should be implemented in TypeScript with matching messages
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 5: Message coverage threshold
*For any* validation run, the percentage of implemented messages should be at least 95% of total TELL messages
**Validates: Requirements 5.5**

### Property 6: Error message consistency
*For any* invalid action, the error message displayed should match the original ZIL error message for that scenario
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

## Error Handling

### Missing Message Handling

**Strategy**: Graceful degradation with logging

```typescript
function getMessageOrFallback(
  messageId: string,
  fallback: string,
  context: string
): string {
  const message = messageDatabase.get(messageId);
  
  if (!message) {
    logger.warn(`Missing message: ${messageId} in ${context}`);
    return fallback;
  }
  
  return message;
}
```

### Validation Errors

**Types**:
1. **Text Mismatch**: Implemented message differs from ZIL
2. **Missing Implementation**: ZIL message has no TypeScript equivalent
3. **Extra Implementation**: TypeScript has message not in ZIL
4. **Conditional Logic Error**: Wrong message for game state

**Handling**:
```typescript
interface ValidationError {
  type: 'mismatch' | 'missing' | 'extra' | 'conditional';
  messageId: string;
  expected: string;
  actual: string;
  severity: 'error' | 'warning';
}

function reportValidationErrors(errors: ValidationError[]): void {
  // Group by severity and type
  // Generate actionable report
  // Fail build if critical errors exist
}
```

## Testing Strategy

### Unit Testing

**Focus**: Individual message handlers and utilities

**Tests**:
1. Message extraction from ZIL source
2. Message categorization logic
3. Priority assignment
4. Scenery handler registration
5. Conditional message selection
6. Special behavior application

**Example**:
```typescript
describe('Scenery Action Handlers', () => {
  it('should return correct message for BOARD + TAKE', () => {
    const result = handleSceneryAction('BOARD', 'TAKE', mockState);
    expect(result).toBe('The boards are securely fastened.');
  });
  
  it('should handle conditional scenery messages', () => {
    const state = { ...mockState, currentRoom: 'SLIDE-ROOM' };
    const result = handleSceneryAction('GRANITE-WALL', 'TAKE', state);
    expect(result).toBe("The wall isn't granite.");
  });
});
```

### Property-Based Testing

**Library**: fast-check (already in use)

**Property Tests**:

1. **Message Exactness Property**
```typescript
// Feature: complete-text-accuracy, Property 1: Message text exactness
it('should match ZIL messages exactly', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...implementedMessages),
      (messageId) => {
        const zilMessage = getZilMessage(messageId);
        const tsMessage = getTypeScriptMessage(messageId);
        return normalizeWhitespace(zilMessage) === normalizeWhitespace(tsMessage);
      }
    ),
    { numRuns: 100 }
  );
});
```

2. **Scenery Coverage Property**
```typescript
// Feature: complete-text-accuracy, Property 2: Scenery action coverage
it('should handle all scenery object actions from ZIL', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...sceneryObjects),
      fc.constantFrom(...verbs),
      (objectId, verb) => {
        const zilHasMessage = hasZilMessage(objectId, verb);
        const tsHasHandler = hasTypeScriptHandler(objectId, verb);
        return !zilHasMessage || tsHasHandler;
      }
    ),
    { numRuns: 100 }
  );
});
```

3. **Conditional Message Property**
```typescript
// Feature: complete-text-accuracy, Property 3: Conditional message correctness
it('should select correct message variant for game state', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...conditionalMessages),
      arbitraryGameState(),
      (messageId, state) => {
        const zilMessage = getZilMessageForState(messageId, state);
        const tsMessage = getConditionalMessage(messageId, state);
        return normalizeWhitespace(zilMessage) === normalizeWhitespace(tsMessage);
      }
    ),
    { numRuns: 100 }
  );
});
```

4. **Special Behavior Property**
```typescript
// Feature: complete-text-accuracy, Property 4: Special behavior completeness
it('should implement all special behaviors from ZIL', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...specialBehaviorObjects),
      fc.constantFrom(...verbs),
      arbitraryGameState(),
      (objectId, verb, state) => {
        const zilBehavior = getZilBehavior(objectId, verb, state);
        const tsBehavior = applySpecialBehavior(objectId, verb, state);
        
        if (!zilBehavior) return true; // No ZIL behavior to match
        return tsBehavior !== null; // TS should have implementation
      }
    ),
    { numRuns: 100 }
  );
});
```

5. **Coverage Threshold Property**
```typescript
// Feature: complete-text-accuracy, Property 5: Message coverage threshold
it('should achieve 95% message coverage', () => {
  const report = validateMessageAccuracy();
  const coverage = (report.foundMessages / report.totalMessages) * 100;
  expect(coverage).toBeGreaterThanOrEqual(95);
});
```

6. **Error Message Property**
```typescript
// Feature: complete-text-accuracy, Property 6: Error message consistency
it('should match ZIL error messages for invalid actions', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...invalidActionScenarios),
      (scenario) => {
        const zilError = getZilErrorMessage(scenario);
        const tsError = executeInvalidAction(scenario);
        return normalizeWhitespace(zilError) === normalizeWhitespace(tsError);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Focus**: End-to-end message accuracy

**Tests**:
1. Play through major game scenarios
2. Compare output with original game transcripts
3. Validate all puzzle-related messages
4. Test NPC dialogue sequences
5. Verify daemon messages (lamp, candles, etc.)

**Example**:
```typescript
describe('Message Accuracy Integration', () => {
  it('should match original game for treasure collection', async () => {
    const commands = ['take lamp', 'turn on lamp', 'open trap door', 'down'];
    const tsOutput = await runCommands(commands);
    const zilOutput = await runCommandsInOriginal(commands);
    
    expect(normalizeOutput(tsOutput)).toBe(normalizeOutput(zilOutput));
  });
});
```

## Implementation Phases

### Phase 1: Infrastructure (Days 1-2)
1. Enhance message extractor to capture context
2. Implement message categorizer
3. Create priority classifier
4. Generate categorized message database
5. Set up scenery action handler framework

### Phase 2: Critical Messages (Days 3-5)
1. Implement high-priority puzzle messages
2. Add critical NPC dialogue
3. Implement important error messages
4. Validate critical message accuracy
5. Run integration tests

### Phase 3: Scenery Handlers (Days 6-9)
1. Implement scenery object action handlers
2. Add all scenery interaction messages
3. Test scenery interactions
4. Validate scenery message accuracy

### Phase 4: Special Behaviors (Days 10-12)
1. Implement special object behaviors
2. Add conditional message logic
3. Test state-dependent messages
4. Validate special behavior accuracy

### Phase 5: Polish & Validation (Days 13-15)
1. Add generic message variations
2. Implement remaining edge cases
3. Run comprehensive validation
4. Achieve 95%+ coverage
5. Generate final accuracy report

## Performance Considerations

### Message Lookup Optimization

**Strategy**: Use Map for O(1) lookups

```typescript
const messageCache = new Map<string, string>();

function getCachedMessage(messageId: string): string {
  if (!messageCache.has(messageId)) {
    messageCache.set(messageId, loadMessage(messageId));
  }
  return messageCache.get(messageId)!;
}
```

### Validation Performance

**Strategy**: Parallel processing for large message sets

```typescript
async function validateMessagesInParallel(
  messages: ZilMessage[]
): Promise<ValidationReport> {
  const chunks = chunkArray(messages, 100);
  const results = await Promise.all(
    chunks.map(chunk => validateChunk(chunk))
  );
  return mergeResults(results);
}
```

## Dependencies

### Existing Dependencies
- fast-check: Property-based testing
- vitest: Test framework
- TypeScript: Type safety

### New Dependencies
None required - all functionality can be implemented with existing tools

## Migration Strategy

### Backward Compatibility

**Approach**: Additive changes only

1. New files for scenery and special behaviors
2. Extend existing action handlers without breaking changes
3. Maintain existing test suite
4. Add new tests alongside existing ones

### Rollout Plan

1. **Phase 1**: Infrastructure (no user-facing changes)
2. **Phase 2**: Critical messages (improves gameplay)
3. **Phase 3**: Scenery handlers (adds polish)
4. **Phase 4**: Special behaviors (completes experience)
5. **Phase 5**: Final validation (ensures quality)

Each phase is independently testable and deployable.

## Success Metrics

### Primary Metrics
- **Message Coverage**: ≥ 95% of ZIL TELL messages implemented
- **Text Accuracy**: 100% exact match for implemented messages
- **Test Pass Rate**: 100% of tests passing

### Secondary Metrics
- **Critical Message Coverage**: 100% of high-priority messages
- **Scenery Coverage**: ≥ 90% of scenery interactions
- **Special Behavior Coverage**: ≥ 95% of special behaviors
- **Conditional Message Coverage**: ≥ 90% of state-dependent messages

### Quality Metrics
- **Zero Regressions**: All existing tests continue to pass
- **Performance**: No measurable impact on game responsiveness
- **Maintainability**: Clear separation of concerns in code structure
