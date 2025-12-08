# Transcript Audit Report

Generated: 2025-12-08T23:27:42.024Z

## Summary

- Total Transcripts: 42
- Accurate: 13 (31.0%)
- Mislabeled: 29 (69.0%)
- Duplicate Groups: 7
- Missing Puzzles: 4
- Missing NPCs: 0

## Mislabeled Transcripts

### 01-opening-sequence - Opening Sequence

- **File**: critical/01-opening-sequence.json
- **Description**: Initial game start, examining and opening the mailbox, taking and reading the leaflet
- **Priority**: critical
- **Actual Content**: mailbox
- **Recommendation**: keep
- **Issues**:
  - Possible duplicate of: 00-sample-template

### 02-mailbox-puzzle - Mailbox Puzzle Complete Interaction

- **File**: critical/02-mailbox-puzzle.json
- **Description**: Complete mailbox interaction sequence including opening, closing, examining contents, and manipulating the leaflet
- **Priority**: critical
- **Actual Content**: mailbox
- **Recommendation**: keep
- **Issues**:
  - Possible duplicate of: 00-sample-template, 01-opening-sequence

### 03-trap-door - Trap Door Entry

- **File**: critical/03-trap-door.json
- **Description**: Entering the house through the window, moving the rug, opening the trap door, and descending into the cellar
- **Priority**: critical
- **Actual Content**: bat, combat, mailbox, trap-door, treasure
- **Recommendation**: investigate
- **Issues**:
  - Content includes combat but label doesn't mention it

### 04-lamp-darkness - Lamp and Darkness Navigation

- **File**: critical/04-lamp-darkness.json
- **Description**: Taking the lamp, turning it on/off, and navigating dark areas with the grue warning
- **Priority**: critical
- **Actual Content**: bat, combat, dam, trap-door, treasure
- **Recommendation**: investigate
- **Issues**:
  - Content includes combat but label doesn't mention it

### 06-dam-puzzle - Dam and Bolt Puzzle

- **File**: critical/06-dam-puzzle.json
- **Description**: Complete sequence: navigating to dam, getting wrench, pushing yellow button, and turning bolt to open sluice gates
- **Priority**: critical
- **Actual Content**: bat, combat, dam, trap-door, treasure, troll
- **Recommendation**: relabel
- **Issues**:
  - Content tests troll but label doesn't mention it
  - Content includes combat but label doesn't mention it
  - Possible duplicate of: 05-troll-puzzle

### 07-cyclops-puzzle - Cyclops Puzzle

- **File**: critical/07-cyclops-puzzle.json
- **Description**: Encountering the cyclops and solving the puzzle by saying 'Ulysses'
- **Priority**: critical
- **Actual Content**: combat, cyclops, error-messages, treasure
- **Recommendation**: investigate
- **Issues**:
  - Content includes combat but label doesn't mention it

### 10-treasure-collection - Treasure Collection

- **File**: critical/10-treasure-collection.json
- **Description**: Collecting treasures and depositing them in the trophy case for points
- **Priority**: critical
- **Actual Content**: unknown
- **Recommendation**: keep
- **Issues**:
  - Possible duplicate of: 08-rope-basket

### 20-thief-encounter - Thief Encounter

- **File**: high/20-thief-encounter.json
- **Description**: Encountering the thief, observing stealing behavior, combat attempts, and thief fleeing
- **Priority**: high
- **Actual Content**: bat, combat, dam, death, trap-door, treasure, troll
- **Recommendation**: relabel
- **Issues**:
  - Content tests troll but label doesn't mention it

### 21-thief-defeat-proper - Thief Defeat and Item Recovery

- **File**: high/21-thief-defeat-proper.json
- **Description**: Encountering the thief, having items stolen, defeating the thief in combat, and recovering stolen treasures
- **Priority**: high
- **Actual Content**: bat, combat, dam, death, rainbow, thief, trap-door, treasure, troll
- **Recommendation**: relabel
- **Issues**:
  - Content tests troll but label doesn't mention it

### 21-thief-defeat - Thief Defeat

- **File**: high/21-thief-defeat.json
- **Description**: Defeating thief and recovering items
- **Priority**: high
- **Actual Content**: bat, combat, dam, death, trap-door, treasure, troll
- **Recommendation**: relabel
- **Issues**:
  - Content tests troll but label doesn't mention it
  - Possible duplicate of: 20-thief-encounter

