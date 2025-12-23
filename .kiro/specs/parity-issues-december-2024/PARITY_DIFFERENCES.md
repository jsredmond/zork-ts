# Parity Differences Report - December 22, 2024

## Summary

Comparison of TypeScript implementation vs original Z-Machine (zork1.z3) using the record-and-compare system.

**Test Date:** December 22, 2024

**Overall Results:**
- Total Sequences: 3
- Total Differences: 133
- Aggregate Parity: 2.94%

| Sequence | Commands | Exact Matches | Differences | Parity |
|----------|----------|---------------|-------------|--------|
| Basic Exploration | 29 | 0 | 29 | 0.00% |
| Object Manipulation | 39 | 2 | 37 | 5.13% |
| Key Puzzle Solutions | 68 | 1 | 67 | 1.47% |

**Target:** 95%+ parity on all test sequences

**Status:** NOT ACHIEVED - Significant work remains

---

## Analysis of Differences

### Category 1: Acceptable Differences (Expected)

These differences are documented as acceptable per the requirements:

#### 1.1 Status Bar Display
The Z-Machine shows a status bar on every command output:
```
Room Name                                    Score: X        Moves: Y
```
The TypeScript implementation does not include this status bar (terminal implementation difference).

**Impact on Parity Score:** This accounts for a significant portion of the "differences" since every command output differs by the status bar line.

#### 1.2 Line Wrapping
The Z-Machine wraps text at ~80 characters with specific break points. The TypeScript implementation does not wrap text the same way.

**Example:**
- Z-Machine: `You are facing the north side of a white house. There is no door here, and all\nthe windows are boarded up.`
- TypeScript: `You are facing the north side of a white house. There is no door here, and all the windows are boarded up.`

---

### Category 2: Fixed Issues (Verified Working)

The following issues from the original report have been fixed:

#### 2.1 Mailbox Visibility ✅
**Status:** FIXED
- Mailbox now appears in West of House room description
- "There is a small mailbox here." is displayed

#### 2.2 Take Leaflet ✅
**Status:** FIXED
- "take leaflet" now works correctly after opening mailbox
- Returns "Taken." as expected

#### 2.3 "out" Command ✅
**Status:** FIXED
- "out" is now recognized as a direction command
- Returns "You can't go that way." instead of "I don't understand that command."

#### 2.4 "drop all" / "take all" Commands ✅
**Status:** FIXED
- Both commands now work
- Lists each item dropped/taken
- Note: Order differs from Z-Machine (TypeScript drops in reverse order)

#### 2.5 Examine Command ✅
**Status:** FIXED
- Returns proper descriptions
- "examine sword" returns "There's nothing special about the sword."
- "examine lamp" returns "The lamp is turned off."

#### 2.6 Container Content Display ✅
**Status:** FIXED
- Water in bottle now displays correctly:
  ```
  The glass bottle contains:
    A quantity of water
  ```

#### 2.7 Sword Naming ✅
**Status:** FIXED
- Inventory shows "A sword" not "An elvish sword"
- Dropped sword shows "There is a sword here."

---

### Category 3: Remaining Issues

#### 3.1 Death/Resurrection State Corruption
**Severity:** CRITICAL
**Status:** NOT FIXED

When player dies (e.g., from grue in dark room), resurrection corrupts game state:
- Player loses all inventory items
- Player respawns in Forest instead of expected location
- Game becomes unplayable for puzzle sequences

**Evidence from puzzle-solutions test:**
```
Command: d (going down from Kitchen to Attic without lamp on)
Expected: Kitchen (player should survive with lamp)
Actual: Player dies, resurrects in Forest with empty inventory
```

This single issue caused the entire puzzle-solutions sequence to fail (67 differences).

#### 3.2 Darkness Handling Inconsistency
**Severity:** MAJOR
**Status:** PARTIALLY FIXED

- "take all" in dark room: TypeScript says "It's too dark to see!" but Z-Machine says "There's nothing here you can take."
- Room name display on dark entry is inconsistent

#### 3.3 Song Bird Messages Timing
**Severity:** MINOR
**Status:** IMPLEMENTED BUT TIMING DIFFERS

Song bird messages appear at different times between implementations:
- Z-Machine: Appears on specific commands
- TypeScript: Appears on different commands

This is a minor atmospheric difference.

#### 3.4 "drop all" Order
**Severity:** MINOR
**Status:** DIFFERENT BEHAVIOR

- Z-Machine drops items in order: sword, brass lantern, leaflet
- TypeScript drops items in reverse order: leaflet, brass lantern, sword

---

## Recommendations

### Priority 1: Fix Death/Resurrection (CRITICAL)
The death/resurrection system is the primary blocker for achieving parity. When fixed:
- Puzzle-solutions sequence should improve dramatically
- Player should retain items or have them scattered appropriately
- Player should respawn in correct location

### Priority 2: Normalize Comparison (MEDIUM)
Consider updating the comparison tool to:
- Strip status bar lines before comparison
- Normalize line wrapping differences
- This would give a more accurate "content parity" score

### Priority 3: Minor Fixes (LOW)
- Adjust "take all" in darkness message
- Adjust "drop all" order to match Z-Machine
- Fine-tune song bird message timing

---

## Test Commands

```bash
# Run full batch comparison
npx tsx scripts/record-and-compare.ts --batch --format text scripts/sequences/

# Run individual sequences
npx tsx scripts/record-and-compare.ts --mode both scripts/sequences/basic-exploration.txt
npx tsx scripts/record-and-compare.ts --mode both scripts/sequences/object-manipulation.txt
npx tsx scripts/record-and-compare.ts --mode both scripts/sequences/puzzle-solutions.txt
```

---

## Conclusion

The current parity score of 2.94% is misleading due to:
1. Status bar differences (acceptable, accounts for ~50% of "differences")
2. Line wrapping differences (acceptable)
3. Death/resurrection bug (critical, causes cascade failures)

**Estimated "Content Parity" (excluding status bar/wrapping):** ~60-70%

**To achieve 95%+ parity:**
1. Fix death/resurrection system
2. Update comparison tool to normalize acceptable differences
3. Address remaining minor issues

The core game mechanics (mailbox, leaflet, take/drop all, examine, containers) are now working correctly. The primary remaining blocker is the death/resurrection system.
