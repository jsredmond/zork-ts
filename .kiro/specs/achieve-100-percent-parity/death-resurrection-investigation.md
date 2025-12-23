# Death and Resurrection Investigation

## Current State

**Transcript:** 43-death-resurrection.json  
**Current Similarity:** 28.7%  
**Target:** 90%+

## Test Scenario

The transcript tests the following sequence:
1. Navigate to cellar (commands 1-13)
2. Go DOWN from cellar without light (command 14) - should trigger grue attack and death
3. First death triggers automatic resurrection
4. Player should be in FOREST-1 with empty inventory (commands 15-16)

## Issues Identified

### Issue 1: Premature Death/Resurrection

**Symptom:** Player is moved to forest after command 4 ("west" from South of House)

**Expected:** Player should navigate normally until command 14 (going down from cellar into darkness)

**Actual:** Player appears to be in forest starting at command 4

**Root Cause:** Unknown - need to investigate why death is triggering early

### Issue 2: Grue Attack Not Implemented

**Code Location:** `src/engine/lighting.ts`

**Status:** Function `checkGrueAttack()` exists but is never called

**ZIL Reference:** GOTO routine in gverbs.zil checks for darkness and calls JIGS-UP

**Required:** Movement code must check if destination room is dark and trigger grue attack

### Issue 3: Death/Resurrection Logic Incomplete

**Code Location:** `src/game/deathMessages.ts`, `src/game/deadState.ts`

**Current Implementation:**
- `handleDeath()` sets PLAYER_DEAD flag and shows message
- `deadState.ts` handles verb restrictions when dead
- No automatic resurrection logic

**ZIL Reference:** JIGS-UP routine in 1actions.zil (lines 4046-4095)

**Required Logic:**
```
1. Display death message
2. Decrement score by 10
3. Check DEATHS counter:
   - If DEATHS >= 2: Game over (psychotic maniac message)
   - If SOUTH-TEMPLE touched: Enter death state (Hades)
   - Otherwise: Automatic resurrection
4. For resurrection:
   - Move player to FOREST-1
   - Clear inventory (randomize treasures)
   - Clear TRAP-DOOR TOUCHBIT
   - Kill all interrupts
   - Show resurrection message
```

### Issue 4: Missing DEATHS Counter

**Status:** Not implemented

**Required:** Global variable to track number of deaths

**Logic:**
- First death (DEATHS=0): Automatic resurrection
- Second death (DEATHS=1): Automatic resurrection  
- Third death (DEATHS=2): Game over

### Issue 5: Missing SOUTH-TEMPLE Check

**Status:** Not implemented

**Required:** Check if SOUTH-TEMPLE has TOUCHBIT flag

**Logic:**
- If SOUTH-TEMPLE touched: Enter death state (become spirit in Hades)
- If not touched: Automatic resurrection

### Issue 6: Missing RANDOMIZE-OBJECTS

**Status:** Not implemented

**Required:** Scatter treasures when player dies

**Logic:**
- Keep LAMP in LIVING-ROOM
- Keep COFFIN in EGYPT-ROOM
- Reset SWORD treasure value to 0
- Move all other treasures to random RLANDBIT rooms

## ZIL Code Analysis

### JIGS-UP Routine (1actions.zil:4046-4095)

