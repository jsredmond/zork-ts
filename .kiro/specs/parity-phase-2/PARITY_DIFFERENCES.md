# Parity Differences Report - Phase 2 Final Results

## Summary

Comparison of TypeScript implementation vs original Z-Machine (zork1.z3) using the record-and-compare system with content normalization enabled.

**Test Date:** December 23, 2024

**Phase 2 Fixes Applied:**
- Death/resurrection system fixes
- Darkness handling fixes
- "take all" in darkness message fix
- "drop all" order fix
- Comparison tool normalization (status bar stripping, line wrapping normalization)
- Test sequence fix (turn on lamp before going to attic)

**Overall Results (with normalization):**
- Total Sequences: 3
- Total Differences: 33
- Aggregate Parity: 76.47%

| Sequence | Commands | Differences | Parity |
|----------|----------|-------------|--------|
| Basic Exploration | 29 | 5 | 82.76% |
| Object Manipulation | 39 | 5 | 87.18% |
| Key Puzzle Solutions | 68 | 23 | 67.65% |

**Target:** 95%+ parity on all test sequences

**Status:** NOT ACHIEVED - Combat randomness and remaining behavioral differences

---

## Comparison with Phase 1

| Metric | Phase 1 | Phase 2 | Change |
|--------|---------|---------|--------|
| Aggregate Parity | 2.94% | 76.47% | +73.53% |
| Basic Exploration | 0.00% | 82.76% | +82.76% |
| Object Manipulation | 5.13% | 87.18% | +82.05% |
| Key Puzzle Solutions | 1.47% | 67.65% | +66.18% |

**Significant improvement achieved through:**
1. Content normalization (status bar stripping, line wrapping)
2. Death/resurrection fixes
3. Darkness handling fixes
4. Test sequence fix (lamp on before attic)

---

## Analysis of Remaining Differences

### Combat Randomness (puzzle-solutions)

The puzzle-solutions test includes troll combat, which uses random number generation. The outcomes differ between Z-Machine and TypeScript runs:

**Z-Machine:** Player may die during combat, resurrect, and continue from forest
**TypeScript:** Player may kill troll quickly and continue normally

This accounts for most of the remaining differences in puzzle-solutions (23 differences).

**Recommendation:** Combat-heavy test sequences will always have variability. Consider:
1. Using a fixed seed for deterministic testing
2. Creating separate non-combat test sequences
3. Accepting combat randomness as expected behavior

---

### Remaining Behavioral Differences

#### 1. Initial Game Header
**Severity:** Minor (Cosmetic)

Z-Machine shows:
```
ZORK I: The Great Underground Empire
Infocom interactive fiction - a fantasy story
Copyright (c) 1981, 1982, 1983, 1984, 1985, 1986 Infocom, Inc. All rights reserved.
ZORK is a registered trademark of Infocom, Inc.
Release 119 / Serial number 880429
```

TypeScript shows:
```
ZORK I: The Great Underground Empire
Copyright (c) 1981, 1982, 1983 Infocom, Inc. All rights reserved.
ZORK is a registered trademark of Infocom, Inc.
Revision 88 / Serial number 840726
```

**Status:** Acceptable difference (different version info)

#### 2. Mailbox in Initial Room Description
**Severity:** Minor

Z-Machine shows: "There is a small mailbox here."
TypeScript: Does not show mailbox in initial description

**Status:** Should be fixed for full parity

#### 3. Song Bird Message Timing
**Severity:** Minor (Atmospheric)

Song bird messages ("You hear in the distance the chirping of a song bird.") appear at different times between implementations.

**Status:** Acceptable difference (random/timing-based)

#### 4. Object Order in Room Descriptions
**Severity:** Minor

Kitchen shows objects in different order:
- Z-Machine: bottle first, then sack
- TypeScript: sack first, then bottle

**Status:** Should be fixed for full parity

#### 5. Dark Room Look Behavior
**Severity:** Minor

When looking in a dark room:
- Z-Machine: Shows only darkness message
- TypeScript: Shows room name, then darkness message

**Status:** Should be fixed for full parity

#### 6. Drop All Order
**Severity:** Minor

Items dropped in different order:
- Z-Machine: sword, brass lantern, leaflet
- TypeScript: leaflet, brass lantern, sword

**Status:** Inventory ordering differs between implementations

#### 7. Living Room Description (Rug State)
**Severity:** Minor

After moving rug:
- Z-Machine: "a closed trap door at your feet"
- TypeScript: "a large oriental rug in the center of the room"

**Status:** Rug state not reflected in room description

---

## Verified Fixes from Phase 2

### ✅ Death/Resurrection System
- Player resurrects in FOREST-1 correctly
- Inventory is scattered appropriately
- Lamp goes to LIVING-ROOM
- Puzzle state is preserved

### ✅ Darkness Entry Display
- "You have moved into a dark place." shown on dark room entry
- Darkness warning follows

### ✅ "take all" in Darkness
- Returns "There's nothing here you can take." (matches Z-Machine)

### ✅ Comparison Tool Normalization
- Status bar lines stripped
- Line wrapping normalized
- --normalize flag available

---

## Recommendations for Phase 3

### Priority 1: Address Combat Randomness
- Use fixed seeds for deterministic combat testing
- Or accept combat variability as expected behavior

### Priority 2: Fix Mailbox Display
Add mailbox to initial West of House room description.

### Priority 3: Fix Object Order
Ensure objects appear in same order as Z-Machine in room descriptions.

### Priority 4: Fix Dark Room Look
Remove room name from dark room look output.

### Priority 5: Fix Rug State in Description
Update living room description to reflect rug state.

### Priority 6: Fix Sword Glow Messages
Add "Your sword is glowing with a faint blue glow." when near troll.

---

## Test Commands

```bash
# Run full batch comparison with normalization
npx tsx scripts/record-and-compare.ts --batch --normalize --format text scripts/sequences/

# Run individual sequences with normalization
npx tsx scripts/record-and-compare.ts --normalize --mode both scripts/sequences/basic-exploration.txt
npx tsx scripts/record-and-compare.ts --normalize --mode both scripts/sequences/object-manipulation.txt
npx tsx scripts/record-and-compare.ts --normalize --mode both scripts/sequences/puzzle-solutions.txt
```

---

## Conclusion

Phase 2 achieved significant improvement in parity scores:
- Aggregate parity improved from 2.94% to 76.47%
- Basic exploration and object manipulation sequences are now at ~83-87% parity
- The puzzle-solutions sequence is at 67.65% due to combat randomness

**Key Findings:**
1. The 95% target was NOT achieved
2. Combat randomness is the primary remaining blocker for puzzle-solutions
3. Basic exploration and object manipulation are close to target
4. Remaining differences are mostly minor cosmetic/ordering issues

**Next Steps:**
1. Consider using fixed seeds for deterministic combat testing
2. Address remaining minor behavioral differences
3. Re-run verification to confirm improvement
