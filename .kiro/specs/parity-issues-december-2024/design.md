# Design Document: Fix Parity Issues (December 2024)

## Overview

This design addresses critical parity differences between the TypeScript Zork I implementation and the original Z-Machine (zork1.z3). The comparison system revealed 136 differences across 3 test sequences with only 0.74% aggregate parity.

The fixes are organized into three categories:
1. **Parser/Command Fixes** - Add missing commands ("all", "out")
2. **Game Logic Fixes** - Darkness enforcement, death/resurrection, container display
3. **Data/Display Fixes** - Object visibility, descriptions, room text

## Architecture

The fixes span multiple modules in the existing architecture:

```
src/
├── parser/
│   ├── parser.ts      # Add "all" object reference handling
│   └── vocabulary.ts  # Add "out" as direction synonym
├── game/
│   ├── actions.ts     # Fix TAKE/DROP for "all", darkness checks
│   ├── death.ts       # Fix resurrection state handling
│   ├── objects.ts     # Fix object descriptions
│   └── data/
│       ├── objects-complete.ts  # Fix object data (mailbox, sword names)
│       └── rooms-complete.ts    # Fix room descriptions
├── engine/
│   └── lighting.ts    # Enforce darkness restrictions
└── io/
    └── display.ts     # Fix container content formatting
```

## Components and Interfaces

### 1. Parser Enhancement for "all"

**File:** `src/parser/parser.ts`

Add special handling for "all" as a meta-object reference:

```typescript
interface ParsedCommand {
  verb: string;
  directObject?: GameObject;
  indirectObject?: GameObject;
  preposition?: string;
  directObjectName?: string;
  indirectObjectName?: string;
  rawInput?: string;
  isAllObjects?: boolean;  // NEW: Flag for "take all" / "drop all"
}

// In parse() method, detect "all" keyword
if (directObjectToken?.word.toUpperCase() === 'ALL') {
  return {
    verb: verbToken.word.toUpperCase(),
    isAllObjects: true,
    rawInput: originalInput
  };
}
```

### 2. Vocabulary Enhancement for "out"

**File:** `src/parser/vocabulary.ts`

Add "out" to direction synonyms:

```typescript
const DIRECTION_WORDS = [
  'NORTH', 'N', 'SOUTH', 'S', 'EAST', 'E', 'WEST', 'W',
  'UP', 'U', 'DOWN', 'D',
  'NE', 'NORTHEAST', 'NW', 'NORTHWEST',
  'SE', 'SOUTHEAST', 'SW', 'SOUTHWEST',
  'IN', 'ENTER', 'OUT', 'EXIT', 'LEAVE'  // Add OUT, EXIT, LEAVE
];
```

### 3. TakeAllAction and DropAllAction

**File:** `src/game/actions.ts`

New action handlers for "all" commands:

