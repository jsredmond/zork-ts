# Fix Priority List - Behavioral Parity

**Date**: December 7, 2024  
**Based on**: Initial Comparison Analysis  
**Current Status**: 0% pass rate, 8.3% average similarity

## Priority Classification

Fixes are prioritized by:
1. **Impact**: How many transcripts/features affected
2. **Severity**: Critical (blocks gameplay) > Major (wrong behavior) > Minor (cosmetic)
3. **Dependencies**: Fixes that unblock other fixes
4. **Effort**: Estimated implementation time

## Priority 1: Critical Blockers (Week 5 - Days 1-2)

These issues completely block gameplay and affect multiple transcripts.

### 1.1 Container Object Visibility System
**Severity**: CRITICAL  
**Impact**: 15+ transcripts affected  
**Effort**: 4-8 hours  
**Transcripts**: 02-mailbox, 08-rope-basket, 27-coffin, and others

**Issue**: Objects inside containers are not visible/accessible after opening the container.

**Example**:
```
> open mailbox
Opening the small mailbox reveals leaflet.
> take leaflet
You can't see any LEAFLET here.  ← WRONG
```

**Root Cause**: Container opening doesn't update object visibility or the object list in the current context.

**Fix Approach**:
1. Review container opening logic in action handlers
2. Ensure opened containers make contents visible
3. Update object resolution to check container contents
4. Add tests for container operations

**Files to Check**:
- `src/game/actions.ts` - OPEN action handler
- `src/game/state.ts` - Object visibility logic
- `src/parser/parser.ts` - Object resolution

---

### 1.2 Basic Action Handlers - EXAMINE
**Severity**: CRITICAL  
**Impact**: 20+ transcripts affected  
**Effort**: 2-4 hours  
**Transcripts**: All transcripts with EXAMINE commands

**Issue**: EXAMINE returns incomplete descriptions (just object name instead of full description).

**Example**:
```
> examine mailbox
small mailbox  ← WRONG
Expected: "The small mailbox is closed."
```

**Root Cause**: EXAMINE handler not returning full object descriptions with articles and state.

**Fix Approach**:
1. Update EXAMINE action to return complete descriptions
2. Include articles ("the", "a")
3. Include object state (open/closed, on/off, etc.)
4. Match original message format

**Files to Check**:
- `src/game/actions.ts` - EXAMINE action handler
- `src/game/data/objects.ts` - Object descriptions

---

### 1.3 Basic Action Handlers - TAKE
**Severity**: CRITICAL  
**Impact**: 25+ transcripts affected  
**Effort**: 2-4 hours  
**Transcripts**: All transcripts with TAKE commands

**Issue**: TAKE fails for visible objects, especially after container operations.

**Example**:
```
> take leaflet
You can't see any LEAFLET here.  ← WRONG (after opening mailbox)
Expected: "Taken."
```

**Root Cause**: Object visibility check failing or object not in accessible list.

**Fix Approach**:
1. Fix object visibility after container operations (see 1.1)
2. Update TAKE to check container contents
3. Ensure proper "Taken." message
4. Handle already-carrying case

**Files to Check**:
- `src/game/actions.ts` - TAKE action handler
- `src/game/state.ts` - Inventory management

---

### 1.4 Room Description Generation
**Severity**: CRITICAL  
**Impact**: 30+ transcripts affected  
**Effort**: 4-6 hours  
**Transcripts**: All transcripts with LOOK commands

**Issue**: Room descriptions include extra objects or missing objects.

**Example**:
```
> look
West of House
You are standing in an open field west of a white house, with a boarded front door.

There is a small mailbox here.
There is a door here.  ← WRONG (extra object)
```

**Root Cause**: Room description logic listing objects that shouldn't be visible or missing objects that should be.

**Fix Approach**:
1. Review room description generation
2. Filter objects correctly (scenery vs takeable)
3. Match original object listing format
4. Ensure proper line breaks and formatting

**Files to Check**:
- `src/game/rooms.ts` - Room description generation
- `src/game/state.ts` - Object filtering
- `src/game/data/rooms.ts` - Room definitions

---

## Priority 2: High Impact Issues (Week 5 - Days 3-4)

These issues significantly affect gameplay but don't completely block it.

### 2.1 Message Article Generation
**Severity**: MAJOR  
**Impact**: 35+ transcripts affected  
**Effort**: 3-5 hours  
**Transcripts**: Most transcripts

**Issue**: Generated messages missing articles ("a", "the").

**Examples**:
- "reveals leaflet" → "reveals a leaflet"
- "small mailbox" → "The small mailbox"

**Fix Approach**:
1. Review all message generation code
2. Add article generation helper function
3. Update message templates to include articles
4. Test with various objects

**Files to Check**:
- `src/game/actions.ts` - All action handlers
- `src/game/data/messages.ts` - Message templates

---

### 2.2 Navigation System
**Severity**: MAJOR  
**Impact**: 20+ transcripts affected  
**Effort**: 4-6 hours  
**Transcripts**: 03-trap-door, 25-maze, and others

