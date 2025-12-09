# Achieve 100% Behavioral Parity - Spec Overview

## What This Spec Does

This is a **brand new comprehensive spec** that addresses **everything** needed to achieve true 100% behavioral parity between the original Zork I and the TypeScript rewrite.

## Why We Need This

The previous spec (`behavioral-parity-verification`) had fundamental issues:
- **Only 16.7% of transcripts passing** (7 of 42)
- **Multiple transcripts mislabeled** (testing wrong content)
- **Missing actual puzzle tests** (rainbow, bat, mirror, egg, coffin, cyclops)
- **Critical bugs blocking verification** (dam navigation, troll death)
- **Combat transcripts RNG-limited** (75-93% similarity)

## What's Different

This spec:
1. **Starts with accurate transcripts** - Play the original game and record proper transcripts
2. **Fixes all mislabeled transcripts** - Relabel or recreate incorrectly labeled files
3. **Fixes all critical bugs** - Dam navigation, troll death, puzzle logic
4. **Handles RNG properly** - Re-record combat with deterministic RNG
5. **Systematic approach** - 6 phases from transcripts to final verification
6. **Clear success criteria** - 95%+ pass rate, 100% confidence

## Timeline

**7 weeks total:**
- **Week 1-2:** Create 50+ accurate transcripts from original game
- **Week 2-3:** Fix all critical bugs (dam, troll, puzzles)
- **Week 3-4:** Fix all high-priority issues
- **Week 4-5:** Fix all medium-priority issues
- **Week 5-6:** Fix all low-priority issues
- **Week 6-7:** Final verification and 100% confidence documentation

## Success Criteria

### Transcript Pass Rates
- ✅ Critical: 100% pass (10/10) with 100% similarity
- ✅ High: 100% pass (10/10) with 95%+ similarity
- ✅ Medium: 100% pass (5/5) with 90%+ similarity
- ✅ Low: 100% pass (17/17) with 85%+ similarity
- ✅ Overall: 100% pass (42/42 transcripts)

### Component Verification
- ✅ Puzzles: 100% verified (15/15 puzzles)
- ✅ NPCs: 100% verified (4/4 NPCs)
- ✅ Playthrough: Complete game verified (all treasures, max score)

### Confidence
- ✅ **100% confidence** in behavioral parity

## Files in This Spec

1. **requirements.md** - Complete requirements based on comprehensive assessment
2. **design.md** - Detailed design with 6-phase approach
3. **tasks.md** - 31 major tasks, 150+ subtasks with clear steps
4. **README.md** - This file

## How to Use This Spec

### Phase 1: Start Here
1. Review the requirements document
2. Review the design document
3. Review the tasks document
4. Start with task 1.1: Create transcript audit script

### Execute Tasks in Order
- Follow tasks sequentially
- Complete all subtasks before moving to next major task
- Commit after each major task group
- Verify results before proceeding

### Track Progress
- Mark tasks complete as you go
- Generate phase completion reports
- Verify success criteria at end of each phase

## Key Insights

### 1. Transcripts First
You cannot verify parity with inaccurate transcripts. Phase 1 (transcript creation) is the foundation for everything else.

### 2. Play the Original Game
All transcripts must be recorded from the **original Zork I** (Frotz), not the TypeScript version (except combat transcripts which use deterministic RNG).

### 3. Fix Bugs Systematically
Fix critical bugs first (blocking puzzle completion), then high-priority, then medium, then low.

### 4. Handle RNG Properly
Combat transcripts should be re-recorded using the TypeScript game with seed 12345 to ensure deterministic matching.

### 5. Evidence-Based Confidence
100% confidence requires verifiable evidence: 50+ transcripts, 15+ puzzles, 4 NPCs, complete playthrough.

## Current State vs Target State

### Current State
- 16.7% pass rate (7/42 transcripts)
- Multiple mislabeled transcripts
- Critical bugs blocking verification
- Missing puzzle tests
- Combat RNG mismatches

### Target State
- 100% pass rate (42/42 transcripts)
- All transcripts accurately labeled
- All bugs fixed
- All puzzles tested
- Combat transcripts re-recorded
- 100% confidence declared

## Next Steps

1. **Review this spec** - Read requirements, design, and tasks
2. **Approve the spec** - Confirm this approach makes sense
3. **Start Phase 1** - Begin with transcript audit (task 1.1)
4. **Execute systematically** - Follow tasks in order
5. **Achieve 100% parity** - Complete all 6 phases

## Questions?

This spec is comprehensive and addresses everything identified in the assessment. If you have questions or want to adjust the approach, let's discuss before starting execution.

## Ready to Begin?

Once you approve this spec, we can start with Phase 1, Task 1.1: Create transcript audit script.