```typescript
export class TakeAllAction implements ActionHandler {
  execute(state: GameState): ActionResult {
    // Check darkness first
    if (!isRoomLit(state)) {
      return {
        success: false,
        message: "It's too dark to see!",
        stateChanges: []
      };
    }
    
    const objectsInRoom = state.getObjectsInCurrentRoom();
    const takeableObjects = objectsInRoom.filter(obj => 
      obj.hasFlag(ObjectFlag.TAKEBIT) && 
      !obj.hasFlag(ObjectFlag.NDESCBIT)
    );
    
    if (takeableObjects.length === 0) {
      return {
        success: false,
        message: "There's nothing here you can take.",
        stateChanges: []
      };
    }
    
    const messages: string[] = [];
    const stateChanges: StateChange[] = [];
    
    for (const obj of takeableObjects) {
      const result = new TakeAction().execute(state, obj.id);
      messages.push(`${obj.name}: ${result.message}`);
      stateChanges.push(...result.stateChanges);
    }
    
    return {
      success: true,
      message: messages.join('\n'),
      stateChanges
    };
  }
}

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
    const itemsToDrop = [...state.inventory]; // Copy to avoid mutation during iteration
    
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

### 4. Darkness Enforcement

**File:** `src/game/actions.ts` (TakeAction)

Add darkness check at the start of TakeAction.execute():

```typescript
execute(state: GameState, objectId: string): ActionResult {
  // Check darkness FIRST - before any object lookup
  if (!isRoomLit(state)) {
    return {
      success: false,
      message: "It's too dark to see!",
      stateChanges: []
    };
  }
  
  // ... rest of existing implementation
}
```

Same pattern for ExamineAction:

```typescript
execute(state: GameState, objectId: string): ActionResult {
  if (!isRoomLit(state)) {
    return {
      success: false,
      message: "It's too dark to see!",
      stateChanges: []
    };
  }
  // ... rest of implementation
}
```

### 5. Room Name in Darkness

**File:** `src/game/actions.ts` (formatRoomDescription)

Modify to show room name even in darkness:

```typescript
export function formatRoomDescription(room: any, state: GameState): string {
  let output = room.name + '\n';  // Always show room name
  
  if (!isRoomLit(state)) {
    output += getDarknessMessage();
    return output;
  }
  
  // ... rest of existing implementation
}
```

### 6. Container Content Display

**File:** `src/game/actions.ts` (formatRoomDescription)

Fix container content display to show indented under container:

```typescript
// When displaying container contents
if (obj.isContainer() && (obj.isOpen() || obj.hasFlag(ObjectFlag.TRANSBIT))) {
  const contents = state.getObjectsInContainer(obj.id);
  if (contents.length > 0) {
    output += `\nThe ${obj.name} contains:`;
    for (const item of contents) {
      output += `\n  ${getArticle(item.name)} ${item.name}`;
    }
  }
}
```

### 7. Death/Resurrection Fix

**File:** `src/game/death.ts`

Fix resurrectPlayer to properly handle state:

```typescript
function resurrectPlayer(state: GameState): void {
  // Move player to FOREST-1
  state.setCurrentRoom('FOREST-1');
  
  // Clear inventory - items are scattered
  const inventoryItems = [...state.inventory];
  for (const itemId of inventoryItems) {
    state.removeFromInventory(itemId);
    // Move item to random location or original location
    const obj = state.getObject(itemId);
    if (obj) {
      // Move lamp back to living room
      if (itemId === 'LAMP') {
        state.moveObject(itemId, 'LIVING-ROOM');
      } else {
        // Other items scattered
        state.moveObject(itemId, 'LIVING-ROOM');
      }
    }
  }
  
  // Reset trap door state
  const trapDoor = state.getObject('TRAP-DOOR');
  if (trapDoor) {
    trapDoor.removeFlag(ObjectFlag.TOUCHBIT);
  }
  
  // Clear death-related flags
  state.setGlobalVariable('DEAD', false);
  state.setGlobalVariable('ALWAYS_LIT', false);
}
```

### 8. Object Data Fixes

**File:** `src/game/data/objects-complete.ts`

Fix mailbox to have OPENBIT initially unset (closed):

```typescript
'MAILBOX': {
  id: 'MAILBOX',
  name: 'small mailbox',
  synonyms: ['MAILBOX', 'BOX'],
  adjectives: ['SMALL'],
  description: 'small mailbox',
  longDescription: 'There is a small mailbox here.',  // ADD this
  initialLocation: 'WEST-OF-HOUSE',
  flags: ['CONTBIT', 'TRYTAKEBIT'],  // No OPENBIT - starts closed
  capacity: 10
}
```

Fix sword naming for inventory display:

```typescript
'SWORD': {
  id: 'SWORD',
  name: 'sword',  // Changed from 'elvish sword'
  synonyms: ['SWORD', 'BLADE'],
  adjectives: ['ELVISH'],
  description: 'sword',
  firstDescription: 'Above the trophy case hangs an elvish sword of great antiquity.',
  longDescription: 'There is a sword here.',  // For when dropped
  // ...
}
```

### 9. Examine Command Fix

**File:** `src/game/actions.ts` (ExamineAction)

Fix to return proper description:

```typescript
execute(state: GameState, objectId: string): ActionResult {
  if (!isRoomLit(state)) {
    return {
      success: false,
      message: "It's too dark to see!",
      stateChanges: []
    };
  }
  
  const obj = state.getObject(objectId);
  if (!obj) {
    return {
      success: false,
      message: "You can't see that here.",
      stateChanges: []
    };
  }
  
  // Check for special examine text
  if (obj.examineText) {
    return { success: true, message: obj.examineText, stateChanges: [] };
  }
  
  // Check for container contents
  if (obj.isContainer() && obj.isOpen()) {
    const contents = state.getObjectsInContainer(obj.id);
    if (contents.length > 0) {
      const contentList = contents.map(c => c.name).join(', ');
      return { 
        success: true, 
        message: `The ${obj.name} contains: ${contentList}`, 
        stateChanges: [] 
      };
    }
    return { success: true, message: `The ${obj.name} is empty.`, stateChanges: [] };
  }
  
  // Default response
  return {
    success: true,
    message: `There's nothing special about the ${obj.name}.`,
    stateChanges: []
  };
}
```

## Data Models

### ParsedCommand Extension

```typescript
interface ParsedCommand {
  verb: string;
  directObject?: GameObject;
  indirectObject?: GameObject;
  preposition?: string;
  directObjectName?: string;
  indirectObjectName?: string;
  rawInput?: string;
  isAllObjects?: boolean;  // NEW: true for "take all" / "drop all"
}
```

### ObjectData Extension

```typescript
interface ObjectData {
  // ... existing fields
  longDescription?: string;  // Description when object is on floor
  examineText?: string;      // Specific text for EXAMINE command
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Container Object Visibility
*For any* container object in a room, if the container is visible (not NDESCBIT), then the room description SHALL include a description of that container.
**Validates: Requirements 1.1, 1.2**

### Property 2: Take All Completeness
*For any* room with takeable objects, executing "take all" SHALL result in all takeable objects being added to inventory, with each object listed in the response.
**Validates: Requirements 2.1, 2.2**

### Property 3: Drop All Completeness
*For any* non-empty inventory, executing "drop all" SHALL result in all inventory items being dropped to the current room, with each object listed in the response.
**Validates: Requirements 2.1**

### Property 4: Out Command Recognition
*For any* room, the command "out" SHALL be recognized as a direction command and SHALL NOT produce "I don't understand that command."
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Darkness Prevents Object Manipulation
*For any* dark room without a light source, attempting to TAKE or EXAMINE any object SHALL fail with "It's too dark to see!"
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Room Name Shown in Darkness
*For any* dark room, the room name SHALL appear in the output even when the room is dark.
**Validates: Requirements 4.4**

### Property 7: Resurrection Location Consistency
*For any* death event (before third death), resurrection SHALL place the player in FOREST-1.
**Validates: Requirements 5.2**

### Property 8: Container Content Display Format
*For any* open container with contents, the room description SHALL show contents indented under the container name, not as separate room objects.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 9: Examine Returns Description
*For any* object, the EXAMINE command SHALL return either the object's examineText, container contents, or "There's nothing special about the <object>." - never just the object name.
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 10: Dropped Object Description
*For any* object that has been dropped, the room description SHALL show the object's longDescription (floor description), not its firstDescription (original placement description).
**Validates: Requirements 8.2, 8.3**

### Property 11: Room Description Parity
*For any* room, the room description text SHALL match the Z-Machine output for that room.
**Validates: Requirements 9.1, 9.2, 9.3**

## Error Handling

| Error Condition | Response |
|-----------------|----------|
| Take in darkness | "It's too dark to see!" |
| Examine in darkness | "It's too dark to see!" |
| Take all with nothing | "There's nothing here you can take." |
| Drop all with empty inventory | "You are empty-handed." |
| Out with no exit | "You can't go that way." |
| Object not found | "You can't see any <object> here!" |

## Testing Strategy

### Unit Tests
- Test "take all" with various room contents
- Test "drop all" with various inventory states
- Test "out" command parsing
- Test darkness checks in TakeAction and ExamineAction
- Test container content display formatting
- Test resurrection state handling

### Property-Based Tests
Using Vitest with fast-check:

1. **Container Visibility Property** - Generate random rooms with containers, verify descriptions include container text
2. **Take All Property** - Generate random room contents, verify all takeable items are taken
3. **Drop All Property** - Generate random inventory, verify all items are dropped
4. **Darkness Property** - Generate random dark room states, verify take/examine fail
5. **Examine Property** - Generate random objects, verify examine never returns just object name

### Integration Tests
Run the comparison sequences after fixes:
```bash
npx tsx scripts/record-and-compare.ts --batch --format text scripts/sequences/
```

Target: 95%+ parity on all three sequences.

## Implementation Order

1. **Parser fixes** (vocabulary, "all" handling) - Unblocks command testing
2. **Darkness enforcement** - Critical game mechanic
3. **Take/Drop all actions** - Common player commands
4. **Container display** - Visual parity
5. **Examine fix** - Common command
6. **Death/resurrection** - Game flow
7. **Object data fixes** - Final parity polish
8. **Room description fixes** - Final parity polish
