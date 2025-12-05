# Design Document

## Overview

This design document outlines the architecture for an exhaustive testing system for the Zork I rewrite. The system will systematically test every room, object, and interaction in the game, maintaining detailed logs of test progress and bug reports. The design emphasizes automation where possible while allowing for manual verification of subjective aspects like text quality.

## Architecture

### High-Level Architecture

The testing system consists of several key components:

1. **Test Coordinator**: Orchestrates test execution and manages test state
2. **Test Runners**: Execute specific types of tests (room tests, object tests, etc.)
3. **Test Logger**: Records test results and maintains progress
4. **Bug Tracker**: Manages bug reports and their lifecycle
5. **Coverage Analyzer**: Calculates and reports test coverage
6. **Test Reporter**: Generates human-readable test reports

### Data Flow

```
Test Data (rooms, objects) → Test Coordinator → Test Runners → Game State
                                     ↓
                              Test Logger ← Test Results
                                     ↓
                              Bug Tracker ← Detected Issues
                                     ↓
                              Coverage Analyzer → Test Reports
```

### Module Structure

```
src/testing/
├── coordinator.ts          # Main test orchestration
├── runners/
│   ├── roomTester.ts      # Room-specific tests
│   ├── objectTester.ts    # Object interaction tests
│   ├── puzzleTester.ts    # Puzzle solution tests
│   ├── npcTester.ts       # NPC behavior tests
│   └── edgeCaseTester.ts  # Edge case and error tests
├── logger.ts              # Test logging and persistence
├── bugTracker.ts          # Bug report management
├── coverage.ts            # Coverage calculation
├── reporter.ts            # Report generation
└── types.ts               # Type definitions

.kiro/testing/
├── test-progress.json     # Persistent test state
├── bug-reports.json       # Bug database
└── test-reports/          # Generated reports
    ├── coverage-YYYY-MM-DD.md
    └── bugs-YYYY-MM-DD.md
```

## Components and Interfaces

### Test Coordinator

```typescript
interface TestCoordinator {
  loadProgress(): TestProgress;
  saveProgress(progress: TestProgress): void;
  runTests(options: TestOptions): Promise<TestResults>;
  resumeTests(): Promise<TestResults>;
  resetProgress(): void;
}

interface TestOptions {
  testRooms?: boolean;
  testObjects?: boolean;
  testPuzzles?: boolean;
  testNPCs?: boolean;
  testEdgeCases?: boolean;
  roomFilter?: string[];
  objectFilter?: string[];
  maxTests?: number;
}

interface TestProgress {
  testedRooms: Set<string>;
  testedObjects: Set<string>;
  testedInteractions: Map<string, Set<string>>;
  lastTestDate: Date;
  totalTests: number;
}
```

### Test Runners

```typescript
interface TestRunner {
  runTests(items: string[], state: GameState): Promise<TestResult[]>;
}

interface RoomTester extends TestRunner {
  testRoomDescription(roomId: string, state: GameState): TestResult;
  testRoomExits(roomId: string, state: GameState): TestResult;
  testRoomObjects(roomId: string, state: GameState): TestResult;
}

interface ObjectTester extends TestRunner {
  testBasicInteractions(objectId: string, state: GameState): TestResult[];
  testObjectSpecificActions(objectId: string, state: GameState): TestResult[];
  testObjectFlags(objectId: string, state: GameState): TestResult;
}
```

### Test Results

```typescript
interface TestResult {
  testId: string;
  testType: TestType;
  itemId: string;
  passed: boolean;
  message: string;
  timestamp: Date;
  gameState?: GameStateSnapshot;
  bug?: BugReport;
}

enum TestType {
  ROOM_DESCRIPTION = 'ROOM_DESCRIPTION',
  ROOM_EXITS = 'ROOM_EXITS',
  OBJECT_EXAMINE = 'OBJECT_EXAMINE',
  OBJECT_TAKE = 'OBJECT_TAKE',
  OBJECT_ACTION = 'OBJECT_ACTION',
  PUZZLE_SOLUTION = 'PUZZLE_SOLUTION',
  NPC_INTERACTION = 'NPC_INTERACTION',
  EDGE_CASE = 'EDGE_CASE'
}

interface GameStateSnapshot {
  currentRoom: string;
  inventory: string[];
  score: number;
  moves: number;
  flags: Record<string, boolean>;
}
```

### Bug Tracking

```typescript
interface BugReport {
  id: string;
  title: string;
  description: string;
  category: BugCategory;
  severity: BugSeverity;
  status: BugStatus;
  reproductionSteps: string[];
  gameState: GameStateSnapshot;
  foundDate: Date;
  fixedDate?: Date;
  verifiedDate?: Date;
}

enum BugCategory {
  PARSER_ERROR = 'PARSER_ERROR',
  ACTION_ERROR = 'ACTION_ERROR',
  MISSING_CONTENT = 'MISSING_CONTENT',
  INCORRECT_BEHAVIOR = 'INCORRECT_BEHAVIOR',
  CRASH = 'CRASH',
  TEXT_ERROR = 'TEXT_ERROR'
}

enum BugSeverity {
  CRITICAL = 'CRITICAL',    // Game-breaking, crashes
  MAJOR = 'MAJOR',          // Feature doesn't work
  MINOR = 'MINOR',          // Small issue, workaround exists
  TRIVIAL = 'TRIVIAL'       // Cosmetic, typos
}

enum BugStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  FIXED = 'FIXED',
  VERIFIED = 'VERIFIED',
  WONT_FIX = 'WONT_FIX'
}
```

