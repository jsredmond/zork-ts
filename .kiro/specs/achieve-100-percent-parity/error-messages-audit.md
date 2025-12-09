# Error Messages Audit Report

## Overview
Current similarity: 60.2% (11/20 exact matches)
Target similarity: 90%+

## Exact Matches (11/20) ✓
1. `xyzzy` → "A hollow voice says \"Fool.\"" ✓
2. `take house` → "You can't take that!" ✓
3. `take` → "What do you want to take?" ✓
4. `put` → "What do you want to put?" ✓
5. `attack` → "What do you want to attack?" ✓
6. `smell` → "You smell nothing unusual." ✓
7. `listen` → "You hear nothing unusual." ✓
8. `jump` → "Wheeeeeeeeee!!!!!" ✓
9. `sing` → "Your singing is abominable." ✓
10. `pray` → "If you pray enough, your prayers may be answered." ✓
11. `curse` → "Such language in a high-class establishment like this!" ✓

## Differences Requiring Fixes (9/20) ✗

### 1. Unknown Word Error (Command: "go blarg")
**Expected:** `I don't know the word "blarg".`
**Actual:** `You can't see any blarg here!`
**Similarity:** 3.3%
**Issue:** Parser is treating unknown word as an object name instead of reporting it as unknown
**Fix Required:** Parser should detect unknown words and report them before trying to parse as objects

### 2. Unknown Word Error (Command: "asdfghjkl")
**Expected:** `I don't know the word "asdfghjkl".`
**Actual:** `I don't understand that command.`
**Similarity:** 26.5%
**Issue:** Generic error instead of specific unknown word error
**Fix Required:** Parser should identify and report specific unknown words

### 3. Blocked Exit Error (Command: "north")
**Expected:** `The door is boarded and you can't remove the boards.`
**Actual:** Full room description (moved to North of House)
**Similarity:** 2.9%
**Issue:** Command succeeded when it should have been blocked
**Fix Required:** North exit from West of House should be blocked with boarded door message

### 4. Window Opening Error (Command: "open window")
**Expected:** `The window is slightly ajar, but not enough to allow entry.`
**Actual:** `The windows are boarded and can't be opened.`
**Similarity:** 18.6%
**Issue:** Wrong error message for window
**Fix Required:** Window should have specific "slightly ajar" message, not generic boarded message

### 5. Break Command Error (Command: "break window")
**Expected:** `Vandalism is not usually tolerated.`
**Actual:** `I don't know how to break.`
**Similarity:** 8.6%
**Issue:** Parser doesn't recognize "break" verb
**Fix Required:** Add "break" verb with vandalism message

### 6. Incomplete Go Command (Command: "go")
**Expected:** `Where do you want to go?`
**Actual:** `You can't go that way.`
**Similarity:** 12.5%
**Issue:** Wrong error message for incomplete command
**Fix Required:** Detect incomplete "go" command and ask for direction

### 7. Object Not in Inventory (Command: "open mailbox with sword")
**Expected:** `You don't have that.`
**Actual:** `You can't see any mailbox here!`
**Similarity:** 25.8%
**Issue:** Wrong error - mailbox IS visible, but sword is not in inventory
**Fix Required:** Check inventory before checking visibility for "with" commands

### 8. Fixed Object Error (Command: "take mailbox")
**Expected:** `It is securely anchored.`
**Actual:** `You can't see any mailbox here!`
**Similarity:** 3.2%
**Issue:** Mailbox should be visible but not takeable
**Fix Required:** Mailbox object needs to be present and have specific "securely anchored" message

### 9. Inedible Object Error (Command: "eat mailbox")
**Expected:** `I don't think that the small mailbox would agree with you.`
**Actual:** `You can't see any mailbox here!`
**Similarity:** 3.4%
**Issue:** Mailbox should be visible
**Fix Required:** Same as #8 - mailbox needs to be present

## Root Causes

### 1. Parser Issues
- Unknown words not being detected properly (issues #1, #2)
- "break" verb not implemented (issue #5)
- Incomplete "go" command not handled correctly (issue #6)
- "with" clause inventory check order wrong (issue #7)

### 2. Room/Object Setup Issues
- North exit from West of House not blocked (issue #3)
- Window object missing specific message (issue #4)
- Mailbox object not present or not visible (issues #8, #9)

### 3. Error Message Text Issues
- Some messages exist but aren't being used in the right contexts

## Fix Priority

### High Priority (Blocking Multiple Tests)
1. **Mailbox visibility** - Affects 3 tests (#7, #8, #9)
2. **Unknown word detection** - Affects 2 tests (#1, #2)

### Medium Priority (Single Test Each)
3. **North exit blocking** - Affects 1 test (#3)
4. **Window message** - Affects 1 test (#4)
5. **Break verb** - Affects 1 test (#5)
6. **Incomplete go** - Affects 1 test (#6)

## Implementation Plan

### Phase 1: Object Setup
- Ensure mailbox is present and visible in starting location
- Add "securely anchored" message to mailbox
- Ensure mailbox has proper eat response

### Phase 2: Parser Fixes
- Fix unknown word detection to report specific words
- Add "break" verb with vandalism message
- Fix incomplete "go" command handling
- Fix "with" clause to check inventory before visibility

### Phase 3: Room/Exit Fixes
- Block north exit from West of House with boarded door message
- Update window object with "slightly ajar" message

### Phase 4: Verification
- Run transcript again
- Verify 90%+ similarity achieved