### 22-troll-combat - Troll Combat

- **File**: high/22-troll-combat.json
- **Description**: Detailed troll combat sequence
- **Priority**: high
- **Actual Content**: bat, combat, dam, death, trap-door, treasure, troll
- **Recommendation**: keep
- **Issues**:
  - Possible duplicate of: 20-thief-encounter, 21-thief-defeat

### 23-cyclops-feeding - Cyclops Feeding

- **File**: high/23-cyclops-feeding.json
- **Description**: Feeding cyclops alternative solution
- **Priority**: high
- **Actual Content**: bat, combat, cyclops, dam, trap-door, treasure, troll
- **Recommendation**: relabel
- **Issues**:
  - Content tests troll but label doesn't mention it
  - Content includes combat but label doesn't mention it

### 24-bat-encounter - Bat Encounter

- **File**: high/24-bat-encounter.json
- **Description**: Bat carrying player
- **Priority**: high
- **Actual Content**: bat, combat, dam, trap-door, treasure, troll
- **Recommendation**: relabel
- **Issues**:
  - Content tests troll but label doesn't mention it
  - Content includes combat but label doesn't mention it
  - Possible duplicate of: 05-troll-puzzle, 06-dam-puzzle

### 25-maze-navigation - Maze Navigation

- **File**: high/25-maze-navigation.json
- **Description**: Navigating through maze
- **Priority**: high
- **Actual Content**: bat, combat, dam, trap-door, treasure
- **Recommendation**: investigate
- **Issues**:
  - Content includes combat but label doesn't mention it
  - Possible duplicate of: 04-lamp-darkness

### 26-mirror-room - Mirror Room

- **File**: high/26-mirror-room.json
- **Description**: Mirror room puzzle
- **Priority**: high
- **Actual Content**: bat, combat, dam, death, mirror, trap-door, treasure, troll
- **Recommendation**: relabel
- **Issues**:
  - Content tests troll but label doesn't mention it
  - Content includes combat but label doesn't mention it

### 27-coffin-puzzle - Coffin Puzzle

- **File**: high/27-coffin-puzzle.json
- **Description**: Opening coffin and getting sceptre
- **Priority**: high
- **Actual Content**: bat, coffin, combat, dam, death, trap-door, treasure, troll
- **Recommendation**: relabel
- **Issues**:
  - Content tests troll but label doesn't mention it
  - Content includes combat but label doesn't mention it

### 28-egg-nest - Egg and Nest Puzzle

- **File**: high/28-egg-nest.json
- **Description**: Egg and nest puzzle solution
- **Priority**: high
- **Actual Content**: bat, combat, dam, death, egg-nest, trap-door, treasure, troll
- **Recommendation**: relabel
- **Issues**:
  - Content tests troll but label doesn't mention it
  - Content includes combat but label doesn't mention it

### 29-rainbow - Rainbow Puzzle

- **File**: high/29-rainbow.json
- **Description**: Rainbow and pot of gold
- **Priority**: high
- **Actual Content**: bat, combat, dam, trap-door, treasure, troll
- **Recommendation**: recreate
- **Issues**:
  - Label claims "rainbow" but content doesn't test rainbow puzzle
  - Content tests troll but label doesn't mention it
  - Content includes combat but label doesn't mention it
  - Possible duplicate of: 05-troll-puzzle, 06-dam-puzzle, 24-bat-encounter

### 40-error-messages - Error Messages

- **File**: medium/40-error-messages.json
- **Description**: Testing various invalid commands and error conditions to verify error message parity
- **Priority**: medium
- **Actual Content**: combat, mailbox
- **Recommendation**: investigate
- **Issues**:
  - Content includes combat but label doesn't mention it

### 41-inventory-limits - Inventory Limits

- **File**: medium/41-inventory-limits.json
- **Description**: Testing inventory capacity limits and weight restrictions
- **Priority**: medium
- **Actual Content**: bat, combat, dam, mailbox, trap-door, treasure
- **Recommendation**: investigate
- **Issues**:
  - Content includes combat but label doesn't mention it

### 43-death-resurrection - Death and Resurrection

- **File**: medium/43-death-resurrection.json
- **Description**: Testing death mechanics and resurrection by the player's guardian spirit
- **Priority**: medium
- **Actual Content**: bat, combat, dam, death, mailbox, trap-door, treasure
- **Recommendation**: investigate
- **Issues**:
  - Content includes combat but label doesn't mention it

