# Egg/Nest Puzzle Investigation

## Current Status
- Transcript: 28-egg-nest.json
- Current similarity: 81.3%
- Priority: High

## Problem Analysis

### Transcript Issues
The current transcript (28-egg-nest.json) doesn't actually test the egg/nest puzzle. It shows:
1. Player navigating to troll room
2. Player dying to troll
3. Never reaching the egg/nest

This transcript is testing troll combat, not egg/nest puzzle.

### Expected Egg/Nest Puzzle Behavior (from ZIL)

The egg/nest puzzle is located in UP-A-TREE room (accessed via PATH → UP).

**Key behaviors from 1actions.zil TREE-ROOM:**

1. **Dropping nest with egg inside:**
   ```zil
   (<AND <EQUAL? ,PRSO ,NEST> <IN? ,EGG ,NEST>>
    <TELL "The nest falls to the ground, and the egg spills out of it, seriously damaged." CR>
    <REMOVE-CAREFULLY ,EGG>
    <MOVE ,BROKEN-EGG ,PATH>)
   ```

2. **Dropping egg from tree:**
   ```zil
   (<EQUAL? ,PRSO ,EGG>
    <TELL "The egg falls to the ground and springs open, seriously damaged.">
    <MOVE ,EGG ,PATH>
    <BAD-EGG>
    <CRLF>)
   ```

3. **Dropping other objects:**
   ```zil
   (<NOT <EQUAL? ,PRSO ,WINNER ,TREE>>
    <MOVE ,PRSO ,PATH>
    <TELL "The " D ,PRSO " falls to the ground." CR>)
   ```

**BAD-EGG routine:**
- Moves BROKEN-EGG to egg's location
- Removes EGG object
- If CANARY is in EGG, shows broken canary description
- Otherwise removes BROKEN-CANARY

### Current TypeScript Implementation

**Tree behavior (src/game/specialBehaviors.ts lines 1100-1130):**
```typescript
const treeBehavior: SpecialBehavior = {
  objectId: 'TREE',
  condition: () => true,
  handler: (verb: string, state: GameState, directObject?: string) => {
    if (verb === 'DROP' && directObject === 'EGG') {
      const nest = state.getObject('NEST');
      const egg = state.getObject('EGG');
      
      if (egg && nest && egg.location === nest.id) {
        // Egg falls and breaks
        const bauble = state.getObject('BAUBLE');
        if (bauble) {
          state.moveObject('BAUBLE', state.currentRoom);
        }
        state.removeObject('EGG');
        return 'The egg falls to the ground and springs open, seriously damaged. The bauble falls to the ground.';
      }
    }
    
    return null;
  }
};
```

### Issues Identified

1. **Special behaviors not called during DROP:**
   - The DROP action (src/game/actions.ts) doesn't check for special behaviors
   - Tree behavior is registered but never invoked

2. **Incomplete tree behavior:**
   - Only handles dropping egg
   - Doesn't handle dropping nest with egg inside
   - Doesn't handle dropping other objects from tree
   - Doesn't properly implement BAD-EGG logic

3. **Missing room-specific DROP handling:**
   - Need to check if player is in UP-A-TREE room
   - Need to move dropped objects to PATH room (ground below)
   - Need to handle egg/nest special cases

4. **Wrong transcript:**
   - Current transcript doesn't test egg/nest puzzle at all
   - Need to create proper transcript showing:
     - Climbing tree
     - Taking egg from nest
     - Dropping nest
     - Climbing down with egg

## Required Fixes

### 1. Add special behavior checking to DROP action
Modify `src/game/actions.ts` DropAction to:
- Check for special behaviors before dropping
- Pass current room context to behavior handler

### 2. Implement proper TREE-ROOM action
Create room-specific action handler for UP-A-TREE that:
- Intercepts DROP commands
- Handles nest+egg, egg alone, and other objects
- Moves objects to PATH room (ground below)
- Implements proper BAD-EGG logic

### 3. Fix egg/nest objects
Ensure:
- NEST is in UP-A-TREE initially
- EGG is in NEST initially
- BROKEN-EGG object exists
- BROKEN-CANARY object exists
- CANARY is in EGG initially

### 4. Create proper transcript
Record new transcript showing:
- Navigate to PATH
- Climb UP to UP-A-TREE
- Examine nest
- Take egg from nest
- Drop nest (should fall to ground)
- Climb DOWN
- Verify nest on ground
- Climb UP again
- Drop egg (should break)
- Verify broken egg and canary

## Next Steps

1. Check if special behaviors are called during actions
2. Implement room-specific DROP handling for UP-A-TREE
3. Test egg/nest dropping behavior
4. Create proper transcript
5. Verify 95%+ similarity


## Implementation Complete

### Changes Made

1. **Added removeObject method to GameState** (src/game/state.ts)
   - Implements REMOVE-CAREFULLY functionality from ZIL
   - Removes object from current location and sets location to empty string

2. **Enhanced DROP action** (src/game/actions.ts)
   - Added special handling for UP-A-TREE room
   - Implements handleTreeDrop method for tree-specific drop behavior
   - Implements breakEgg method for BAD-EGG functionality

3. **Tree Drop Behaviors:**
   - Dropping nest with egg inside: Egg breaks, both fall to PATH
   - Dropping egg alone: Egg breaks, falls to PATH
   - Dropping other objects: Falls to PATH with generic message

### Testing Results

Manual testing confirms:
- ✅ Nest can be taken from UP-A-TREE
- ✅ Egg is inside nest initially
- ✅ Dropping nest with egg breaks the egg
- ✅ Broken egg and broken canary appear on ground (PATH)
- ✅ Objects fall from tree to PATH room correctly

### Transcript Issue

**IMPORTANT:** The current transcript (28-egg-nest.json) does NOT test the egg/nest puzzle. It tests troll combat and the player dying before ever reaching the egg/nest. The transcript is mislabeled.

To properly test the egg/nest puzzle, a new transcript should be created that:
1. Navigates to PATH → UP (UP-A-TREE)
2. Takes nest
3. Opens nest
4. Takes egg from nest
5. Drops nest (should fall to ground intact)
6. Drops egg (should break)
7. Verifies broken egg and canary on ground

The current 81.3% similarity is due to troll combat RNG differences, not egg/nest puzzle issues.

### Recommendation

The egg/nest puzzle logic is now correctly implemented and matches the original ZIL behavior. However, the transcript needs to be recreated to actually test this puzzle. This should be done as part of Phase 1 (transcript creation) rather than Phase 3 (fixing puzzles).
