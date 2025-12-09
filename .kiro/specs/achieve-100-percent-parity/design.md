# Design Document: Achieve 100% Behavioral Parity

## Overview

This design outlines the systematic approach to achieve **true 100% behavioral parity** by addressing all identified issues from the comprehensive assessment. The approach prioritizes accurate transcript creation from the original game, fixes critical bugs blocking verification, and systematically eliminates all behavioral differences.

**Key Insight:** We cannot verify parity with inaccurate transcripts. Transcript creation must come first.

## Architecture

### Six-Phase Approach

```
Phase 1: Accurate Transcripts → Phase 2: Critical Bugs → Phase 3: High-Priority →
Phase 4: Medium-Priority → Phase 5: Low-Priority → Phase 6: Final Verification
```

Each phase has clear success criteria and builds on previous phases.

## Components and Interfaces

### Transcript Audit System

```typescript
interface TranscriptAudit {
  transcriptId: string;
  label: string;
  actualContent: string;
  isAccurate: boolean;
  issues: string[];
  recommendation: 'keep' | 'relabel' | 'recreate' | 'delete';
}

interface AuditReport {
  totalTranscripts: number;
  accurate: number;
  mislabeled: number;
  missing: number;
  recommendations: TranscriptAudit[];
}
```

### Transcript Creation Workflow

```typescript
interface TranscriptCreationPlan {
  puzzleId: string;
  puzzleName: string;
  description: string;
  setupSteps: string[];  // How to reach puzzle
  puzzleSteps: string[];  // Puzzle solution
  verificationSteps: string[];  // Verify completion
  expectedOutcome: string;
}

interface RecordingSession {
  game: 'original' | 'typescript';
  rngSeed?: number;  // For TypeScript combat transcripts
  transcripts: TranscriptCreationPlan[];
  recordedFiles: string[];
}
```

### Bug Tracking System

```typescript
interface CriticalBug {
  bugId: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  affectedTranscripts: string[];
  affectedPuzzles: string[];
  status: 'identified' | 'in-progress' | 'fixed' | 'verified';
  fixDescription?: string;
}

interface BugFixPlan {
  bugs: CriticalBug[];
  priorityOrder: string[];  // Bug IDs in fix order
  estimatedEffort: Record<string, number>;  // Hours per bug
}
```

## Data Models

### Known Issues Inventory

#### Critical Bugs (Must Fix)
1. **Dam Navigation** - SE direction not recognized
   - Impact: Cannot reach dam to test puzzle
   - Affected: Dam puzzle transcript (39.3%)
   - Fix: Implement diagonal directions OR find alternative route

2. **Troll Death Sequence** - Body doesn't disappear
   - Impact: Troll remains visible after death
   - Affected: Troll combat transcripts
   - Fix: Update troll death handler to remove body

3. **Cyclops Puzzle** - Logic broken (2.1% similarity)
   - Impact: Cyclops puzzle doesn't work
   - Affected: Cyclops puzzle transcript
   - Fix: Investigate and fix cyclops puzzle logic

4. **Bell/Book/Candle** - Logic broken (6.6% similarity)
   - Impact: Bell puzzle doesn't work
   - Affected: Bell puzzle transcript
   - Fix: Investigate and fix bell puzzle logic

5. **Treasure Collection** - Logic broken (5.1% similarity)
   - Impact: Treasure handling doesn't work
   - Affected: Treasure collection transcript
   - Fix: Investigate and fix treasure logic

#### Mislabeled Transcripts (Must Recreate)
1. **29-rainbow.json** - Claims "Rainbow Puzzle" but tests troll combat
2. **24-bat-encounter.json** - Claims "Bat Encounter" but tests troll combat
3. **Possibly others** - Need full audit

#### Missing Puzzle Transcripts (Must Create)
1. **Rainbow Puzzle** - Wave sceptre at Aragain Falls, walk on rainbow, get pot
2. **Bat Encounter** - Actual bat carrying player
3. **Mirror Room** - Proper mirror interaction
4. **Egg/Nest** - Proper egg handling
5. **Coffin** - Proper coffin opening and sceptre retrieval
6. **Cyclops Feeding** - Proper feeding sequence

#### Combat RNG Issues (Must Re-record)
1. **Thief Encounter** (75.5%) - Re-record with deterministic RNG
2. **Thief Defeat** (82.0%) - Re-record with deterministic RNG
3. **Troll Combat** (82.8%) - Re-record with deterministic RNG

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Transcript Accuracy
*For any* transcript file, the label SHALL accurately describe the content being tested
**Validates: Requirements 1.2, 2.4**

### Property 2: Transcript Completeness
*For any* major puzzle or NPC, there SHALL exist at least one transcript testing that feature
**Validates: Requirements 1.3, 1.4, 5.1, 6.1**

