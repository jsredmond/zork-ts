# Zork I: Complete Scoring Guide (from ZIL Source)

**Maximum Score: 350 Points**

Points in Zork I are earned through a two-part system:
1. **VALUE** - Points awarded when you first TAKE a treasure (one-time only)
2. **TVALUE** - Points awarded when you PUT a treasure in the trophy case

Plus room entry bonuses and puzzle completion points.

---

## Treasure Scoring (from 1dungeon.zil)

| Treasure | VALUE (Take) | TVALUE (Case) | Total | Location |
|----------|-------------|---------------|-------|----------|
| Crystal skull | 10 | 10 | 20 | Land of the Dead |
| Sceptre | 4 | 6 | 10 | Inside gold coffin |
| Gold coffin | 10 | 5 | 15 | Egyptian room |
| Crystal trident | 4 | 11 | 15 | Atlantis room |
| Silver chalice | 10 | 15 | 25 | Treasure room |
| Huge diamond | 10 | 10 | 20 | Machine room (from coal) |
| Jade figurine | 5 | 5 | 10 | Bat room |
| Bag of coins | 10 | 5 | 15 | Maze |
| Large emerald | 5 | 10 | 15 | Inside buoy |
| Painting | 4 | 6 | 10 | Gallery |
| Platinum bar | 10 | 5 | 15 | Loud room |
| Pot of gold | 10 | 10 | 20 | End of rainbow |
| Sapphire bracelet | 5 | 5 | 10 | Gas room |
| Jeweled scarab | 5 | 5 | 10 | Sandy cave |
| Ivory torch | 14 | 6 | 20 | Torch room |
| Trunk of jewels | 15 | 5 | 20 | Reservoir |
| Jewel-encrusted egg | 5 | 5 | 10 | Bird's nest in tree |
| Brass bauble | 1 | 1 | 2 | Dropped by songbird |
| Clockwork canary | 6 | 4 | 10 | Inside egg |
| Broken egg | - | 2 | 2 | (If egg is damaged) |
| Broken canary | - | 1 | 1 | (If canary is damaged) |

**Treasure Total: 190 points** (if all treasures intact)

---

## Room Entry Points (from 1dungeon.zil VALUE property)

| Room | Points | Notes |
|------|--------|-------|
| Kitchen/Living Room | 10 | First entry into the house |
| Cellar | 25 | First descent into the dungeon |
| Treasure Room | 25 | Thief's lair |
| Lower Shaft (lit) | 5 | When LIGHT-SHAFT variable is set |

**Room Entry Total: 65 points**

---

## Action/Puzzle Points (from ZIL routines)

| Action | Points | Source |
|--------|--------|--------|
| Defeat Troll | 10 | TROLL-MELEE |
| Defeat Thief | 25 | THIEF-MELEE |
| Defeat Cyclops | 10 | CYCLOPS-F |
| Inflate boat | 5 | INFLATE-F |
| Raise dam | 3 | DAM-F |
| Lower dam | 3 | DAM-F |
| Put coal in machine | 5 | MACHINE-F |
| Turn on machine | 1 | MACHINE-F |
| Wave sceptre at rainbow | 5 | RAINBOW-F |
| Complete exorcism | 4 | EXORCISE-F |
| Enter Hades | 4 | HADES-F |

**Action Total: ~85 points**

---

## Score Breakdown Summary

| Category | Points |
|----------|--------|
| Treasure VALUE (taking) | ~110 |
| Treasure TVALUE (trophy case) | ~80 |
| Room entry bonuses | 65 |
| Combat victories | 45 |
| Puzzle completions | ~50 |
| **Total** | **350** |

---

## Important Mechanics

### The Egg Puzzle
- **You cannot open the egg yourself** - "You have neither the tools nor the expertise."
- The thief will open it if he has it (or you give it to him)
- Opening it by force (dropping, throwing) damages it:
  - Broken egg: TVALUE 2 (instead of 5)
  - Broken canary: TVALUE 1 (instead of 4)

### SCORE-OBJ Function (gverbs.zil)
The `SCORE-OBJ` routine awards VALUE points when:
1. Taking an object (`ITAKE`)
2. Putting an object in a container (`V-PUT`)
3. Entering a room (room's VALUE property)

Points are awarded only once - the VALUE is set to 0 after scoring.

### Death Penalty
Each death costs 10 points (from `JIGS-UP` routine).

---

## Rank Titles (from V-SCORE in 1actions.zil)

| Score | Rank |
|-------|------|
| 350 | Master Adventurer |
| 331-349 | Wizard |
| 301-330 | Master |
| 201-300 | Adventurer |
| 101-200 | Junior Adventurer |
| 51-100 | Novice Adventurer |
| 26-50 | Amateur Adventurer |
| 0-25 | Beginner |

---

*Reference: Original ZIL source files (1dungeon.zil, 1actions.zil, gverbs.zil)*
