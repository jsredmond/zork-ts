# Design Document: Parity Fixes for 90% Target

## Overview

This design addresses the remaining parity issues to achieve 90%+ aggregate parity between the TypeScript Zork I implementation and the original Z-Machine game.

**Current State:** 83% aggregate parity
**Target State:** 90%+ aggregate parity

The fixes are organized into five categories:
1. **Batch Runner Process Cleanup** - Fix Z-Machine process termination
2. **Dark Room Display** - Remove room name from dark room output
3. **Trap Door Message** - Update close message to match Z-Machine
4. **Song Bird Suppression** - Add testing mode to suppress random messages
5. **Drop All Order** - Fix inventory ordering for drop all command

## Architecture

The fixes span these modules:

```
src/
├── testing/
│   └── recording/
│       ├── zmRecorder.ts      # Fix process cleanup
│       ├── tsRecorder.ts      # Add suppressRandomMessages option
│       └── types.ts           # Add RecordingOptions.suppressRandomMessages
├── game/
│   ├── actions.ts             # Fix dark room display, trap door message, drop all order
│   └── state.ts               # Add testingMode flag
└── engine/
    └── daemons.ts             # Check testingMode for song bird
```

## Components and Interfaces

### 1. Z-Machine Process Cleanup Fix

**File:** `src/testing/recording/zmRecorder.ts`

The current cleanup method doesn't properly wait for process termination. This causes the 6th sequence in batch mode to fail because the previous process is still holding resources.

**Current Implementation:**
```typescript
private cleanup(): void {
  if (this.process) {
    try {
      if (this.process.stdin && !this.process.stdin.destroyed) {
        this.process.stdin.write('quit\n');
        this.process.stdin.end();
      }
    } catch {
      // Ignore errors during cleanup
    }

    // Force kill if still running - BUT DOESN'T WAIT
    setTimeout(() => {
      if (this.process && !this.process.killed) {
        this.process.kill('SIGTERM');
      }
    }, 500);

    this.process = null;  // Set to null immediately, doesn't wait
  }
}
```

**Fixed Implementation:**
```typescript
private async cleanup(): Promise<void> {
  if (!this.process) return;

  const process = this.process;
  this.process = null;

  return new Promise<void>((resolve) => {
    // Set up timeout for force kill
    const forceKillTimeout = setTimeout(() => {
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }, 1000);

    // Listen for process exit
    process.once('exit', () => {
      clearTimeout(forceKillTimeout);
      resolve();
    });

    // Try graceful quit first
    try {
      if (process.stdin && !process.stdin.destroyed) {
        process.stdin.write('quit\n');
        process.stdin.end();
      }
    } catch {
      // Ignore errors, will force kill on timeout
    }

    // Send SIGTERM after brief delay
    setTimeout(() => {
      if (!process.killed) {
        process.kill('SIGTERM');
      }
    }, 500);
  });
}
```

The `record` method must also be updated to await cleanup:
```typescript
async record(commands: string[], options?: RecordingOptions): Promise<Transcript> {
  // ... existing code ...
  try {
    // ... recording logic ...
  } finally {
    await this.cleanup();  // Now awaits cleanup
  }
  // ... return transcript ...
}
```

### 2. Dark Room Display Fix

**File:** `src/game/actions.ts`

The `formatRoomDescription` function currently shows the room name before the darkness message. This should be removed for dark rooms.

**Current Implementation:**
```typescript
export function formatRoomDescription(room: any, state: GameState): string {
  let output = '';

  // Always show room name first, even in darkness
  output += room.name + '\n';

  // Check if room is lit - if dark, show darkness message after room name
  if (!isRoomLit(state)) {
    return output + getDarknessMessage();
  }
  // ... rest of function
}
```

**Fixed Implementation:**
```typescript
export function formatRoomDescription(room: any, state: GameState): string {
  // Check if room is lit FIRST - if dark, show only darkness message
  if (!isRoomLit(state)) {
    return getDarknessMessage();
  }

  let output = '';
  output += room.name + '\n';
  // ... rest of function
}
```

### 3. Trap Door Close Message Fix

**File:** `src/game/actions.ts`

The `CloseAction` class needs a special case for the trap door when closed from the living room.

**Current Implementation:**
```typescript
// Close the object
obj.removeFlag(ObjectFlag.OPENBIT);

let message = "Closed.";
if (obj.hasFlag(ObjectFlag.DOORBIT)) {
  message = `The ${obj.name.toLowerCase()} is now closed.`;
}
```

**Fixed Implementation:**
```typescript
// Special handling for trap door from living room
if (objectId === 'TRAP-DOOR' && currentRoom && currentRoom.id === 'LIVING-ROOM') {
  obj.removeFlag(ObjectFlag.OPENBIT);
  return {
    success: true,
    message: "The door swings shut and closes.",
    stateChanges: [{
      type: 'FLAG_CHANGED',
      objectId: objectId,
      oldValue: true,
      newValue: false
    }]
  };
}

// Close the object
obj.removeFlag(ObjectFlag.OPENBIT);

let message = "Closed.";
if (obj.hasFlag(ObjectFlag.DOORBIT)) {
  message = `The ${obj.name.toLowerCase()} is now closed.`;
}
```

