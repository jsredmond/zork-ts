# Technology Stack

## TypeScript Rewrite

### Runtime
- **Node.js** with TypeScript (tsx for execution)
- **Vitest** for testing

### Common Commands

```bash
# Run the game
npm run dev

# Run tests
npm test

# Run specific test file
npx vitest run src/game/actions.test.ts
```

### Key Dependencies
- `tsx` - TypeScript execution
- `vitest` - Test framework
- `readline` - Terminal input handling

## Original ZIL Source (Reference Only)

### Language
**ZIL (Zork Implementation Language)** - Infocom's proprietary LISP dialect

### Historical Compiler
- **ZILCH**: Original compiler (no longer available)
- **ZILF** (http://zilf.io): Modern open-source alternative

### File Types
- `.zil` - ZIL source code (reference)
- `.z3` - Compiled Z-machine game file

## Playing Options

1. **TypeScript version**: `npm run dev`
2. **Original compiled**: Use COMPILED/zork1.z3 with Frotz, Gargoyle, or other Z-machine interpreters
