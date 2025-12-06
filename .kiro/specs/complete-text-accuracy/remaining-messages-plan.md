# Implementation Plan: Remaining 253 Messages

**Goal**: Reach 95% coverage (883/929 messages)  
**Current**: 72.77% (676/929 messages)  
**Needed**: 207 messages (to reach 95%)  
**Available**: 253 messages remaining

---

## Phased Approach

### Phase 1: Quick Wins - Scenery & Simple Messages (50 messages, 1-2 days)

**Target**: Low-hanging fruit with simple implementations

1. **WHITE-HOUSE messages** (2 messages)
   - "You're not at the house." (WALK-AROUND when not at house)
   - "It's right here! Are you blind or something?" (FIND when at house)

2. **FOREST messages** (1 message)
   - "The pines and the hemlocks seem to be murmuring." (LISTEN)

3. **MOUNTAIN-RANGE messages** (1 message)
   - "Don't you believe me? The mountains are impassable!" (CLIMB)

4. **Simple object interactions** (~46 messages)
   - BELL: "Ding, dong." (RING)
   - HOT-BELL: Heat and cooling messages
   - BOARDED-WINDOW: "The windows are boarded and can't be opened."
   - NAILS: "The nails, deeply imbedded in the door, cannot be removed."
   - TROPHY-CASE: "The trophy case is securely fastened to the wall."
   - TRAP-DOOR: "It's closed."
   - CHIMNEY: Climbing messages
   - Various simple refusal messages

**Implementation**: Add to `src/game/sceneryActions.ts` and `src/game/actions.ts`

### Phase 2: Water & Container Logic (30 messages, 1 day)

**Target**: WATER object conditional messages

1. **WATER in BOTTLE messages** (5 messages)
   - "It's in the bottle. Perhaps you should take that instead."
   - "The water spills to the floor and evaporates immediately."
   - "The water splashes on the walls and evaporates immediately."
   - Pour/throw variations

2. **WATER location messages** (10 messages)
   - Stream/reservoir availability
   - Container requirements
   - State-dependent responses

3. **Other container interactions** (15 messages)
   - Bottle states
   - Sack interactions
   - Coffin messages

**Implementation**: Enhance `src/game/specialBehaviors.ts` WATER handler

### Phase 3: Puzzle-Specific Messages (40 messages, 1-2 days)

**Target**: Complete puzzle feedback

1. **Dam puzzle** (8 messages)
   - Bolt interactions
   - Water flow messages
   - Reservoir state changes

2. **Mirror puzzle** (6 messages)
   - Mirror interactions
   - Reflection messages

3. **Cyclops puzzle** (8 messages)
   - Cyclops dialogue variations
   - Food interactions
   - State changes

4. **Thief encounters** (10 messages)
   - Combat variations
   - Theft messages
   - Escape scenarios

5. **Other puzzles** (8 messages)
   - Rainbow messages
   - Basket/rope variations
   - Machine interactions

**Implementation**: Enhance `src/game/puzzles.ts` and `src/engine/actors.ts`

### Phase 4: Conditional Room Messages (50 messages, 1-2 days)

**Target**: State-dependent room descriptions

1. **Flag-dependent descriptions** (25 messages)
   - WON_FLAG variations
   - LAMP_ON variations
   - Door state variations

2. **Time-dependent messages** (15 messages)
   - Lamp dimming stages
   - Candle burning stages
   - NPC appearance timing

3. **Object-dependent descriptions** (10 messages)
   - Room changes based on objects
   - Container state descriptions

**Implementation**: Enhance `src/game/conditionalMessages.ts`

### Phase 5: Generic Variations & Error Messages (37 messages, 1 day)

**Target**: Polish and variety

1. **Generic refusals** (15 messages)
   - "You can't do that." variations
   - "That doesn't make sense." alternatives
   - Parser feedback variations

2. **Error messages** (12 messages)
   - Invalid action messages
   - Puzzle failure messages
   - Object misuse messages

3. **Humorous responses** (10 messages)
   - Easter eggs
   - Silly command responses

**Implementation**: Enhance `src/game/errorMessages.ts` and `src/game/actions.ts`

---

## Recommended Execution Order

### Week 1: Core Messages (130 messages → 87% coverage)