### 4. Song Bird Message Suppression

**File:** `src/game/state.ts`

Add a testing mode flag to GameState:

```typescript
export class GameState {
  // ... existing properties ...
  private testingMode: boolean = false;

  setTestingMode(enabled: boolean): void {
    this.testingMode = enabled;
  }

  isTestingMode(): boolean {
    return this.testingMode;
  }
}
```

**File:** `src/engine/daemons.ts`

Update the forest room daemon to check testing mode:

```typescript
export function forestRoomDaemon(state: GameState): boolean {
  // Skip random messages in testing mode
  if (state.isTestingMode()) {
    return false;
  }

  // ... existing logic ...
}
```

**File:** `src/testing/recording/types.ts`

Add option to RecordingOptions:

```typescript
export interface RecordingOptions {
  // ... existing options ...
  /** Suppress random atmospheric messages for deterministic testing */
  suppressRandomMessages?: boolean;
}
```

**File:** `src/testing/recording/tsRecorder.ts`

Enable testing mode when recording:

```typescript
async record(commands: string[], options?: RecordingOptions): Promise<Transcript> {
  // ... existing setup ...
  
  // Enable testing mode to suppress random messages
  if (options?.suppressRandomMessages) {
    state.setTestingMode(true);
  }
  
  // ... rest of recording logic ...
}
```

### 5. Drop All Order Fix

**File:** `src/game/actions.ts`

The `DropAllAction` class needs to iterate inventory in reverse order to match Z-Machine behavior.

**Current Implementation:**
```typescript
// Iterate in forward order (first to last) to match Z-Machine behavior
const itemsToDrop = [...state.inventory];

for (const objId of itemsToDrop) {
  // ... drop logic ...
}
```

**Fixed Implementation:**
```typescript
// Iterate in REVERSE order (last acquired first) to match Z-Machine behavior
// Z-Machine drops items in reverse order of acquisition
const itemsToDrop = [...state.inventory].reverse();

for (const objId of itemsToDrop) {
  // ... drop logic ...
}
```

## Data Models

### Extended RecordingOptions

```typescript
export interface RecordingOptions {
  seed?: number;
  captureTimestamps?: boolean;
  preserveFormatting?: boolean;
  suppressRandomMessages?: boolean;  // New option
}
```

### GameState Testing Mode

```typescript
// In GameState class
private testingMode: boolean = false;

setTestingMode(enabled: boolean): void;
isTestingMode(): boolean;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Process Cleanup Completion
*For any* Z-Machine recording session, after the cleanup method completes, the spawned process SHALL no longer be running.
**Validates: Requirements 1.1**

### Property 2: Dark Room Output Format
*For any* dark room in the game, when the player looks, the output SHALL be exactly "It is pitch black. You are likely to be eaten by a grue." with no room name prefix.
**Validates: Requirements 2.1, 2.2**

### Property 3: Song Bird Suppression in Testing Mode
*For any* forest room daemon execution with testing mode enabled, the daemon SHALL NOT produce any song bird messages.
**Validates: Requirements 4.1**

### Property 4: Drop All Reverse Order
*For any* inventory state with multiple items, executing "drop all" SHALL drop items in reverse order of acquisition (last acquired first).
**Validates: Requirements 5.1**

## Error Handling

| Error Condition | Response |
|-----------------|----------|
| Process doesn't terminate gracefully | Force kill with SIGKILL after 1 second |
| Process already killed | Skip cleanup, return immediately |
| Invalid room state | Use default behavior |

## Testing Strategy

### Unit Tests

1. **Process Cleanup Tests**
   - Test cleanup waits for process termination
   - Test force kill on timeout
   - Test cleanup handles already-killed process

2. **Dark Room Display Tests**
   - Test dark room shows only darkness message
   - Test no room name in dark room output

3. **Trap Door Message Tests**
   - Test close from living room shows correct message
   - Test close from cellar shows different message

4. **Song Bird Suppression Tests**
   - Test testing mode suppresses messages
   - Test normal mode allows messages

5. **Drop All Order Tests**
   - Test items drop in reverse order
   - Test with various inventory sizes

### Property-Based Tests

1. **Dark Room Output Property**
   - Generate random dark room scenarios
   - Verify output matches expected format

2. **Drop All Order Property**
   - Generate random inventory states
   - Verify drop order is reverse of acquisition order

### Integration Tests

Run comparison sequences with normalization:
```bash
npx tsx scripts/record-and-compare.ts --batch --normalize --format text scripts/sequences/
```

Target: 90%+ aggregate parity on all sequences.

## Implementation Order

1. **Fix process cleanup** - Critical for batch runner reliability
2. **Fix dark room display** - Simple change, high impact
3. **Fix trap door message** - Simple change, specific fix
4. **Add song bird suppression** - Requires multiple file changes
5. **Fix drop all order** - Simple change, high impact
6. **Run verification tests** - Confirm 90%+ parity