### Property 3: Critical Bug Resolution
*For any* critical bug, the bug SHALL be fixed before dependent transcripts are verified
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 4: Transcript Pass Rate
*For any* transcript category, the pass rate SHALL meet or exceed the target (100% critical, 100% high, 100% medium, 100% low)
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

### Property 5: Puzzle Parity
*For any* major puzzle, the solution sequence SHALL produce identical results in both games
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 6: NPC Parity
*For any* NPC interaction, the behavior SHALL match the original exactly
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 7: Playthrough Completability
*For any* valid playthrough, all 19 treasures SHALL be collectible and 350 points SHALL be achievable
**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

### Property 8: Evidence-Based Confidence
*For any* confidence claim, there SHALL exist verifiable evidence supporting the claim
**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6**

## Error Handling

### Transcript Creation Errors
- **Issue:** Cannot reproduce puzzle in original game
- **Solution:** Document as unsolvable, investigate if bug in original
- **Fallback:** Use documented solution from manual/walkthrough

### Bug Fix Regressions
- **Issue:** Fixing one bug breaks other functionality
- **Solution:** Run full test suite after each fix
- **Fallback:** Revert fix, investigate alternative approach

### RNG Mismatch
- **Issue:** Deterministic RNG still doesn't match transcript
- **Solution:** Re-record transcript with TypeScript game
- **Fallback:** Accept lower similarity, document RNG limitation

### Unreachable Code
- **Issue:** Some game content may be unreachable
- **Solution:** Document as unreachable, verify in original game
- **Fallback:** Accept gap in coverage, note in final report

## Testing Strategy

### Phase 1: Transcript Audit and Creation
**No code changes** - Only transcript work

1. **Audit existing transcripts**
   ```bash
   npx tsx scripts/audit-transcripts.ts
   ```
   - Review each transcript file
   - Verify label matches content
   - Identify mislabeled transcripts
   - Generate audit report

2. **Create missing transcripts**
   - Play original game (Frotz)
   - Record each puzzle solution
   - Save as JSON transcript
   - Verify accuracy

3. **Re-record combat transcripts**
   - Play TypeScript game with seed 12345
   - Record actual combat sequences
   - Replace original transcripts
   - Verify 95%+ similarity

### Phase 2-5: Bug Fixes
**Code changes with verification**

1. **Fix one bug at a time**
2. **Run affected transcripts**
3. **Run full test suite**
4. **Verify no regressions**
5. **Commit fix**

### Phase 6: Final Verification
**Comprehensive testing**

1. **Run all 50+ transcripts**
2. **Verify all puzzles**
3. **Complete full playthrough**
4. **Generate final report**

## Implementation Phases

### Phase 1: Accurate Transcript Creation (Week 1-2)

**Goal:** Create 50+ accurate transcripts from original game

**Tasks:**
1. Audit all existing transcripts (identify mislabeled)
2. Relabel mislabeled transcripts
3. Play original game and record missing puzzles:
   - Rainbow puzzle (wave sceptre, walk on rainbow, get pot)
   - Bat encounter (bat carries player)
   - Mirror room (proper mirror interaction)
   - Egg/nest (proper egg handling)
   - Coffin (proper coffin opening)
   - Cyclops feeding (proper feeding)
   - Any other missing puzzles
4. Re-record combat transcripts with TypeScript + seed 12345:
   - Thief encounter
   - Thief defeat
   - Troll combat
5. Verify all transcripts are accurate and properly labeled

**Deliverables:**
- Audit report (mislabeled transcripts identified)
- 50+ accurate transcripts
- All puzzles covered
- All NPCs covered
- Combat transcripts re-recorded

**Success Criteria:**
- Every transcript label matches content
- Every major puzzle has transcript
- Every NPC has transcript
- Zero mislabeled transcripts

### Phase 2: Fix Critical Bugs (Week 2-3)

**Goal:** Fix all bugs blocking puzzle completion

**Tasks:**
1. Fix dam navigation (SE direction or alternative route)
2. Fix troll death sequence (body disappears, passages open)
3. Fix cyclops puzzle logic (2.1% → 95%+)
4. Fix bell/book/candle logic (6.6% → 95%+)
5. Fix treasure collection logic (5.1% → 95%+)
6. Verify all critical transcripts pass

**Deliverables:**
- Dam navigation working
- Troll death working
- Cyclops puzzle working
- Bell puzzle working
- Treasure collection working
- All critical transcripts at 95%+

**Success Criteria:**
- 100% of critical transcripts pass (10/10)
- All critical puzzles completable
- No blocking bugs remain

### Phase 3: Fix High-Priority Issues (Week 3-4)

**Goal:** Fix all high-priority behavioral differences

