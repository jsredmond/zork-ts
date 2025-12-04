# Full Game Playthrough Checklist

This document provides a checklist for manually verifying the complete Zork I rewrite through actual gameplay.

## Prerequisites
- Run the game: `npm start` or `node dist/main.js`
- Have a walkthrough or solution guide available for reference

## Basic Functionality Tests

### Starting the Game
- [ ] Game displays opening text
- [ ] Player starts at West of House
- [ ] LOOK command works
- [ ] INVENTORY command shows empty-handed

### Basic Commands
- [ ] Movement commands work (NORTH, SOUTH, EAST, WEST, UP, DOWN, IN, OUT)
- [ ] Abbreviations work (N, S, E, W, U, D, I, L, X)
- [ ] EXAMINE works on objects
- [ ] TAKE and DROP work
- [ ] OPEN and CLOSE work
- [ ] READ works on readable items

### Game Systems
- [ ] Score starts at 0
- [ ] SCORE command displays current score and rank
- [ ] Moves counter increments
- [ ] SAVE command creates save file
- [ ] RESTORE command loads save file
- [ ] QUIT command exits game
- [ ] RESTART command restarts game

## Major Puzzle Areas

### House Area
- [ ] Can enter house through window
- [ ] Can navigate living room, kitchen, attic
- [ ] Trophy case is accessible
- [ ] Mailbox puzzle works (open, take leaflet, read leaflet)

### Underground Areas
- [ ] Can access cellar
- [ ] Trap door works
- [ ] Can navigate maze areas
- [ ] Lighting system works (lamp required in dark areas)
- [ ] Grue warnings appear in darkness

### Treasure Collection
- [ ] Can find and collect treasures
- [ ] Can place treasures in trophy case
- [ ] Score increases when treasures are scored
- [ ] All 19 treasures are obtainable

### NPC Interactions
- [ ] Thief appears and behaves correctly
- [ ] Troll blocks passage and can be defeated
- [ ] Cyclops puzzle works (feeding and water)
- [ ] Combat system works with sword

### Special Puzzles
- [ ] Dam controls work
- [ ] Reservoir water level changes
- [ ] Rainbow appears under correct conditions
- [ ] Rope and basket mechanics work
- [ ] Mirror room puzzle works
- [ ] Coffin and sceptre puzzle works

## Winning the Game
- [ ] Can collect all 19 treasures
- [ ] Can achieve maximum score of 350 points
- [ ] Game recognizes completion
- [ ] Final rank is "Master Adventurer"

## Error Handling
- [ ] Invalid commands produce appropriate error messages
- [ ] Game doesn't crash on unexpected input
- [ ] Parser handles ambiguous references
- [ ] Game handles edge cases gracefully

## Performance
- [ ] Commands respond quickly (< 100ms)
- [ ] No noticeable lag during gameplay
- [ ] Save/restore completes quickly (< 1 second)
- [ ] Memory usage remains reasonable

## Content Verification
- [ ] All room descriptions match original
- [ ] All object descriptions match original
- [ ] All messages and responses match original tone
- [ ] No typos or grammatical errors

## Notes
Record any issues, bugs, or discrepancies found during playthrough:

---

## Completion
Date: _______________
Tester: _______________
Result: [ ] PASS [ ] FAIL
Issues Found: _______________
