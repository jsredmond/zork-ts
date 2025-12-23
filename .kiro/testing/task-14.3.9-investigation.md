# Task 14.3.9: Object Ordering Investigation

## Issue Description
Objects in rooms are displayed in incorrect order compared to the original game.

**Example - Living Room:**
- **Expected order:** SWORD, then LAMP
- **Actual order:** LAMP, then SWORD, then MATCH

## Investigation Findings

### 1. ZIL Source Definition Order
From `1dungeon.zil`:
- LAMP: line 545
- MATCH: line 614 (initially in DAM-LOBBY, not LIVING-ROOM)
- SWORD: line 915

### 2. TypeScript Data Order
From `src/game/data/objects-complete.ts`:
- LAMP: line 382
- SWORD: line 433
- MATCH: line 718

Both match the ZIL source order (LAMP before SWORD).

### 3. Current Display Mechanism
Objects are displayed in the order they appear in `room.objects` array, which is populated by `placeObjectsInRooms()` iterating over the objects Map in insertion order.

### 4. Root Cause Analysis
The original game displays objects in a different order than their definition order. Possible explanations:
1. **Reverse order**: Original game might display objects in reverse definition order
2. **Explicit ordering**: Objects might have an implicit ordering property in ZIL
3. **Hash table ordering**: ZIL's internal data structures might have different iteration order

### 5. Additional Data Issue Found
**MATCH object location error:**
- ZIL source: `(IN DAM-LOBBY)`
- Our data: `initialLocation: 'LIVING-ROOM'`

This is a separate data extraction error that should be fixed.

## Proposed Solutions

### Option 1: Add Explicit Order Property
Add an `order` or `displayOrder` property to each object in the data:
```typescript
'SWORD': {
  id: 'SWORD',
  name: 'sword',
  initialLocation: 'LIVING-ROOM',
  displayOrder: 1,  // Display first
  // ...
},
'LAMP': {
  id: 'LAMP',
  name: 'brass lantern',
  initialLocation: 'LIVING-ROOM',
  displayOrder: 2,  // Display second
  // ...
}
```

Then sort objects by `displayOrder` before displaying.

### Option 2: Use ZIL Source Line Numbers
Extract the line number from the ZIL source for each object and use that for ordering (possibly reversed).

### Option 3: Manual Room-Specific Ordering
Define explicit object order for each room in the room data:
```typescript
'LIVING-ROOM': {
  id: 'LIVING-ROOM',
  name: 'Living Room',
  objectDisplayOrder: ['SWORD', 'LAMP', 'TROPHY-CASE', ...],
  // ...
}
```

## Impact Assessment
- **Affected transcripts:** 03-trap-door (95.9%), 04-lamp-darkness (97.1%)
- **Similarity loss:** ~3-5% (cosmetic issue)
- **Functional impact:** None - game logic is unaffected
- **Priority:** Low (marked as deferred in task list)

## Recommendation
**DEFER** this task as specified in the task description. The issue is:
1. Purely cosmetic (no functional impact)
2. Low priority (3-5% similarity loss)
3. Requires significant effort to implement correctly
4. Already marked as "Deferred - low priority cosmetic issue" in tasks.md

The task should remain deferred until higher-priority issues are resolved.

## Next Steps (if/when implemented)
1. Fix MATCH object location (DAM-LOBBY, not LIVING-ROOM)
2. Determine exact ordering mechanism from original game
3. Implement chosen solution (likely Option 1: explicit order property)
4. Update all object data with correct display orders
5. Modify `formatRoomDescription()` to sort objects before display
6. Re-run affected transcripts to verify fix

## Status
**INVESTIGATED and DEFERRED** per task specification.