**Day 1-2**: Phase 1 (Scenery) - 50 messages  
**Day 3**: Phase 2 (Water) - 30 messages  
**Day 4-5**: Phase 3 (Puzzles) - 40 messages  
**Weekend**: Testing and validation

**Result**: 806/929 messages (86.9%)

### Week 2: Reach 95% Target (77 more messages → 95% coverage)

**Day 1-2**: Phase 4 (Conditional) - 50 messages  
**Day 3**: Phase 5 (Generic/Error) - 27 messages  
**Day 4-5**: Testing, validation, and polish

**Result**: 883/929 messages (95.2%) ✅

---

## Implementation Strategy

### 1. Batch Processing

Group similar messages together:
- All scenery objects at once
- All water-related messages together
- All puzzle messages by puzzle
- All conditional messages by flag

### 2. Test-Driven Approach

For each batch:
1. Read missing messages from validation results
2. Implement messages in appropriate file
3. Run validation to confirm implementation
4. Run test suite to ensure no regressions
5. Move to next batch

### 3. Validation Checkpoints

After each phase:
```bash
npx tsx scripts/validate-messages.ts
npx tsx scripts/verify-coverage-threshold.ts
npm test
```

### 4. Incremental Commits

Commit after each phase completion:
- Phase 1: "feat: add 50 scenery and simple messages"
- Phase 2: "feat: add 30 water and container messages"
- Phase 3: "feat: add 40 puzzle-specific messages"
- Phase 4: "feat: add 50 conditional room messages"
- Phase 5: "feat: add 37 generic and error messages"

---

## Tools & Scripts

### Generate Missing Message Report

```bash
# Get detailed list of missing messages
npx tsx scripts/validate-messages.ts > missing-messages.txt

# Get missing messages by category
npx tsx scripts/verify-coverage-threshold.ts
```

### Create Implementation Helper Script

I'll create a script to help identify and implement messages:

```typescript
// scripts/identify-next-messages.ts
// Analyzes missing messages and suggests next batch to implement
```

### Validation Loop

```bash
# Quick validation loop
while true; do
  npx tsx scripts/verify-coverage-threshold.ts | grep "Coverage:"
  sleep 5
done
```

---

## Success Criteria

### Phase Completion

Each phase is complete when:
- ✅ All messages in phase implemented
- ✅ Validation shows increased coverage
- ✅ All tests passing
- ✅ No regressions

### Final Success

Project is complete when:
- ✅ Coverage ≥ 95% (883+ messages)
- ✅ All tests passing (779+ tests)
- ✅ Zero regressions
- ✅ Documentation updated

---

## Risk Mitigation

### Potential Issues

1. **Complex conditionals**: Some messages have nested conditions
   - **Mitigation**: Start with simple conditions, tackle complex ones last

2. **State dependencies**: Messages depend on multiple flags
   - **Mitigation**: Test thoroughly with different game states

3. **Context inference**: Some messages lack clear triggers
   - **Mitigation**: Review ZIL source code for context

4. **Testing burden**: Each message needs validation
   - **Mitigation**: Batch testing, automated validation

### Rollback Plan

If issues arise:
1. Revert to last working commit
2. Implement smaller batch
3. Add more tests before proceeding

---

## Next Steps

### Immediate Actions

1. **Create helper script** to identify next batch of messages
2. **Start with Phase 1** (scenery messages - easiest wins)
3. **Set up validation loop** to track progress
4. **Commit frequently** to enable easy rollback

### Getting Started

```bash
# 1. Create branch for implementation
git checkout -b feat/complete-remaining-messages

# 2. Generate detailed missing message list
npx tsx scripts/validate-messages.ts > .kiro/testing/missing-messages-detailed.txt

# 3. Start with Phase 1 - scenery messages
# Open src/game/sceneryActions.ts and start adding handlers

# 4. Validate progress
npx tsx scripts/verify-coverage-threshold.ts
```

---

## Estimated Timeline

**Optimistic**: 6 days (focused work)  
**Realistic**: 8-10 days (with testing and polish)  
**Conservative**: 12-14 days (with thorough validation)

**Recommendation**: Plan for 10 days to reach 95% coverage with high quality.