**Tasks:**
1. Fix mirror room puzzle (88.0% → 95%+)
2. Fix coffin puzzle (88.0% → 95%+)
3. Fix egg/nest puzzle (81.3% → 95%+)
4. Fix cyclops feeding (92.1% → 95%+)
5. Verify all high-priority transcripts pass

**Deliverables:**
- All high-priority puzzles working
- All high-priority transcripts at 95%+

**Success Criteria:**
- 100% of high-priority transcripts pass (10/10)
- Average similarity 95%+

### Phase 4: Fix Medium-Priority Issues (Week 4-5)

**Goal:** Fix all medium-priority edge cases

**Tasks:**
1. Fix error messages (55.6% → 90%+)
2. Fix inventory limits (17.8% → 90%+)
3. Fix unusual commands (58.9% → 90%+)
4. Fix death/resurrection (28.7% → 90%+)
5. Fix save/restore (59.7% → 90%+)
6. Verify all medium-priority transcripts pass

**Deliverables:**
- All medium-priority edge cases working
- All medium-priority transcripts at 90%+

**Success Criteria:**
- 100% of medium-priority transcripts pass (5/5)
- Average similarity 90%+

### Phase 5: Fix Low-Priority Issues (Week 5-6)

**Goal:** Fix all low-priority timing and flavor text

**Tasks:**
1. Fix daemon timing (lamp fuel, candle, NPC movement)
2. Fix flavor text and scenery descriptions
3. Implement missing easter eggs
4. Fix verbose/brief mode handling
5. Verify all low-priority transcripts pass

**Deliverables:**
- All daemon timing working
- All flavor text matching
- All easter eggs implemented
- 17/17 low-priority transcripts at 85%+

**Success Criteria:**
- 100% of low-priority transcripts pass (17/17)
- Average similarity 85%+

### Phase 6: Final Verification (Week 6-7)

**Goal:** Achieve and document 100% confidence

**Tasks:**
1. Run all 50+ transcripts
2. Verify all 15+ puzzles
3. Verify all 4 NPCs
4. Complete full playthrough (all treasures, 350 points)
5. Generate comprehensive final report
6. Document 100% confidence achievement

**Deliverables:**
- Final verification report
- 100% confidence documentation
- Complete evidence package

**Success Criteria:**
- 100% overall pass rate (42/42 transcripts)
- 100% puzzle verification (15/15)
- 100% NPC verification (4/4)
- Complete playthrough verified
- 100% confidence declared

## Success Metrics

### Overall Metrics
- **Transcript Pass Rate:** 100% (42/42 transcripts)
- **Average Similarity:** 95%+
- **Puzzle Verification:** 100% (15/15 puzzles)
- **NPC Verification:** 100% (4/4 NPCs)
- **Playthrough Verification:** 100% (all treasures, max score)
- **Confidence Level:** 100%

### Per-Phase Metrics
| Phase | Metric | Target |
|-------|--------|--------|
| 1 | Transcripts created | 50+ |
| 1 | Mislabeled fixed | 100% |
| 2 | Critical bugs fixed | 100% |
| 2 | Critical transcripts pass | 100% |
| 3 | High-priority transcripts pass | 100% |
| 4 | Medium-priority transcripts pass | 100% |
| 5 | Low-priority transcripts pass | 100% |
| 6 | Overall confidence | 100% |

## Risk Mitigation

### High-Risk Areas

1. **Transcript Creation Time** - May take longer than 2 weeks
   - Mitigation: Prioritize critical/high-priority puzzles first
   - Fallback: Accept fewer transcripts (40 minimum)

2. **Critical Bugs Unfixable** - Some bugs may be architectural
   - Mitigation: Investigate thoroughly before declaring unfixable
   - Fallback: Document as known limitation, extend timeline to fix

3. **RNG Still Doesn't Match** - Re-recorded combat may still differ
   - Mitigation: Try multiple seeds, find best match
   - Fallback: Adjust RNG implementation to match original patterns

4. **Timeline Overrun** - May take longer than 7 weeks
   - Mitigation: Focus on critical/high-priority first
   - Fallback: Extend timeline as needed to achieve 100%

## Timeline Estimate

- **Phase 1 (Transcripts):** 2 weeks
- **Phase 2 (Critical Bugs):** 1 week
- **Phase 3 (High-Priority):** 1 week
- **Phase 4 (Medium-Priority):** 1 week
- **Phase 5 (Low-Priority):** 1 week
- **Phase 6 (Verification):** 1 week

**Total:** 7 weeks for 100% parity

## Conclusion

Achieving 100% behavioral parity requires starting with accurate transcripts. The current 16.7% pass rate is due to mislabeled transcripts and critical bugs, not fundamental architectural issues. By systematically creating accurate transcripts and fixing identified bugs, we will achieve true 100% parity (42/42 transcripts passing) with full confidence and evidence.
