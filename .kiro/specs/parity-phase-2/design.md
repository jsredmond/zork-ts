# Design Document: Parity Phase 2 - Critical Fixes

## Overview

This design addresses the remaining critical parity issues discovered during Phase 1 verification. The primary blockers are:

1. **Death/Resurrection Bug** - Game state corruption after death causes cascade failures
2. **Comparison Methodology** - Status bar and line wrapping differences inflate difference counts
3. **Minor Behavioral Differences** - "take all" in darkness, "drop all" order

The fixes are organized into two categories:
1. **Game Logic Fixes** - Death/resurrection, darkness handling
2. **Tooling Fixes** - Comparison normalization for accurate parity measurement

## Architecture

The fixes span these modules:

```
src/
├── game/
│   ├── death.ts           # Fix resurrection state handling
│   └── actions.ts         # Fix darkness entry display, take all in dark
├── testing/
│   └── recording/
│       ├── comparator.ts  # Add normalization options
│       └── types.ts       # Add normalization types
└── scripts/
    └── record-and-compare.ts  # Add --normalize flag
```

## Components and Interfaces

### 1. Death/Resurrection System Fix

**File:** `src/game/death.ts`

The current `resurrectPlayer` function has issues:
1. It doesn't properly preserve puzzle state
2. It may corrupt room connections
3. The lamp handling is correct but needs verification

**Fix Strategy:**

```typescript
/**
 * Resurrect player after death
 * Based on JIGS-UP routine from 1actions.zil
 * 
 * Key behaviors:
 * 1. Move player to FOREST-1
 * 2. Scatter inventory items appropriately
 * 3. Preserve puzzle state (trap door, rug, defeated enemies)
 * 4. Kill all daemons/interrupts
 * 5. Turn off lamp if lit
 */
function resurrectPlayer(state: GameState): void {
  // 1. Move player to FOREST-1
  state.setCurrentRoom('FOREST-1');
  
  // 2. Turn off lamp if lit (before scattering)
  const lamp = state.getObject('LAMP');
  if (lamp && lamp.hasFlag(ObjectFlag.ONBIT)) {
    lamp.flags.delete(ObjectFlag.ONBIT);
  }
  
  // 3. Clear trap door TOUCHBIT (allows re-entry to cellar)
  const trapDoor = state.getObject('TRAP-DOOR');
  if (trapDoor) {
    trapDoor.flags.delete(ObjectFlag.TOUCHBIT);
  }
  
  // 4. Clear P-CONT (parser continuation)
  state.setGlobalVariable('P-CONT', null);
  
  // 5. Scatter inventory items
  randomizeObjects(state);
  
  // 6. Kill all interrupts/daemons
  killInterrupts(state);
  
  // 7. Ensure room connections are intact
  // (No action needed - room data is static)
}
```

**Key Changes:**
- Turn off lamp before scattering (prevents lit lamp in wrong location)
- Preserve trap door state correctly
- Ensure randomizeObjects doesn't corrupt object locations

### 2. Darkness Entry Display Fix

**File:** `src/game/actions.ts`

Current behavior when entering dark room:
```
It is pitch black. You are likely to be eaten by a grue.
```

Expected Z-Machine behavior:
```
You have moved into a dark place.
It is pitch black. You are likely to be eaten by a grue.
```

**Fix in movement handling:**

```typescript
function handleMovement(state: GameState, direction: string): ActionResult {
  // ... existing movement logic ...
  
  // After successful movement, check if new room is dark
  const newRoom = state.getCurrentRoom();
  const isLit = isRoomLit(state);
  
  if (!isLit) {
    // Dark room entry - show special message
    return {
      success: true,
      message: '\nYou have moved into a dark place.\nIt is pitch black. You are likely to be eaten by a grue.',
      stateChanges: [{ type: 'move', roomId: newRoom.id }]
    };
  }
  
  // ... normal room description ...
}
```

**Look command in darkness:**

```typescript
function handleLook(state: GameState): ActionResult {
  const room = state.getCurrentRoom();
  const isLit = isRoomLit(state);
  
  if (!isLit) {
    // Show room name, then darkness message
    return {
      success: true,
      message: `${room.name}\nIt is pitch black. You are likely to be eaten by a grue.`,
      stateChanges: []
    };
  }
  
  // ... normal room description ...
}
```

### 3. "take all" in Darkness Fix

