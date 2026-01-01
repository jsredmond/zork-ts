# Project Structure

## TypeScript Source Port (`src/`)

### Entry Point
- **src/main.ts** - Game entry point and main loop

### Core Modules

#### `src/engine/`
Game engine and mechanics:
- **executor.ts** - Command execution
- **daemons.ts** - Timed events (lamp, candle, NPCs)
- **events.ts** - Event system
- **combat.ts** - Combat system
- **lighting.ts** - Light source management
- **weapons.ts** - Weapon mechanics (sword glow)
- **actors.ts** - Actor management
- **troll.ts**, **thief.ts**, **cyclops.ts** - NPC behaviors

#### `src/game/`
Game content and state:
- **state.ts** - Game state management
- **actions.ts** - Verb action handlers
- **objects.ts** - Object definitions and behaviors
- **rooms.ts** - Room class
- **scoring.ts** - Score tracking
- **death.ts** - Death and resurrection
- **data/** - Room and object data definitions
- **factories/** - Game initialization

#### `src/parser/`
Natural language parsing:
- **lexer.ts** - Tokenization
- **parser.ts** - Command parsing
- **vocabulary.ts** - Word definitions
- **feedback.ts** - Parser feedback messages

#### `src/io/`
Input/output:
- **terminal.ts** - Terminal I/O with status bar
- **display.ts** - Output formatting

#### `src/persistence/`
Save/restore:
- **serializer.ts** - Game state serialization
- **storage.ts** - File storage

#### `src/parity/`
Parity alignment tools:
- **ParserConsistencyEngine.ts** - Parser consistency
- **StatusBarNormalizer.ts** - Status bar normalization
- **ObjectInteractionHarmonizer.ts** - Object interaction alignment
- **AtmosphericMessageAligner.ts** - Message alignment
- **VocabularyAligner.ts** - Vocabulary alignment
- **StateSynchronizationManager.ts** - State sync

#### `src/testing/`
Test infrastructure:
- **exhaustiveParityValidator.ts** - Parity validation
- **spotTesting/** - Spot testing system
- **recording/** - Transcript recording
- **comprehensiveParityAnalysis/** - Analysis tools

## Reference Files

### `reference/zil/`
Original ZIL source files:
- **zork1.zil** - Main include file
- **gmacros.zil**, **gparser.zil**, etc. - Generic engine
- **1dungeon.zil**, **1actions.zil** - Zork I specific content

### `reference/COMPILED/`
- **zork1.z3** - Pre-compiled Z-machine game file

## Scripts (`scripts/`)
Utility scripts for development, testing, and analysis.

## Configuration Files
- **package.json** - npm configuration
- **tsconfig.json** - TypeScript config
- **tsconfig.build.json** - Build-specific TypeScript config
- **vitest.config.ts** - Vitest test configuration
