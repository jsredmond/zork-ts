# Parity Logic Differences Analysis

## Summary

This document analyzes the remaining logic differences between the TypeScript and Z-Machine implementations of Zork I. These are differences that are NOT due to RNG variance (random message selection from the same pool).

**Analysis Date:** December 30, 2025

## Overall Statistics

| Metric | Value |
|--------|-------|
| Seeds Tested | 5 (12345, 67890, 54321, 99999, 11111) |
| Total Commands | 1000 |
| Total Differences | 134 |
| RNG Differences | 51 (38.1%) |
| Logic Differences | 83 (61.9%) |
| Average Total Parity | 86.6% |
| Average Logic Parity | 91.7% |

## Logic Difference Categories

### 1. White House Visibility from Forest Rooms (HIGH PRIORITY)

**Occurrences:** ~50+ across all seeds

**Issue:** The TypeScript implementation allows interaction with the white house from forest rooms, while the Z-Machine returns "You're not at the house."

**Examples:**
- Command: `take white house` from Forest
  - TS: "An interesting idea..." (YUKS message)
  - ZM: "You're not at the house."

- Command: `look at white house` from Forest
  - TS: "The house is a beautiful colonial house which is painted white..."
  - ZM: "You're not at the house."

- Command: `open white house` from Forest
  - TS: "I can't see how to get in from here."
  - ZM: "You're not at the house."

**Root Cause:** The WHITE-HOUSE object is incorrectly visible from forest rooms. In the Z-Machine, the white house is only visible from rooms adjacent to the house (WEST-OF-HOUSE, NORTH-OF-HOUSE, SOUTH-OF-HOUSE, BEHIND-HOUSE).

**Fix Required:** Update visibility rules for WHITE-HOUSE to only be visible from house-adjacent rooms.

---

### 2. Forest EXAMINE Response (MEDIUM PRIORITY)

**Occurrences:** ~15 across all seeds

**Issue:** The TypeScript implementation returns a detailed forest description, while Z-Machine returns a generic response.

**Examples:**
- Command: `look at forest` or `examine forest`
  - TS: "The forest is a deep, dark, and foreboding place. You can see trees in all directions."
  - ZM: "There's nothing special about the forest."

**Root Cause:** The scenery handler for FOREST has a custom EXAMINE response that doesn't match Z-Machine behavior.

**Fix Required:** Update forest EXAMINE handler to return "There's nothing special about the forest."

---

### 3. Boarded Window Movement Messages (LOW PRIORITY)

**Occurrences:** ~5 across all seeds

**Issue:** When moving in certain directions near the house, TS shows "The windows are all boarded." while ZM shows nothing.

**Examples:**
- Command: `south` from West of House
  - TS: "The windows are all boarded."
  - ZM: (empty - just moves)

- Command: `north` from South of House
  - TS: "The windows are all boarded."
  - ZM: (empty - just moves)

**Root Cause:** The TypeScript implementation adds an extra message about boarded windows when moving in certain directions.

**Fix Required:** Remove the extra boarded window message from movement handlers.

---

### 4. Parser Vocabulary - "white" Word (LOW PRIORITY)

**Occurrences:** 2 across all seeds

**Issue:** In some contexts, the parser doesn't recognize "white" as a word.

**Examples:**
- Command: `push white house` from certain rooms
  - TS: "I don't know the word \"white\"."
  - ZM: "You can't see any white house here!"

**Root Cause:** Parser vocabulary issue - "white" should be recognized as an adjective for "house".

**Fix Required:** Ensure "white" is in the vocabulary and properly associated with "house".

---

### 5. Drop Command for Non-Visible Objects (LOW PRIORITY)

**Occurrences:** ~3 across all seeds

**Issue:** When dropping an object that isn't visible, TS returns "OBJECT_NOT_VISIBLE" while ZM returns "You don't have that!"

**Examples:**
- Command: `drop sword` (when not holding sword)
  - TS: "OBJECT_NOT_VISIBLE"
  - ZM: "You don't have that!"

- Command: `drop door`
  - TS: "OBJECT_NOT_VISIBLE"
  - ZM: "You don't have that!"

**Root Cause:** The drop action handler is returning a raw error code instead of a proper message.

**Fix Required:** Update drop action to return "You don't have that!" for objects not in inventory.

---

### 6. Drop All with Rainbow (VERY LOW PRIORITY)

**Occurrences:** 1 across all seeds

**Issue:** When using "drop all" with nothing in inventory, messages differ.

**Examples:**
- Command: `drop all` (empty inventory, rainbow visible)
  - TS: "You are empty-handed."
  - ZM: "You don't have the rainbow."

**Root Cause:** Different handling of "all" when inventory is empty but scenery objects are visible.

**Fix Required:** Minor - may not be worth fixing.

---

## Priority Fix List

1. **HIGH:** White house visibility from forest rooms
   - Impact: ~50+ differences
   - Fix: Update WHITE-HOUSE visibility rules

2. **MEDIUM:** Forest EXAMINE response
   - Impact: ~15 differences
   - Fix: Update forest scenery handler

3. **LOW:** Boarded window movement messages
   - Impact: ~5 differences
   - Fix: Remove extra movement messages

4. **LOW:** Parser vocabulary for "white"
   - Impact: 2 differences
   - Fix: Add "white" to vocabulary

5. **LOW:** Drop command error message
   - Impact: ~3 differences
   - Fix: Return proper error message

## Expected Impact

If all logic differences are fixed:
- **Logic Parity:** Should reach ~99%+
- **Total Parity:** Will remain at ~85-90% due to unavoidable RNG variance

## RNG Differences (Acceptable)

The following differences are due to random message selection and are NOT bugs:

| Pool | Occurrences | Description |
|------|-------------|-------------|
| YUKS | 41 | Refusal messages for taking non-takeable objects |
| HO_HUM | 10 | Ineffective action messages for push/pull |

Both implementations correctly select from the same message pools, but the specific selection differs due to unsynchronized RNG.
