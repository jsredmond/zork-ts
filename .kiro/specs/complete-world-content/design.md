# Design Document: Complete World Content

## Overview

This design document outlines the approach for completing the Zork I world content by extracting and adding all remaining rooms and objects from the original ZIL source. The game engine is complete and tested; this work is purely data extraction and entry using the existing factory system.

## Architecture

The existing factory system handles all instantiation:
- `roomFactory.ts` - Converts RoomData to RoomImpl instances
- `objectFactory.ts` - Converts ObjectData to GameObjectImpl instances  
- `gameFactory.ts` - Orchestrates complete game world creation

No architectural changes needed - only data file updates.

## Data Extraction Strategy

### Source Material
- **1dungeon.zil** (lines 1-2661) - Contains all room and object definitions
- **Existing extraction** - docs/CONTENT_EXTRACTION.md documents the structure

### Extraction Process
1. Read room definitions from 1dungeon.zil sequentially
2. Extract: id, name, description (LDESC), exits, flags, global objects
3. Format as TypeScript RoomData objects
4. Add to src/game/data/rooms-complete.ts

Same process for objects with their properties.

## Room Categories to Complete

Based on CONTENT_EXTRACTION.md, we need to add:

### Currently Missing (~66 rooms):
- **Reservoir Area** (3 more rooms): RESERVOIR-SOUTH, STREAM-VIEW, IN-STREAM
- **Mirror Rooms** (7 rooms): MIRROR-ROOM-1, MIRROR-ROOM-2, SMALL-CAVE, TINY-CAVE, COLD-PASSAGE, NARROW-PASSAGE, WINDING-PASSAGE, TWISTING-PASSAGE, ATLANTIS-ROOM
- **Round Room Area** (4 more rooms): DEEP-CANYON, DAMP-CAVE, LOUD-ROOM, NS-PASSAGE, CHASM-ROOM
- **Hades** (2 rooms): ENTRANCE-TO-HADES, LAND-OF-LIVING-DEAD
- **Temple/Egypt** (5 rooms): ENGRAVINGS-CAVE, EGYPT-ROOM, DOME-ROOM, TORCH-ROOM, NORTH-TEMPLE, SOUTH-TEMPLE
- **Dam Area** (3 rooms): DAM-ROOM, DAM-LOBBY, MAINTENANCE-ROOM
- **River Area** (13 rooms): DAM-BASE, RIVER-1 through RIVER-5, WHITE-CLIFFS-NORTH, WHITE-CLIFFS-SOUTH, SHORE, SANDY-BEACH, SANDY-CAVE, ARAGAIN-FALLS, ON-RAINBOW, END-OF-RAINBOW, CANYON-BOTTOM, CLIFF-MIDDLE
- **Coal Mine** (14 rooms): MINE-ENTRANCE, SQUEEKY-ROOM, BAT-ROOM, SHAFT-ROOM, SMELLY-ROOM, GAS-ROOM, LADDER-TOP, LADDER-BOTTOM, DEAD-END-5, TIMBER-ROOM, LOWER-SHAFT, MACHINE-ROOM, MINE-1 through MINE-4, SLIDE-ROOM
- **Cyclops Area** (2 more rooms): CYCLOPS-ROOM, STRANGE-PASSAGE, TREASURE-ROOM
- **Miscellaneous** (remaining rooms to reach 110 total)

## Object Categories to Complete

Based on CONTENT_EXTRACTION.md, we need to add (~38 objects):

### Tools & Equipment
- RUSTY-KNIFE, STILETTO, TOOL-CHEST, TUBE (toothpaste)

### Containers  
- BUOY, RAISED-BASKET, MACHINE, INFLATED-BOAT

### Readable Items
- OWNERS-MANUAL, BOAT-LABEL, BOOK (black book)

### Consumables
- Additional food/drink items

### Scenery Objects
- RIVER, CRACK, various doors and windows
- PEDESTAL, ALTAR, and other room-specific scenery

### NPCs
- GHOSTS, BAT

### Puzzle-Specific Objects
- Items needed for dam, mirror, rainbow, rope/basket puzzles

## Implementation Approach

### Phase 1: Extract Remaining Rooms
1. Open 1dungeon.zil
2. Find each room definition (search for `<ROOM`)
3. Extract all properties
4. Add to rooms-complete.ts following existing format

### Phase 2: Extract Remaining Objects  
1. Continue through 1dungeon.zil
2. Find each object definition (search for `<OBJECT`)
3. Extract all properties
4. Add to objects-complete.ts following existing format

### Phase 3: Verification
1. Run content verification script
2. Check room count = 110+
3. Check object count = 100+
4. Validate all connections
5. Verify all treasures present

### Phase 4: Testing
1. Run full test suite (should still pass)
2. Manual playthrough testing
3. Verify game is completable

## Data Format

Rooms follow this structure:
```typescript
'ROOM-ID': {
  id: 'ROOM-ID',
  name: 'Display Name',
  description: 'Short name',
  longDescription: 'Full description text',
  exits: [
    { direction: 'NORTH', destination: 'OTHER-ROOM' },
    { direction: 'SOUTH', destination: 'ANOTHER-ROOM', condition: 'FLAG-NAME' }
  ],
  flags: ['RLANDBIT', 'ONBIT'],
  globalObjects: ['OBJECT-ID'],
}
```

Objects follow this structure:
```typescript
'OBJECT-ID': {
  id: 'OBJECT-ID',
  name: 'display name',
  synonyms: ['WORD1', 'WORD2'],
  adjectives: ['ADJ1'],
  description: 'short desc',
  longDescription: 'detailed desc',
  initialLocation: 'ROOM-ID',
  flags: ['TAKEBIT', 'CONTBIT'],
  size: 10,
  capacity: 20,
  value: 5,
  treasureValue: 10
}
```

## Validation

The existing verification system will validate:
- All rooms exist and are connected
- All objects have valid locations
- No broken references
- All treasures are present

## Testing Strategy

No new tests needed - existing 678 tests cover all systems.

Content verification will ensure:
- Room count matches expected (110+)
- Object count matches expected (100+)
- All connections valid
- Game is completable
