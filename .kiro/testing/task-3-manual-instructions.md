# Task 3: Manual Transcript Creation Instructions

## Overview
This task requires **manual gameplay** of the original Zork I to create accurate reference transcripts. These cannot be automated as they require playing the actual game.

## Prerequisites
- Original Zork I game file: `COMPILED/zork1.z3`
- Frotz interpreter installed (or another Z-machine interpreter)
- Text editor for creating JSON files

## How to Play and Record

### Option 1: Using Frotz with Script Recording
```bash
# Start Frotz with transcript recording
frotz -s transcript.txt COMPILED/zork1.z3
```

### Option 2: Manual Copy-Paste
1. Start Frotz: `frotz COMPILED/zork1.z3`
2. Play through the puzzle
3. Copy the terminal output
4. Format as JSON transcript

## Transcripts to Create

### 3.1 Rainbow Puzzle (30-rainbow-puzzle.json)
**Location:** Aragain Falls (Rainbow Room)
**Steps:**
1. Get sceptre from coffin (see coffin puzzle)
2. Navigate to Aragain Falls
3. Wave sceptre (rainbow becomes solid)
4. Walk on rainbow
5. Get pot of gold

**Navigation to Aragain Falls:**
- From West of House: n, w, w, s, w

### 3.2 Bat Encounter (31-bat-encounter.json)
**Location:** Bat Room (in the mine)
**Steps:**
1. Navigate to bat location
2. Trigger bat encounter (enter room)
3. Record bat carrying player to random location

**Navigation to Bat Room:**
- From West of House: enter house, down to cellar, navigate through mine

### 3.3 Mirror Room (32-mirror-room.json)
**Location:** Mirror Room (north of cave)
**Steps:**
1. Navigate to mirror room
2. Examine mirror
3. Try to touch/break mirror
4. Record all mirror behaviors

**Navigation to Mirror Room:**
- From West of House: n, n, e, e, n (or similar path)

### 3.4 Egg/Nest Puzzle (33-egg-nest.json)
**Location:** Up a Tree (bird's nest)
**Steps:**
1. Navigate to tree location
2. Climb tree
3. Get egg from nest
4. Handle egg carefully (don't break it)
5. Open egg to get jewel

**Navigation to Tree:**
- From West of House: s, s, w, u

### 3.5 Coffin Puzzle (34-coffin-puzzle.json)
**Location:** Egyptian Room
**Steps:**
1. Get past troll (kill or pay toll)
2. Navigate to Egyptian Room
3. Open coffin
4. Get sceptre from coffin

**Navigation to Egyptian Room:**
- From West of House: enter house, down, n (troll room), deal with troll, e

### 3.6 Cyclops Feeding (35-cyclops-feeding.json)
**Location:** Cyclops Room
**Steps:**
1. Get lunch from kitchen
2. Navigate to Cyclops Room
3. Give lunch to cyclops
4. Cyclops leaves, opens treasure room

**Navigation to Cyclops Room:**
- From West of House: enter house, down, n, e, n, e, u, e

## JSON Format Template

```json
{
  "id": "30-rainbow-puzzle",
  "name": "Rainbow Puzzle",
  "description": "Wave sceptre at Aragain Falls to solidify rainbow and get pot of gold",
  "category": "puzzle",
  "priority": "high",
  "entries": [
    {
      "command": "wave sceptre",
      "expectedOutput": "[EXACT OUTPUT FROM GAME]",
      "notes": "Rainbow becomes solid"
    },
    {
      "command": "cross rainbow",
      "expectedOutput": "[EXACT OUTPUT FROM GAME]",
      "notes": "Walk on rainbow"
    }
  ],
  "metadata": {
    "created": "2024-12-08T00:00:00.000Z",
    "source": "original-game",
    "verified": true
  }
}
```

## Important Notes

1. **Exact Output:** Copy the EXACT text from the game, including:
   - Line breaks
   - Punctuation
   - Spacing
   - All messages

2. **Complete Sequences:** Record the ENTIRE puzzle solution from start to finish

3. **Include Setup:** Show how to reach the puzzle location

4. **State Checks:** Note any important state changes (doors opening, objects appearing, etc.)

5. **Verification:** After creating each transcript, test it against the TypeScript implementation

## After Creating Transcripts

1. Save all JSON files to `.kiro/transcripts/high/`
2. Run verification: `npx tsx scripts/verify-all-transcripts.ts`
3. Check similarity scores
4. Commit with message: "feat: Create proper puzzle transcripts from original game"

## Troubleshooting

- **Can't find location:** Use a walkthrough or map
- **Puzzle won't work:** Check prerequisites (do you have required items?)
- **Game crashes:** Try different interpreter or check game file
- **Output formatting:** Preserve exact spacing and line breaks

## Resources

- Zork I walkthrough: Available online
- Zork I map: Available online
- Frotz documentation: https://davidgriffith.gitlab.io/frotz/
