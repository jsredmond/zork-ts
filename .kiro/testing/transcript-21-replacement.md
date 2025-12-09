# Transcript 21 Replacement

## Issue with Original Transcript

The original transcript `.kiro/transcripts/high/21-thief-defeat.json` has fundamental issues:

1. **Mislabeled**: Claims to test "Thief Defeat" but actually tests troll combat
2. **No thief content**: The thief never appears in the transcript
3. **Duplicate content**: Tests the same troll combat as transcript 05 (critical troll puzzle)
4. **RNG mismatch**: Expects different combat outcomes than our deterministic RNG produces

## New Transcript Created

Created `.kiro/transcripts/high/21-thief-defeat-proper.json` which properly tests:

### Thief Defeat Scenario
1. **Setup**: Get sword and lamp from living room
2. **Navigate dungeon**: Defeat troll to access deeper areas
3. **Collect treasures**: Get plastic bags from dam room, pot of gold from rainbow
4. **Encounter thief**: Find thief in Small Cave
5. **Combat**: Defeat thief in 2 hits (unconscious, then killed)
6. **Recovery**: Collect dropped items (stiletto, bag with stolen emerald)
7. **Verification**: Check inventory to confirm recovered items

### Key Features
- **Proper thief encounter**: Thief appears in Small Cave
- **Combat sequence**: 
  - Hit 1: "The thief is battered into unconsciousness." + stiletto drops
  - Hit 2: "The unconscious thief cannot defend himself: He dies." + death message + "The robber's booty remains."
- **Item recovery**: Stiletto, bag, and stolen treasures become available
- **Sword glow**: Sword glows when near thief, stops glowing after thief dies

### Expected Outcomes
- Thief is defeated in combat
- Stolen items are recovered from thief's bag
- Player can collect stiletto (thief's weapon)
- Demonstrates proper NPC defeat and item recovery mechanics

## Recommendations

1. **Rename original transcript**: Move `21-thief-defeat.json` to `21-troll-combat-alt.json`
2. **Use new transcript**: Adopt `21-thief-defeat-proper.json` as the official thief defeat test
3. **Update transcript 20**: Also mislabeled - should test thief encounter/stealing, not troll

## Testing Notes

The new transcript:
- Uses realistic game progression (defeat troll first to access deeper areas)
- Includes treasure collection to demonstrate thief's stealing behavior
- Tests proper NPC death sequence (unconscious → dead → items drop)
- Verifies item recovery mechanics
- Can be recorded from actual gameplay once thief behavior is fully implemented

## Next Steps

1. Record this transcript from actual gameplay to get exact output
2. Verify thief behavior matches original game
3. Test transcript comparison to ensure 95%+ similarity
4. Update task 14.4.2 to reference new transcript