**File:** `src/game/actions.ts`

Current behavior:
```
> take all
It's too dark to see!
```

Expected Z-Machine behavior:
```
> take all
There's nothing here you can take.
```

**Fix in TakeAllAction:**

```typescript
export class TakeAllAction implements ActionHandler {
  execute(state: GameState): ActionResult {
    // In darkness, return "nothing to take" message (matches Z-Machine)
    // The logic is: you can't see anything, so there's nothing to take
    if (!isRoomLit(state)) {
      return {
        success: false,
        message: "There's nothing here you can take.",
        stateChanges: []
      };
    }
    
    // ... rest of implementation ...
  }
}
```

### 4. "drop all" Order Fix

**File:** `src/game/actions.ts`

Current behavior drops items in reverse order. Fix to drop in inventory order:

```typescript
export class DropAllAction implements ActionHandler {
  execute(state: GameState): ActionResult {
    if (state.inventory.length === 0) {
      return {
        success: false,
        message: "You are empty-handed.",
        stateChanges: []
      };
    }
    
    const messages: string[] = [];
    const stateChanges: StateChange[] = [];
    
    // Drop in inventory order (first to last), not reverse
    const itemsToDrop = [...state.inventory]; // Copy to avoid mutation
    
    for (const objId of itemsToDrop) {
      const obj = state.getObject(objId);
      if (obj) {
        const result = new DropAction().execute(state, objId);
        messages.push(`${obj.name}: ${result.message}`);
        stateChanges.push(...result.stateChanges);
      }
    }
    
    return {
      success: true,
      message: messages.join('\n'),
      stateChanges
    };
  }
}
```

### 5. Comparison Tool Normalization

**File:** `src/testing/recording/comparator.ts`

Add content normalization that strips status bar and normalizes line wrapping:

```typescript
interface NormalizationOptions {
  stripStatusBar: boolean;      // Remove Z-Machine status bar lines
  normalizeLineWrapping: boolean; // Collapse line wrapping differences
  normalizeWhitespace: boolean;   // Existing option
}

export class TranscriptComparator {
  /**
   * Strip Z-Machine status bar from output
   * Status bar format: "Room Name                                    Score: X        Moves: Y"
   */
  private stripStatusBar(output: string): string {
    const lines = output.split('\n');
    const filtered = lines.filter(line => {
      // Status bar pattern: room name followed by Score: and Moves:
      const statusBarPattern = /^\s*\S.*\s+Score:\s*\d+\s+Moves:\s*\d+\s*$/;
      return !statusBarPattern.test(line);
    });
    return filtered.join('\n');
  }
  
  /**
   * Normalize line wrapping by joining lines that were wrapped
   * Z-Machine wraps at ~80 chars, TypeScript doesn't wrap
   */
  private normalizeLineWrapping(output: string): string {
    // Join lines that don't end with sentence-ending punctuation
    // and don't start a new paragraph
    const lines = output.split('\n');
    const result: string[] = [];
    let currentLine = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Empty line = paragraph break
      if (trimmed === '') {
        if (currentLine) {
          result.push(currentLine);
          currentLine = '';
        }
        result.push('');
        continue;
      }
      
      // If current line is empty, start new line
      if (!currentLine) {
        currentLine = trimmed;
        continue;
      }
      
      // Check if previous line ends with sentence-ending punctuation
      const endsWithPunctuation = /[.!?"]$/.test(currentLine);
      
      // If previous line ends with punctuation, start new line
      if (endsWithPunctuation) {
        result.push(currentLine);
        currentLine = trimmed;
      } else {
        // Join with space (wrapped line)
        currentLine += ' ' + trimmed;
      }
    }
    
    if (currentLine) {
      result.push(currentLine);
    }
    
    return result.join('\n');
  }
  
  /**
   * Normalize output for content comparison
   */
  normalizeForContent(output: string, options: NormalizationOptions): string {
    let normalized = output;
    
    if (options.stripStatusBar) {
      normalized = this.stripStatusBar(normalized);
    }
    
    if (options.normalizeLineWrapping) {
      normalized = this.normalizeLineWrapping(normalized);
    }
    
    if (options.normalizeWhitespace) {
      normalized = this.normalizeOutput(normalized);
    }
    
    return normalized;
  }
}
```

**File:** `scripts/record-and-compare.ts`

Add `--normalize` flag:

```typescript
const { values, positionals } = parseArgs({
  options: {
    // ... existing options ...
    normalize: {
      type: 'boolean',
      short: 'n',
      default: false
    }
  }
});

// When comparing, use normalization if flag is set
if (options.normalize) {
  comparator.setOptions({
    stripStatusBar: true,
    normalizeLineWrapping: true,
    normalizeWhitespace: true
  });
}
```

## Data Models

### NormalizationOptions

```typescript
interface NormalizationOptions {
  stripStatusBar: boolean;
  normalizeLineWrapping: boolean;
  normalizeWhitespace: boolean;
}
```

### Extended ComparisonOptions

```typescript
interface ComparisonOptions {
  normalizeWhitespace: boolean;
  ignoreCaseInMessages: boolean;
  knownVariations: string[];
  toleranceThreshold: number;
  // New options
  stripStatusBar?: boolean;
  normalizeLineWrapping?: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Resurrection Location Consistency
*For any* death event (before third death), resurrection SHALL place the player in FOREST-1.
**Validates: Requirements 1.2**

### Property 2: Inventory Scattering on Death
*For any* inventory state at death, after resurrection the player's inventory SHALL be empty and all items SHALL be in valid room locations.
**Validates: Requirements 1.3, 1.4**

### Property 3: Lamp Handling on Death
*For any* death event where player holds the lamp, after resurrection the lamp SHALL be in LIVING-ROOM and turned off.
**Validates: Requirements 1.5, 6.1, 6.2, 6.3**

### Property 4: Game State Integrity After Death
*For any* death and resurrection sequence, all room connections SHALL remain valid and navigable.
**Validates: Requirements 1.6**

### Property 5: Dark Room Entry Message
*For any* movement into a dark room, the output SHALL contain "You have moved into a dark place." before the darkness warning.
**Validates: Requirements 2.1**

### Property 6: Take All in Darkness Response
*For any* "take all" command in a dark room, the response SHALL be "There's nothing here you can take."
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Drop All Order
*For any* "drop all" command with multiple items, items SHALL be dropped in inventory order (first to last).
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 8: Status Bar Stripping
*For any* Z-Machine output containing a status bar line, the stripStatusBar function SHALL remove that line.
**Validates: Requirements 5.1**

### Property 9: Line Wrapping Normalization
*For any* two outputs that differ only in line wrapping, after normalization they SHALL be identical.
**Validates: Requirements 5.2**

### Property 10: Puzzle State Preservation
*For any* death event, the trap door state, rug state, and defeated enemy states SHALL be preserved.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

## Error Handling

| Error Condition | Response |
|-----------------|----------|
| Death while already dead | Game over message |
| Third death | Permanent game over |
| Take all in darkness | "There's nothing here you can take." |
| Drop all with empty inventory | "You are empty-handed." |
| Invalid room after resurrection | Should never happen (room data is static) |

## Testing Strategy

### Unit Tests

1. **Death/Resurrection Tests**
   - Test resurrection places player in FOREST-1
   - Test inventory is scattered correctly
   - Test lamp is moved to LIVING-ROOM and turned off
   - Test puzzle state is preserved
   - Test third death ends game

2. **Darkness Tests**
   - Test dark room entry message
   - Test "take all" in darkness response
   - Test "look" in darkness shows room name

3. **Drop All Tests**
   - Test items dropped in correct order
   - Test empty inventory response

4. **Comparator Tests**
   - Test status bar stripping
   - Test line wrapping normalization
   - Test combined normalization

### Integration Tests

Run comparison sequences with normalization:
```bash
npx tsx scripts/record-and-compare.ts --batch --normalize --format text scripts/sequences/
```

Target: 95%+ content parity on all sequences.

### Property-Based Tests

Using Vitest with fast-check:

1. **Resurrection Property** - Generate random game states, trigger death, verify resurrection location
2. **Inventory Scattering Property** - Generate random inventories, trigger death, verify all items in valid locations
3. **Normalization Property** - Generate outputs with/without status bar, verify stripping works

## Implementation Order

1. **Fix death/resurrection** - Critical blocker
2. **Fix darkness entry display** - Behavioral parity
3. **Fix "take all" in darkness** - Behavioral parity
4. **Fix "drop all" order** - Behavioral parity
5. **Add comparison normalization** - Accurate measurement
6. **Run verification tests** - Confirm 95%+ parity
