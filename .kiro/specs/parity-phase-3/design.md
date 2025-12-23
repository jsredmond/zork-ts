# Design Document: Parity Phase 3 - Full Parity

## Overview

This design addresses the remaining parity differences to achieve 95%+ content parity between the TypeScript Zork I implementation and the original Z-Machine game.

**Current State:** 76.47% aggregate parity
**Target State:** 95%+ aggregate parity

The fixes are organized into categories:
1. **Deterministic Testing** - Seed support for reproducible combat
2. **Room Description Fixes** - Mailbox, object order, rug state
3. **Sword Glow System** - Enemy proximity warnings
4. **Comparison Tool Enhancements** - Header normalization

## Architecture

The fixes span these modules:

```
src/
├── game/
│   ├── state.ts           # Add seeded RNG support
│   ├── rooms.ts           # Fix room description generation
│   └── data/
│       └── rooms-complete.ts  # Fix object ordering
├── engine/
│   ├── combat.ts          # Use seeded RNG
│   └── troll.ts           # Add sword glow messages
├── testing/
│   └── recording/
│       ├── comparator.ts  # Add header normalization
│       └── tsRecorder.ts  # Pass seed to game
└── scripts/
    └── record-and-compare.ts  # Add --seed flag
```

## Components and Interfaces

### 1. Seeded Random Number Generator

**File:** `src/game/state.ts`

Add a seeded RNG to GameState for deterministic testing:

```typescript
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  // Linear congruential generator (matches common implementations)
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  
  // Random integer in range [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// In GameState class:
private rng: SeededRandom | null = null;

setSeed(seed: number): void {
  this.rng = new SeededRandom(seed);
}

random(): number {
  return this.rng ? this.rng.next() : Math.random();
}

randomInt(min: number, max: number): number {
  return this.rng ? this.rng.nextInt(min, max) : Math.floor(Math.random() * (max - min + 1)) + min;
}
```

### 2. Mailbox Display Fix

**File:** `src/game/data/rooms-complete.ts`

The mailbox should appear in the West of House room description. Update the room's objects array to include the mailbox:

```typescript
'WEST-OF-HOUSE': {
  id: 'WEST-OF-HOUSE',
  name: 'West of House',
  description: 'West of House',
  longDescription: 'You are standing in an open field west of a white house, with a boarded front door.',
  exits: [...],
  flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
  objects: ['MAILBOX'],  // Add mailbox to room objects
  globalObjects: ['WHITE-HOUSE', 'BOARD', 'FOREST']
}
```

The mailbox object should have proper description flags to show "There is a small mailbox here."

### 3. Object Order Fix

**File:** `src/game/rooms.ts`

Objects should be displayed in a consistent order matching Z-Machine. The order is determined by the object's position in the room's objects array and the order objects were added to the game.

```typescript
// In Room.getDescription() or similar:
getObjectDescriptions(state: GameState): string[] {
  const descriptions: string[] = [];
  
  // Get objects in room, sorted by their original definition order
  const roomObjects = this.objects
    .map(id => state.getObject(id))
    .filter(obj => obj && obj.shouldDescribe())
    .sort((a, b) => {
      // Sort by object definition order (lower index = earlier in game data)
      return getObjectDefinitionOrder(a.id) - getObjectDefinitionOrder(b.id);
    });
  
  for (const obj of roomObjects) {
    descriptions.push(obj.getFirstDescription() || obj.getDescription());
  }
  
  return descriptions;
}
```

### 4. Rug State in Living Room Description

**File:** `src/game/data/rooms-complete.ts` and `src/game/rooms.ts`

The living room description should dynamically reflect the rug and trap door state:

```typescript
// In living room description generation:
function getLivingRoomDescription(state: GameState): string {
  const base = 'You are in the living room. There is a doorway to the east, a wooden door with strange gothic lettering to the west, which appears to be nailed shut, a trophy case';
  
  const rugMoved = state.getFlag('RUG-MOVED');
  const trapDoorOpen = state.getObject('TRAP-DOOR')?.hasFlag(ObjectFlag.OPENBIT);
  
  if (!rugMoved) {
    return base + ', and a large oriental rug in the center of the room.';
  } else if (trapDoorOpen) {
    return base + ', and a rug lying beside an open trap door.';
  } else {
    return base + ', and a closed trap door at your feet.';
  }
}
```

### 5. Sword Glow Messages

**File:** `src/engine/troll.ts`

Add sword glow messages when near enemies:

