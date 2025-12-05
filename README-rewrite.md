# Zork I - Modern Rewrite

A modern TypeScript rewrite of the classic Zork I interactive fiction game.

## Status: World Content Complete ✓

All rooms and objects from the original Zork I have been successfully extracted and implemented. The game is fully playable from start to finish with all 19 treasures accessible and all puzzles solvable.

## Project Structure

```
src/
├── main.ts                 # Entry point
├── io/
│   ├── terminal.ts        # Terminal I/O handling
│   └── display.ts         # Output formatting
├── parser/
│   ├── lexer.ts           # Tokenization
│   ├── parser.ts          # Command parsing
│   ├── vocabulary.ts      # Word definitions
│   └── syntax.ts          # Syntax patterns
├── game/
│   ├── state.ts           # Game state management
│   ├── objects.ts         # Object system
│   ├── rooms.ts           # Room definitions
│   ├── actions.ts         # Action handlers
│   └── verbs.ts           # Verb implementations
├── engine/
│   ├── executor.ts        # Command execution
│   ├── rules.ts           # Game rules engine
│   └── events.ts          # Event system
└── persistence/
    ├── serializer.ts      # State serialization
    └── storage.ts         # File I/O
```

## Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Requirements

- Node.js 20+
- TypeScript 5.3+

## Testing

This project uses:
- **Vitest** for unit and integration testing
- **fast-check** for property-based testing

## Features

### Complete World Content ✓
- **110 rooms** - All locations from the original game
- **121 objects** - All items, treasures, and interactive elements
- **19 treasures** - Complete treasure collection worth 350 points
- **Full puzzle suite** - All original puzzles implemented and solvable

### Game Systems
- ✓ Natural language parser with comprehensive vocabulary
- ✓ Room navigation with conditional exits
- ✓ Object manipulation and inventory management
- ✓ Combat system (thief, troll, cyclops)
- ✓ NPC behaviors and interactions
- ✓ Puzzle mechanics (dam, mirror, rainbow, etc.)
- ✓ Scoring system (0-350 points)
- ✓ Lighting and visibility system
- ✓ Game state persistence (save/restore)
- ✓ Event and daemon systems
- ✓ Terminal-based UI

### Quality Assurance
- **678 tests** across 42 test files
- **100% pass rate** with no flaky tests
- Property-based testing with fast-check
- Comprehensive integration tests
- Transcript comparison testing
- Puzzle verification tests

## Content Statistics

| Category | Count | Status |
|----------|-------|--------|
| Rooms | 110 | ✓ Complete |
| Objects | 121 | ✓ Complete |
| Treasures | 19 | ✓ Complete |
| Tests | 678 | ✓ All Passing |

## Known Limitations

- Terminal-based interface only (no graphical UI)
- Some advanced ZIL features not yet implemented
- Parser may not recognize all original game synonyms
- Save/restore functionality uses JSON format (not original format)

## Development Status

**World Content:** Complete and verified  
**Core Systems:** Fully implemented and tested  
**Game Completability:** Verified - game can be completed from start to finish

See `.kiro/specs/complete-world-content/tasks.md` for content extraction details.  
See `docs/COMPLETENESS_REPORT.md` for full verification report.