**Issue**: Navigation commands failing or producing wrong output.

**Fix Approach**:
1. Review movement action handlers
2. Check room connection definitions
3. Verify door/passage handling
4. Test all movement directions

**Files to Check**:
- `src/game/actions.ts` - Movement handlers
- `src/game/data/rooms.ts` - Room connections
- `src/game/rooms.ts` - Navigation logic

---

### 2.3 Parser Object Resolution
**Severity**: MAJOR  
**Impact**: 30+ transcripts affected  
**Effort**: 3-5 hours  
**Transcripts**: All transcripts

**Issue**: Parser not resolving object references correctly, case sensitivity issues.

**Example**:
- "LEAFLET" vs "leaflet" not matching
- Objects in containers not found

**Fix Approach**:
1. Make object matching case-insensitive
2. Include container contents in object search
3. Handle synonyms correctly
4. Improve ambiguity resolution

**Files to Check**:
- `src/parser/parser.ts` - Object resolution
- `src/parser/vocabulary.ts` - Word lookup
- `src/game/state.ts` - Object search

---

### 2.4 Lighting System
**Severity**: MAJOR  
**Impact**: 10+ transcripts affected  
**Effort**: 3-5 hours  
**Transcripts**: 04-lamp-darkness, timing transcripts

**Issue**: Dark room handling incorrect, lamp behavior wrong.

**Fix Approach**:
1. Review lighting system implementation
2. Check lamp fuel consumption
3. Verify dark room messages
4. Test light source handling

**Files to Check**:
- `src/engine/lighting.ts` - Lighting system
- `src/engine/daemons.ts` - Lamp fuel daemon
- `src/game/actions.ts` - Light-related actions

---

## Priority 3: Medium Impact Issues (Week 5 - Day 5)

These issues affect specific scenarios but don't block core gameplay.

### 3.1 NPC Behavior
**Severity**: MAJOR  
**Impact**: 10 transcripts affected  
**Effort**: 6-10 hours  
**Transcripts**: 20-thief, 21-thief-defeat, 22-troll, 23-cyclops, 24-bat

**Issue**: NPCs not appearing, moving, or behaving correctly.

**Fix Approach**:
1. Review NPC daemon systems
2. Check NPC movement logic
3. Verify NPC interaction handlers
4. Test combat system

**Files to Check**:
- `src/engine/actors.ts` - NPC behavior
- `src/engine/daemons.ts` - NPC daemons
- `src/engine/combat.ts` - Combat system

---

### 3.2 Puzzle State Management
**Severity**: MAJOR  
**Impact**: 16 transcripts affected  
**Effort**: 8-12 hours  
**Transcripts**: All puzzle transcripts

**Issue**: Puzzle states not updating correctly, solutions not recognized.

**Fix Approach**:
1. Review each puzzle implementation
2. Check state flag updates
3. Verify puzzle completion detection
4. Test alternative solutions

**Files to Check**:
- `src/game/puzzles.ts` - Puzzle logic
- `src/game/actions.ts` - Puzzle-related actions
- `src/game/state.ts` - Flag management

---

### 3.3 Error Message Consistency
**Severity**: MINOR  
**Impact**: 5 transcripts affected  
**Effort**: 2-4 hours  
**Transcripts**: 40-error-messages, 42-unusual-commands

**Issue**: Error messages don't match original text.

**Fix Approach**:
1. Compare error messages with original
2. Update error message templates
3. Ensure consistent formatting
4. Test edge cases

**Files to Check**:
- `src/game/errorMessages.ts` - Error messages
- `src/parser/feedback.ts` - Parser errors

---

## Priority 4: Low Impact Issues (Week 6)

These are cosmetic or rare scenario issues.

### 4.1 Daemon Timing
**Severity**: MINOR  
**Impact**: 10 transcripts affected  
**Effort**: 4-6 hours  
**Transcripts**: All timing transcripts (70-79)

**Issue**: Daemon events firing at wrong times or in wrong order.

**Fix Approach**:
1. Review daemon scheduling
2. Check turn counter
3. Verify daemon priorities
4. Test multiple daemon interactions

**Files to Check**:
- `src/engine/daemons.ts` - Daemon system
- `src/engine/events.ts` - Event scheduling

---

### 4.2 Flavor Text and Scenery
**Severity**: MINOR  
**Impact**: 5 transcripts affected  
**Effort**: 2-4 hours  
**Transcripts**: 60-flavor-text, 61-rare-interactions

**Issue**: Flavor text and scenery descriptions don't match original.

**Fix Approach**:
1. Review scenery action handlers
2. Update flavor text messages
3. Match original wording
4. Test rare interactions

**Files to Check**:
- `src/game/sceneryActions.ts` - Scenery handlers
- `src/game/data/messages.ts` - Flavor text

---

## Effort Estimates

### By Priority