```zil
<ROUTINE JIGS-UP (DESC "OPTIONAL" (PLAYER? <>))
  <SETG WINNER ,ADVENTURER>
  <COND (,DEAD
    ; Already dead - game over
    <TELL "It takes a talented person to be killed while already dead...">
    <FINISH>)>
  <TELL .DESC CR>
  <COND (<NOT ,LUCKY>
    <TELL "Bad luck, huh?" CR>)>
  <PROG ()
    <SCORE-UPD -10>
    <TELL "
|    ****  You have died  ****
|
|">
    <COND (<FSET? <LOC ,WINNER> ,VEHBIT>
      <MOVE ,WINNER ,HERE>)>
    <COND
      (<NOT <L? ,DEATHS 2>>
        ; Third death - game over
        <TELL "You clearly are a suicidal maniac...">
        <FINISH>)
      (T
        <SETG DEATHS <+ ,DEATHS 1>>
        <MOVE ,WINNER ,HERE>
        <COND (<FSET? ,SOUTH-TEMPLE ,TOUCHBIT>
          ; Become spirit in Hades
          <TELL "As you take your last breath...">
          <SETG DEAD T>
          <SETG TROLL-FLAG T>
          <SETG ALWAYS-LIT T>
          <PUTP ,WINNER ,P?ACTION DEAD-FUNCTION>
          <GOTO ,ENTRANCE-TO-HADES>)
        (T
          ; Automatic resurrection
          <TELL "Now, let's take a look here...
Well, you probably deserve another chance. I can't quite fix you
up completely, but you can't have everything." CR CR>
          <GOTO ,FOREST-1>)>
        <FCLEAR ,TRAP-DOOR ,TOUCHBIT>
        <SETG P-CONT <>>
        <RANDOMIZE-OBJECTS>
        <KILL-INTERRUPTS>
        <RFATAL>)>>>
```

### Key Points

1. **Death Message Format:**
   ```
   [Death description]
   
       ****  You have died  ****
   
   
   Now, let's take a look here... Well, you probably deserve another chance. I can't
   quite fix you up completely, but you can't have everything.
   ```

2. **Resurrection Location:** FOREST-1

3. **Inventory:** Cleared (treasures randomized)

4. **Score:** Decremented by 10 points

5. **Trap Door:** TOUCHBIT cleared

## Required Implementation

### 1. Add Grue Attack to Movement

**File:** `src/game/actions.ts` - MoveAction class

**Logic:**
```typescript
// After moving to new room
const newRoom = state.getCurrentRoom();

// Check if moved into darkness without light
if (!isRoomLit(state)) {
  // Trigger grue attack and death
  return triggerGrueDeath(state);
}
```

### 2. Implement JIGS-UP Logic

**File:** `src/game/deathMessages.ts` or new `src/game/death.ts`

**Function:** `triggerDeath(state: GameState, deathMessage: string)`

**Logic:**
1. Check if already dead (game over)
2. Display death message
3. Decrement score by 10
4. Increment DEATHS counter
5. Check DEATHS >= 2 (game over)
6. Check SOUTH-TEMPLE touched (enter death state)
7. Otherwise: Resurrect in FOREST-1

### 3. Implement Resurrection

**Function:** `resurrectPlayer(state: GameState)`

**Logic:**
1. Display resurrection message
2. Move player to FOREST-1
3. Clear inventory
4. Randomize treasures
5. Clear TRAP-DOOR TOUCHBIT
6. Kill interrupts

### 4. Add DEATHS Counter

**File:** `src/game/state.ts`

**Variable:** `DEATHS` (number, default 0)

### 5. Implement RANDOMIZE-OBJECTS

**Function:** `randomizeObjects(state: GameState)`

**Logic:**
1. Move LAMP to LIVING-ROOM
2. Move COFFIN to EGYPT-ROOM
3. Reset SWORD treasure value
4. Move all treasures to random RLANDBIT rooms

## Expected Transcript Behavior

### Command 14: "down" (from cellar)

**Expected Output:**
```
It is pitch black. You are likely to be eaten by a grue.

    ****  You have died  ****


Now, let's take a look here... Well, you probably deserve another chance. I can't
quite fix you up completely, but you can't have everything.
```

### Command 15: "look"

**Expected Output:**
```
Forest
This is a forest, with trees in all directions. To the east, there appears to
be sunlight.
```

### Command 16: "inventory"

**Expected Output:**
```
You are empty-handed.
```

## Testing Strategy

1. Fix grue attack triggering in movement
2. Implement JIGS-UP death logic
3. Implement resurrection logic
4. Test with transcript 43-death-resurrection.json
5. Verify 90%+ similarity

## Success Criteria

- [ ] Grue attack triggers when moving into darkness
- [ ] Death message displays correctly
- [ ] Score decremented by 10
- [ ] DEATHS counter incremented
- [ ] Player resurrected in FOREST-1
- [ ] Inventory cleared
- [ ] Transcript similarity 90%+