### 60-flavor-text - Flavor Text and Scenery

- **File**: low/60-flavor-text.json
- **Description**: Testing flavor text responses when examining scenery and non-interactive objects
- **Priority**: low
- **Actual Content**: unknown
- **Recommendation**: keep
- **Issues**:
  - Possible duplicate of: 08-rope-basket, 10-treasure-collection

### 62-alternative-paths - Alternative Solution Paths

- **File**: low/62-alternative-paths.json
- **Description**: Testing non-optimal but valid solution paths and alternative approaches to puzzles
- **Priority**: low
- **Actual Content**: mailbox
- **Recommendation**: keep
- **Issues**:
  - Possible duplicate of: 00-sample-template, 01-opening-sequence, 02-mailbox-puzzle

### 63-easter-eggs - Easter Eggs and Hidden Features

- **File**: low/63-easter-eggs.json
- **Description**: Testing hidden features, jokes, and easter eggs in the game
- **Priority**: low
- **Actual Content**: unknown
- **Recommendation**: recreate
- **Issues**:
  - Label claims "egg/nest" but content doesn't test egg puzzle
  - Possible duplicate of: 08-rope-basket, 10-treasure-collection, 60-flavor-text

### 64-verbose-mode - Verbose Mode Testing

- **File**: low/64-verbose-mode.json
- **Description**: Testing verbose, brief, and superbrief display modes
- **Priority**: low
- **Actual Content**: mailbox, verbose-mode
- **Recommendation**: keep
- **Issues**:
  - Possible duplicate of: 42-unusual-commands

### 70-lamp-fuel-early - Lamp Fuel Consumption - Early Game

- **File**: timing/70-lamp-fuel-early.json
- **Description**: Testing lamp fuel consumption timing in the early game stages
- **Priority**: low
- **Actual Content**: bat, combat, mailbox, treasure
- **Recommendation**: investigate
- **Issues**:
  - Content includes combat but label doesn't mention it

### 71-lamp-fuel-warning - Lamp Fuel Warning Messages

- **File**: timing/71-lamp-fuel-warning.json
- **Description**: Testing lamp dimming warning messages as fuel runs low
- **Priority**: low
- **Actual Content**: unknown
- **Recommendation**: keep
- **Issues**:
  - Possible duplicate of: 08-rope-basket, 10-treasure-collection, 60-flavor-text, 63-easter-eggs

### 72-candle-burning - Candle Burning Progression

- **File**: timing/72-candle-burning.json
- **Description**: Testing candle burning timing and warning messages
- **Priority**: low
- **Actual Content**: bell-book-candle
- **Recommendation**: keep
- **Issues**:
  - Possible duplicate of: 09-bell-book-candle

### 76-multiple-daemons - Multiple Daemon Interactions

- **File**: timing/76-multiple-daemons.json
- **Description**: Testing multiple daemons firing simultaneously and their interaction timing
- **Priority**: low
- **Actual Content**: bell-book-candle
- **Recommendation**: keep
- **Issues**:
  - Possible duplicate of: 09-bell-book-candle, 72-candle-burning

## Missing Puzzle Transcripts

The following major puzzles do not have dedicated transcripts:

- lamp-darkness
- rope-basket
- treasure-collection
- mirror-room

## All Transcripts

