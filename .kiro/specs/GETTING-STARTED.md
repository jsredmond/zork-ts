# Getting Started with Behavioral Parity Verification

## Quick Start

You're ready to achieve 100% confidence in behavioral parity! Here's how to get started:

### 1. Understand Where We Are

**Current Status**:
- ✅ 99.78% message text accuracy (927/929 production messages)
- ✅ 100% content completeness (all rooms, objects, treasures)
- ✅ 825 tests passing
- ✅ Game is fully playable and completable
- ⚠️ 85% confidence in behavioral parity (not yet verified systematically)

**Goal**: Achieve 100% confidence through exhaustive verification

### 2. Review the Spec

Open and read these files in order:

1. **requirements.md** - Understand what we're trying to achieve
2. **design.md** - Understand how we'll achieve it
3. **tasks.md** - See the step-by-step implementation plan

### 3. Start Task 1

Open `behavioral-parity-verification/tasks.md` and click **"Start task"** on:

```
- [ ] 1. Set up transcript creation environment
```

This will:
- Install original Zork I interpreter (Frotz)
- Create transcript recording workflow
- Set up transcript storage structure

### 4. Follow the 8-Week Plan

**Week 1-3**: Create 100+ reference transcripts
- Play original game systematically
- Record every command and output
- Organize by priority

**Week 3-4**: Build comparison infrastructure
- Enhance comparison tool
- Add state verification
- Create reporting system

**Week 4**: Run initial comparison
- Execute all transcripts
- Identify differences
- Prioritize fixes

**Week 5**: Fix critical differences
- All puzzles
- Core gameplay
- Navigation

**Week 6**: Fix remaining differences
- NPCs
- Combat
- Edge cases

**Week 7**: Daemon timing verification
- Lamp fuel
- Candle burning
- NPC movement

**Week 8**: Final verification
- Run all 100+ transcripts
- Verify 100% pass rate
- Generate final report
- Achieve 100% confidence! 🎉

## What You'll Need

### Tools
- **Frotz** (or similar Z-machine interpreter) - to play original game
- **Text editor** - to create transcript JSON files
- **Terminal** - to run comparison scripts

### Skills
- Playing Zork I (you'll play it a lot!)
- Basic JSON editing
- Running npm scripts
- Reading test output

### Time Commitment
- **8 weeks** total
- **10-15 hours/week** average
- **80-120 hours** total

## Key Concepts

### Reference Transcript
A JSON file containing:
- Command sequence from original game
- Expected output for each command
- Notes about special conditions

Example:
```json
{
  "id": "01-opening-sequence",
  "name": "Opening Sequence",
  "category": "critical",
  "entries": [
    {
      "command": "look",
      "expectedOutput": "West of House\nYou are standing..."
    }
  ]
}
```

### Transcript Comparison
Automated process that:
1. Executes same commands in TypeScript version
2. Compares output character-by-character
3. Reports any differences
4. Verifies game state matches

### Success Criteria
- 100% of critical transcripts pass (100% match)
- 100% of high-priority transcripts pass (98%+ match)
- 100% of medium-priority transcripts pass (98%+ match)
- 98%+ of low-priority transcripts pass (95%+ match)

## Tips for Success

### Creating Transcripts
1. **Play carefully** - Record every command exactly
2. **Copy output exactly** - Including whitespace
3. **Test transcripts** - Run comparison immediately
4. **Document edge cases** - Note special conditions

### Running Comparisons
1. **Start small** - Test one transcript at a time
2. **Fix immediately** - Don't let differences accumulate
3. **Verify state** - Check game state after each command
4. **Run tests** - Ensure no regressions

### Fixing Differences
1. **Understand root cause** - Why does it differ?
2. **Check ZIL source** - What does original do?
3. **Make minimal changes** - Don't over-engineer
4. **Test thoroughly** - Run all transcripts after fix

## Common Questions

### Q: Do I need to play the entire game 100 times?
**A**: No! You'll create transcripts for specific scenarios. Most transcripts are 5-20 commands. You'll play through the game completely a few times, but most work is focused testing.

### Q: What if I find a difference I can't fix?
**A**: Document it! Some differences may be architectural. The goal is to understand and document all differences, not necessarily eliminate them all (though we aim for 100%).

### Q: Can I skip low-priority transcripts?
**A**: You can, but the goal is 100% confidence. Low-priority transcripts cover edge cases that might reveal subtle bugs.

### Q: How do I know when I'm done?
**A**: When all 100+ transcripts pass with 98%+ similarity and you've verified the game state matches after every command. The final report will confirm 100% confidence.

## Getting Help

### Documentation
- [Comprehensive Verification Strategy](../../.kiro/testing/comprehensive-verification-strategy.md)
- [Parity Confidence Report](../../.kiro/testing/parity-confidence-report.md)
- [Message Implementation Guide](../../.kiro/testing/message-implementation-guide.md)

### Tools
- `scripts/compare-transcript.ts` - Transcript comparison tool
- `scripts/verify-all-transcripts.ts` - Batch processing (to be created)
- `scripts/generate-verification-report.ts` - Report generator (to be created)

### Commands
```bash
# Compare single transcript
npx tsx scripts/compare-transcript.ts .kiro/transcripts/critical/01-opening-sequence.json

# Run all transcripts (after batch tool is created)
npm run verify:transcripts

# Generate report
npm run verify:report
```

## Ready to Start?

Open `behavioral-parity-verification/tasks.md` and click **"Start task"** on task 1!

You're about to achieve something amazing: definitive proof that your TypeScript rewrite behaves identically to the original Zork I. Let's do this! 🚀