## Data Models

### Test Progress Data

Stored in `.kiro/testing/test-progress.json`:

```json
{
  "version": "1.0",
  "lastUpdated": "2024-12-04T16:30:00Z",
  "testedRooms": ["WEST-OF-HOUSE", "NORTH-OF-HOUSE", ...],
  "testedObjects": ["MAILBOX", "LEAFLET", ...],
  "testedInteractions": {
    "MAILBOX": ["EXAMINE", "OPEN", "CLOSE"],
    "LEAFLET": ["EXAMINE", "TAKE", "READ"]
  },
  "totalTests": 1247,
  "coverage": {
    "rooms": 0.45,
    "objects": 0.32,
    "interactions": 0.28
  }
}
```

### Bug Reports Data

Stored in `.kiro/testing/bug-reports.json`:

```json
{
  "bugs": [
    {
      "id": "BUG-001",
      "title": "Cannot climb tree in Forest Path",
      "description": "CLIMB TREE command returns 'You can't do that!' instead of moving player up",
      "category": "ACTION_ERROR",
      "severity": "MAJOR",
      "status": "FIXED",
      "reproductionSteps": [
        "Go to Forest Path (PATH room)",
        "Type 'climb tree'",
        "Observe error message"
      ],
      "gameState": {
        "currentRoom": "PATH",
        "inventory": [],
        "score": 0,
        "moves": 5
      },
      "foundDate": "2024-12-04T15:00:00Z",
      "fixedDate": "2024-12-04T16:15:00Z"
    }
  ]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Test progress persistence
*For any* test session, saving and then loading test progress should preserve all tested items and their results
**Validates: Requirements 4.1, 4.2**

### Property 2: Coverage calculation accuracy
*For any* set of tested items, the coverage percentage should equal (tested items / total items) * 100
**Validates: Requirements 4.3**

### Property 3: Bug report completeness
*For any* detected bug, the bug report should include reproduction steps, game state, and categorization
**Validates: Requirements 5.1, 5.3, 5.4**

### Property 4: Test idempotency
*For any* test that passes, running the same test again with the same initial state should also pass
**Validates: Requirements 9.2, 9.5**

### Property 5: Room reachability
*For any* room marked as tested, there should exist a path from the starting room to that room
**Validates: Requirements 1.5**

### Property 6: Object accessibility
*For any* object marked as tested, the object should be reachable from the starting game state
**Validates: Requirements 2.5**

## Error Handling

### Error Categories

1. **Test Execution Errors**: Errors that occur while running tests
2. **Game State Errors**: Invalid game state encountered during testing
3. **File I/O Errors**: Problems reading/writing test data
4. **Configuration Errors**: Invalid test configuration

### Error Handling Strategy

- All test errors should be caught and logged, not crash the test system
- Failed tests should generate bug reports automatically
- Test progress should be saved frequently to prevent data loss
- Detailed error logs should be maintained for debugging

## Testing Strategy

### Unit Testing

Unit tests will verify:
- Test coordinator logic
- Coverage calculation
- Bug report generation
- Test result serialization

### Integration Testing

Integration tests will verify:
- End-to-end test execution
- Test progress persistence
- Bug tracking workflow
- Report generation

### Property-Based Testing

Property-based tests will verify the correctness properties defined above using fast-check.

**Testing Framework**: fast-check

**Configuration**: Each property-based test should run a minimum of 100 iterations.

**Test Tagging**: Each property-based test must include a comment tag:
```typescript
// Feature: exhaustive-game-testing, Property N: [property text]
```

## Implementation Notes

### Test Execution Strategy

1. **Breadth-First Room Testing**: Start from WEST-OF-HOUSE and test rooms in breadth-first order
2. **Object Testing by Location**: Test objects as they're encountered in rooms
3. **Puzzle Testing by Dependency**: Test puzzles in order of their dependencies
4. **NPC Testing Opportunistically**: Test NPCs when encountered

### Automation Approach

- **Fully Automated**: Room descriptions, exits, basic object interactions
- **Semi-Automated**: Puzzle solutions (automated execution, manual verification)
- **Manual**: Text quality, game balance, subjective aspects

### Performance Considerations

- Test execution should be interruptible and resumable
- Progress should be saved after every 10 tests
- Test reports should be generated incrementally
- Memory usage should remain under 500MB

### Test Prioritization

1. **Critical Path**: Test main game progression first
2. **Common Objects**: Test frequently used objects (lamp, sword, etc.)
3. **Major Puzzles**: Test puzzles required for game completion
4. **Optional Content**: Test side areas and optional puzzles
5. **Edge Cases**: Test unusual combinations and error conditions

## Future Enhancements

Potential enhancements beyond the initial implementation:
- Visual test dashboard web interface
- Automated comparison with original Zork I behavior
- Performance benchmarking during tests
- Automated bug fix verification
- Test case generation from bug reports