| Priority | Total Effort | Timeline |
|----------|--------------|----------|
| Priority 1 (Critical) | 12-22 hours | Days 1-2 |
| Priority 2 (High) | 13-21 hours | Days 3-4 |
| Priority 3 (Medium) | 16-26 hours | Day 5 |
| Priority 4 (Low) | 6-10 hours | Week 6 |
| **Total** | **47-79 hours** | **~2 weeks** |

### By Category

| Category | Transcripts Affected | Effort | Priority |
|----------|---------------------|--------|----------|
| Container System | 15+ | 4-8h | P1 |
| Basic Actions | 30+ | 6-12h | P1 |
| Room Descriptions | 30+ | 4-6h | P1 |
| Message Generation | 35+ | 3-5h | P2 |
| Navigation | 20+ | 4-6h | P2 |
| Parser | 30+ | 3-5h | P2 |
| Lighting | 10+ | 3-5h | P2 |
| NPCs | 10 | 6-10h | P3 |
| Puzzles | 16 | 8-12h | P3 |
| Error Messages | 5 | 2-4h | P3 |
| Daemons | 10 | 4-6h | P4 |
| Flavor Text | 5 | 2-4h | P4 |

## Implementation Schedule

### Week 5 (Critical Fixes)

**Day 1-2**: Priority 1 (Critical Blockers)
- Container visibility system
- EXAMINE action handler
- TAKE action handler  
- Room description generation

**Expected Impact**: Should improve pass rate to ~20-30% and similarity to ~40-50%

**Day 3-4**: Priority 2 (High Impact)
- Message article generation
- Navigation system
- Parser object resolution
- Lighting system

**Expected Impact**: Should improve pass rate to ~40-50% and similarity to ~60-70%

**Day 5**: Priority 3 (Medium Impact)
- NPC behavior (initial fixes)
- Puzzle state management (initial fixes)
- Error message consistency

**Expected Impact**: Should improve pass rate to ~50-60% and similarity to ~70-80%

### Week 6 (Remaining Fixes)

**Days 1-3**: Complete Priority 3
- Finish NPC behavior
- Finish puzzle state management
- Additional edge cases

**Days 4-5**: Priority 4 (Low Impact)
- Daemon timing
- Flavor text
- Rare scenarios

**Expected Impact**: Should achieve ~90-95% pass rate and ~90-95% similarity

## Success Metrics

### After Priority 1 Fixes
- Critical transcripts: 20-30% pass rate
- Overall similarity: 40-50%
- Container operations working

### After Priority 2 Fixes
- Critical transcripts: 60-70% pass rate
- High priority transcripts: 30-40% pass rate
- Overall similarity: 60-70%

### After Priority 3 Fixes
- Critical transcripts: 80-90% pass rate
- High priority transcripts: 60-70% pass rate
- Overall similarity: 70-80%

### After All Fixes
- Critical transcripts: 95-100% pass rate
- High priority transcripts: 90-95% pass rate
- Medium priority transcripts: 85-90% pass rate
- Low priority transcripts: 80-85% pass rate
- Overall similarity: 90-95%

## Dependencies

### Fix Order

1. **Container System** → Unblocks TAKE and many puzzles
2. **Basic Actions** → Unblocks most transcripts
3. **Room Descriptions** → Improves navigation and exploration
4. **Message Generation** → Improves all output
5. **Parser** → Improves all command handling
6. **Navigation** → Unblocks movement-based puzzles
7. **Lighting** → Unblocks dark area puzzles
8. **NPCs** → Unblocks NPC-based puzzles
9. **Puzzles** → Specific puzzle fixes
10. **Polish** → Error messages, timing, flavor text

## Risk Assessment

### High Risk
- **Container System**: Complex, affects many systems
- **Parser Changes**: Could break working commands
- **State Management**: Could introduce new bugs

### Medium Risk
- **Message Generation**: Many templates to update
- **Navigation**: Complex room connections
- **NPC Behavior**: Complex AI logic

### Low Risk
- **Error Messages**: Isolated changes
- **Flavor Text**: Cosmetic only
- **Daemon Timing**: Well-isolated system

## Testing Strategy

### After Each Fix
1. Run affected transcripts
2. Run full test suite
3. Check for regressions
4. Document improvements

### Checkpoints
- After Priority 1: Full transcript run
- After Priority 2: Full transcript run
- After Priority 3: Full transcript run
- After Priority 4: Final verification

## Conclusion

The fix priority list identifies **47-79 hours of work** over **2 weeks** to address the major behavioral differences. The fixes are ordered by impact and dependencies to maximize improvement at each stage.

**Key Focus Areas**:
1. Container/object visibility (P1)
2. Basic action handlers (P1)
3. Message generation (P2)
4. Parser improvements (P2)

Completing Priority 1 and 2 fixes should bring the implementation from **8.3% similarity to 60-70% similarity**, making the game playable and most core features working correctly.

**Next Step**: Generate initial comparison report (Task 9.6)
