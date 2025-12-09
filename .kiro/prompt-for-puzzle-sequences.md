# Prompt for Getting Zork I Puzzle Command Sequences

Please provide the **complete, exact command sequences** needed to solve the following Zork I puzzles from the original game. For each puzzle, include:

1. **Every single command** from the starting location (West of House)
2. **Navigation commands** to reach the puzzle location
3. **All interaction commands** to solve the puzzle
4. **One command per line** (no abbreviations unless necessary)
5. **Success indicator** - what text confirms the puzzle is solved

Format each puzzle like this:

```
## PUZZLE NAME
Starting location: West of House
Success indicator: [exact text that shows puzzle is solved]

Commands:
[command 1]
[command 2]
...
```

---

## Puzzles Needed:

### 1. BAT ENCOUNTER (Task 3.2)
- **Goal**: Trigger bat encounter and have bat carry player
- **Location**: Bat is in the Bat Room (in the mine area)
- **Key items needed**: None specific, just need to encounter the bat
- **Success indicator**: Text showing bat carrying player to a new location

### 2. MIRROR ROOM (Task 3.3)
- **Goal**: Interact with mirror properly and discover its behaviors
- **Location**: Mirror Room (two mirrors)
- **Key items needed**: May need to bring items to see reflections
- **Success indicator**: Text showing mirror interactions working correctly

### 3. EGG/NEST PUZZLE (Task 3.4)
- **Goal**: Handle egg properly and complete egg/nest puzzle
- **Location**: Egg is in bird's nest (Up a Tree)
- **Key items needed**: May need to get egg from nest
- **Success indicator**: Successfully obtaining/handling the egg

### 4. COFFIN PUZZLE (Task 3.5)
- **Goal**: Open coffin and get sceptre
- **Location**: Egyptian Room (coffin)
- **Key items needed**: Possibly need to open coffin with specific method
- **Success indicator**: "Taken." after getting sceptre from coffin
- **Note**: We already know this involves getting to Egyptian Room and opening the coffin

### 5. CYCLOPS FEEDING (Task 3.6)
- **Goal**: Feed cyclops properly to make him leave or become friendly
- **Location**: Cyclops Room (in Treasure Room area)
- **Key items needed**: Food item (lunch from kitchen?)
- **Success indicator**: Text showing cyclops accepting food and leaving/becoming friendly

---

## Important Notes:

1. **Start from West of House** for each puzzle (the game's starting location)
2. **Include ALL navigation** - don't skip any movement commands
3. **Use full commands** where possible (e.g., "open window" not "open")
4. **Include item pickup** - if puzzle needs items, include commands to get them
5. **One command per line** - makes it easy to create command files
6. **Test in original game** - verify these sequences actually work in dfrotz

## Example Format (from Rainbow Puzzle):

```
## RAINBOW PUZZLE
Starting location: West of House
Success indicator: "Taken." (after getting pot of gold)

Commands:
open window
enter
w
get lamp
turn on lamp
e
u
get rope
d
open trap door
d
s
e
[... continues with full navigation ...]
wave sceptre
w
get pot
```

---

Please provide complete sequences for all 5 puzzles above. These will be used to create automated transcripts from the original Zork I game.