| ID | Label | Priority | Content | Issues | Recommendation |
|----|-------|----------|---------|--------|----------------|
| 00-sample-template | Sample Transcript Template | critical | mailbox | ✓ | keep |
| 01-opening-sequence | Opening Sequence | critical | mailbox | ⚠️ 1 | keep |
| 02-mailbox-puzzle | Mailbox Puzzle Complete Interaction | critical | mailbox | ⚠️ 1 | keep |
| 03-trap-door | Trap Door Entry | critical | bat, combat, mailbox, trap-door, treasure | ⚠️ 1 | investigate |
| 04-lamp-darkness | Lamp and Darkness Navigation | critical | bat, combat, dam, trap-door, treasure | ⚠️ 1 | investigate |
| 05-troll-puzzle | Troll Encounter and Defeat | critical | bat, combat, dam, trap-door, treasure, troll | ✓ | keep |
| 06-dam-puzzle | Dam and Bolt Puzzle | critical | bat, combat, dam, trap-door, treasure, troll | ⚠️ 3 | relabel |
| 07-cyclops-puzzle | Cyclops Puzzle | critical | combat, cyclops, error-messages, treasure | ⚠️ 1 | investigate |
| 08-rope-basket | Rope and Basket Puzzle | critical | unknown | ✓ | keep |
| 09-bell-book-candle | Bell, Book, and Candle Puzzle | critical | bell-book-candle | ✓ | keep |
| 10-treasure-collection | Treasure Collection | critical | unknown | ⚠️ 1 | keep |
| 20-thief-encounter | Thief Encounter | high | bat, combat, dam, death, trap-door, treasure, troll | ⚠️ 1 | relabel |
| 21-thief-defeat-proper | Thief Defeat and Item Recovery | high | bat, combat, dam, death, rainbow, thief, trap-door, treasure, troll | ⚠️ 1 | relabel |
| 21-thief-defeat | Thief Defeat | high | bat, combat, dam, death, trap-door, treasure, troll | ⚠️ 2 | relabel |
| 22-troll-combat | Troll Combat | high | bat, combat, dam, death, trap-door, treasure, troll | ⚠️ 1 | keep |
| 23-cyclops-feeding | Cyclops Feeding | high | bat, combat, cyclops, dam, trap-door, treasure, troll | ⚠️ 2 | relabel |
| 24-bat-encounter | Bat Encounter | high | bat, combat, dam, trap-door, treasure, troll | ⚠️ 3 | relabel |
| 25-maze-navigation | Maze Navigation | high | bat, combat, dam, trap-door, treasure | ⚠️ 2 | investigate |
| 26-mirror-room | Mirror Room | high | bat, combat, dam, death, mirror, trap-door, treasure, troll | ⚠️ 2 | relabel |
| 27-coffin-puzzle | Coffin Puzzle | high | bat, coffin, combat, dam, death, trap-door, treasure, troll | ⚠️ 2 | relabel |
| 28-egg-nest | Egg and Nest Puzzle | high | bat, combat, dam, death, egg-nest, trap-door, treasure, troll | ⚠️ 2 | relabel |
| 29-rainbow | Rainbow Puzzle | high | bat, combat, dam, trap-door, treasure, troll | ⚠️ 4 | recreate |
| 40-error-messages | Error Messages | medium | combat, mailbox | ⚠️ 1 | investigate |
| 41-inventory-limits | Inventory Limits | medium | bat, combat, dam, mailbox, trap-door, treasure | ⚠️ 1 | investigate |
| 42-unusual-commands | Unusual Commands | medium | mailbox, verbose-mode | ✓ | keep |
| 43-death-resurrection | Death and Resurrection | medium | bat, combat, dam, death, mailbox, trap-door, treasure | ⚠️ 1 | investigate |
| 44-save-restore | Save and Restore | medium | mailbox, save-restore | ✓ | keep |
| 60-flavor-text | Flavor Text and Scenery | low | unknown | ⚠️ 1 | keep |
| 61-rare-interactions | Rare Interactions | low | verbose-mode | ✓ | keep |
| 62-alternative-paths | Alternative Solution Paths | low | mailbox | ⚠️ 1 | keep |
| 63-easter-eggs | Easter Eggs and Hidden Features | low | unknown | ⚠️ 2 | recreate |
| 64-verbose-mode | Verbose Mode Testing | low | mailbox, verbose-mode | ⚠️ 1 | keep |
| 70-lamp-fuel-early | Lamp Fuel Consumption - Early Game | low | bat, combat, mailbox, treasure | ⚠️ 1 | investigate |
| 71-lamp-fuel-warning | Lamp Fuel Warning Messages | low | unknown | ⚠️ 1 | keep |
| 72-candle-burning | Candle Burning Progression | low | bell-book-candle | ⚠️ 1 | keep |
| 73-thief-movement | Thief Movement Timing | low | treasure | ✓ | keep |
| 74-cyclops-movement | Cyclops Movement Timing | low | cyclops | ✓ | keep |
| 75-bat-timing | Bat Encounter Timing | low | bat | ✓ | keep |
| 76-multiple-daemons | Multiple Daemon Interactions | low | bell-book-candle | ⚠️ 1 | keep |
| 77-troll-daemon | Troll Daemon Timing | low | combat, troll | ✓ | keep |
| 78-flood-control-dam | Flood Control Dam Timing | low | dam | ✓ | keep |
| 79-resurrection-timing | Resurrection Timing | low | death, mailbox, save-restore | ✓ | keep |
