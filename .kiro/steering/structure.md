# Project Structure

## TypeScript Rewrite (`src/`)

### Entry Point
- **src/main.ts** - Game entry point and main loop

### Core Modules

#### `src/engine/`
Game engine and mechanics:
- **executor.ts** - Command execution
- **daemons.ts** - Timed events (lamp, candle, NPCs)
- **combat.ts** - Combat system
- **lighting.ts** - Light source management
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

#### `src/io/`
Input/output:
- **terminal.ts** - Terminal I/O with status bar
- **display.ts** - Output formatting

#### `src/persistence/`
Save/restore:
- **serializer.ts** - Game state serialization
- **storage.ts** - File storage

#### `src/testing/`
Test infrastructure and verification tools

## Original ZIL Source (Reference)

- **zork1.zil** - Main include file
- **gmacros.zil**, **gparser.zil**, etc. - Generic engine
- **1dungeon.zil**, **1actions.zil** - Zork I specific content
- **COMPILED/zork1.z3** - Pre-compiled game file