```typescript
// Check for sword glow on room entry
function checkSwordGlow(state: GameState, newRoom: string): string | null {
  const sword = state.getObject('SWORD');
  if (!sword || sword.location !== 'PLAYER') {
    return null;
  }
  
  const troll = state.getObject('TROLL');
  const trollRoom = troll?.location;
  
  if (trollRoom === newRoom) {
    // In same room as troll
    return 'Your sword has begun to glow very brightly.';
  }
  
  // Check adjacent rooms
  const currentRoom = state.getRoom(newRoom);
  const adjacentRooms = currentRoom?.exits.map(e => e.destination) || [];
  
  if (adjacentRooms.includes(trollRoom)) {
    return 'Your sword is glowing with a faint blue glow.';
  }
  
  return null;
}

// On troll death
function onTrollDeath(state: GameState): string {
  return 'Almost as soon as the troll breathes his last breath, a cloud of sinister black fog envelops him, and when the fog lifts, the carcass has disappeared.\nYour sword is no longer glowing.';
}
```

### 6. Header Normalization

**File:** `src/testing/recording/comparator.ts`

Add header stripping to the comparison tool:

```typescript
/**
 * Strip game header/intro text from output
 * Removes version info, copyright, etc.
 */
stripGameHeader(output: string): string {
  const lines = output.split('\n');
  const filtered: string[] = [];
  let inHeader = true;
  
  for (const line of lines) {
    // Header patterns to skip
    if (inHeader) {
      if (line.includes('ZORK I:') ||
          line.includes('Copyright') ||
          line.includes('Infocom') ||
          line.includes('Release') ||
          line.includes('Serial number') ||
          line.includes('Revision') ||
          line.includes('interactive fiction') ||
          line.includes('Loading') ||
          line.includes('formatting')) {
        continue;
      }
      // First non-header line ends header section
      if (line.trim() !== '') {
        inHeader = false;
      }
    }
    filtered.push(line);
  }
  
  return filtered.join('\n');
}
```

## Data Models

### SeededRandom

```typescript
interface SeededRandom {
  seed: number;
  next(): number;
  nextInt(min: number, max: number): number;
}
```

### Extended ComparisonOptions

```typescript
interface ComparisonOptions {
  normalizeWhitespace: boolean;
  ignoreCaseInMessages: boolean;
  knownVariations: string[];
  toleranceThreshold: number;
  stripStatusBar: boolean;
  normalizeLineWrapping: boolean;
  stripGameHeader: boolean;  // New option
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Seeded RNG Reproducibility
*For any* seed value, running the same command sequence twice with that seed SHALL produce identical combat outcomes.
**Validates: Requirements 1.1, 1.3**

### Property 2: Object Order Consistency
*For any* room with multiple objects, the objects SHALL be listed in a consistent order matching the Z-Machine object definition order.
**Validates: Requirements 3.1**

### Property 3: Header Normalization
*For any* transcript containing game header text, the stripGameHeader function SHALL remove all header lines while preserving gameplay content.
**Validates: Requirements 7.1**

### Property 4: Living Room Description States
*For any* combination of rug-moved and trap-door-open states, the living room description SHALL accurately reflect the current state.
**Validates: Requirements 4.1, 4.2, 4.3**

## Error Handling

| Error Condition | Response |
|-----------------|----------|
| Invalid seed value | Use default Math.random() |
| Missing object in room | Skip object in description |
| Unknown room state | Use default description |

## Testing Strategy

### Unit Tests

1. **Seeded RNG Tests**
   - Test same seed produces same sequence
   - Test different seeds produce different sequences
   - Test nextInt range bounds

2. **Mailbox Display Tests**
   - Test initial room shows mailbox
   - Test look command shows mailbox

3. **Object Order Tests**
   - Test attic shows rope before knife
   - Test kitchen shows bottle before sack

4. **Living Room Description Tests**
   - Test rug not moved state
   - Test rug moved, door closed state
   - Test rug moved, door open state

5. **Sword Glow Tests**
   - Test glow when entering troll room
   - Test glow when adjacent to troll
   - Test no glow when far from troll
   - Test glow stops when troll dies

6. **Header Normalization Tests**
   - Test header lines are stripped
   - Test gameplay content is preserved

### Integration Tests

Run comparison sequences with seed and normalization:
```bash
npx tsx scripts/record-and-compare.ts --batch --normalize --seed 12345 --format text scripts/sequences/
```

Target: 95%+ content parity on all sequences.

## Implementation Order

1. **Add seeded RNG** - Foundation for deterministic testing
2. **Fix mailbox display** - Simple room data fix
3. **Fix object order** - Room description generation
4. **Fix living room description** - Dynamic state-based description
5. **Add sword glow messages** - Enemy proximity system
6. **Add header normalization** - Comparison tool enhancement
7. **Run verification tests** - Confirm 95%+ parity
