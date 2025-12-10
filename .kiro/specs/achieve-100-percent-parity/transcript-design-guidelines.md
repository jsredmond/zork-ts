# Transcript Design Guidelines

## Overview

This document provides comprehensive guidelines for creating timing transcripts that achieve 100% pass rates. Based on the timing system analysis and debug command methodology, these guidelines ensure accurate, maintainable, and reliable timing tests.

## Core Principles

### 1. Accuracy First
- **Test actual behavior**, not assumed behavior
- **Use timing system analysis** as the source of truth
- **Verify expectations** against actual game output
- **Match exact message text** from original game

### 2. Precision Through Debug Commands
- **Use debug commands** for precise state control
- **Set exact timing states** rather than relying on turn sequences
- **Trigger specific events** to test exact scenarios
- **Avoid long turn sequences** that are inefficient and error-prone

### 3. Deterministic Results
- **Create reproducible tests** that always produce same results
- **Use consistent setup** across related transcripts
- **Document state assumptions** clearly
- **Test one thing at a time** for clarity

### 4. Maintainable Structure
- **Follow consistent format** across all timing transcripts
- **Use descriptive names** and clear documentation
- **Group related tests** logically
- **Keep transcripts focused** on specific timing behaviors

## Timing System Reference

### Lamp Fuel Timing
```
Turn 100: "The lamp appears a bit dimmer." (fuel = 100)
Turn 130: "The lamp is definitely dimmer now." (fuel = 70)
Turn 185: "The lamp is nearly out." (fuel = 15)
Turn 200: "The brass lantern has gone out." (fuel = 0)
```

### Candle Burning Timing
```
Turn 20: "The candles grow shorter." (fuel = 20)
Turn 30: "The candles are becoming quite short." (fuel = 10)
Turn 35: "The candles won't last long now." (fuel = 5)
Turn 40: "You'd better have more light than from the pair of candles." (fuel = 0)
```

### NPC Movement Patterns
- **Thief**: Moves every turn when invisible, follows sequential room pattern
- **Cyclops**: Wrath increases when player present, can be fed to sleep
- **Bat**: Event-based encounter, not turn-based timing

## Debug Commands Reference

### State Manipulation Commands
```
setlampfuel <turns>     - Set lamp fuel to specific level (0-200)
setcandlefuel <turns>   - Set candle fuel to specific level (0-40)
setnpcposition <npc> <room> - Move NPC to specific room
advance <turns>         - Skip forward in time efficiently
```

### Event Trigger Commands
```
triggerdaemon LAMP      - Trigger lamp daemon immediately
triggerdaemon CANDLE    - Trigger candle daemon immediately
triggerdaemon THIEF     - Trigger thief daemon immediately
triggerdaemon COMBAT    - Trigger combat daemon immediately
```

### Setup Commands
```
teleport <room>         - Move player to specific room
give <object>           - Add object to player inventory
turnon <object>         - Turn on object (lamp)
turnoff <object>        - Turn off object
light <object>          - Light object (candles)
```

## Transcript Structure Template

### Standard Format
```json
{
  "id": "unique-identifier",
  "name": "Human Readable Name",
  "description": "Clear description of what this transcript tests",
  "category": "timing",
  "priority": "low",
  "setupCommands": [
    "// Commands to establish initial state"
  ],
  "entries": [
    {
      "command": "command to execute",
      "expectedOutput": "exact expected output",
      "notes": "optional explanation"
    }
  ]
}
```

### Required Fields
- **id**: Unique identifier (kebab-case)
- **name**: Descriptive name for humans
- **description**: What the transcript tests
- **category**: Always "timing" for timing transcripts
- **priority**: Always "low" for timing transcripts
- **setupCommands**: Array of setup commands
- **entries**: Array of command/expected output pairs

## Transcript Categories

### 1. Lamp Fuel Transcripts

#### 70-lamp-fuel-early.json
**Purpose**: Test early lamp fuel consumption without warnings
**Setup**: Lamp on, high fuel level
**Tests**: Fuel consumption, no warnings before turn 100

```json
{
  "setupCommands": [
    "teleport LIVING-ROOM",
    "give LAMP", 
    "turnon LAMP"
  ],
  "entries": [
    {
      "command": "setlampfuel 200",
      "expectedOutput": "[DEBUG: Set lamp fuel to 200 turns (stage 0, next event in 0 turns)]"
    },
    {
      "command": "advance 10",
      "expectedOutput": "[DEBUG: Advanced 10 turns to turn 10]"
    }
  ]
}
```

#### 71-lamp-fuel-warning.json
**Purpose**: Test all lamp fuel warning messages
**Setup**: Lamp on, positioned for warnings
**Tests**: All 4 warning stages and lamp death

```json
{
  "entries": [
    {
      "command": "setlampfuel 101",
      "expectedOutput": "[DEBUG: Set lamp fuel to 101 turns (stage 0, next event in 99 turns)]"
    },
    {
      "command": "advance 1",
      "expectedOutput": "[DEBUG: Advanced 1 turns to turn 1]\nThe lamp appears a bit dimmer."
    }
  ]
}
```

### 2. Candle Burning Transcripts

#### 72-candle-burning.json
**Purpose**: Test all candle burning warning messages
**Setup**: Candles lit, positioned for warnings
**Tests**: All 4 warning stages and candle death

### 3. NPC Movement Transcripts

#### 73-thief-movement.json
**Purpose**: Test thief movement patterns
**Setup**: Thief positioned, player in different room
**Tests**: Thief movement, visibility changes

#### 74-cyclops-movement.json
**Purpose**: Test cyclops behavior patterns
**Setup**: Cyclops in room, player present
**Tests**: Wrath escalation, feeding behavior

#### 75-bat-timing.json
**Purpose**: Test bat encounter timing
**Setup**: Player approaching bat room
**Tests**: Bat encounter trigger, timing behavior

### 4. Multiple Daemon Transcripts

#### 76-multiple-daemons.json
**Purpose**: Test multiple daemons running simultaneously
**Setup**: Multiple timing objects active
**Tests**: Daemon execution order, simultaneous events

#### 77-troll-daemon.json
**Purpose**: Test troll daemon timing
**Setup**: Troll present, combat possible
**Tests**: Troll behavior timing

#### 78-flood-control-dam.json
**Purpose**: Test dam timing mechanics
**Setup**: Dam controls accessible
**Tests**: Dam timing behavior

#### 79-resurrection-timing.json
**Purpose**: Test resurrection timing mechanics
**Setup**: Player death scenario
**Tests**: Resurrection timing

## Best Practices

### 1. Setup Commands
```json
"setupCommands": [
  "teleport LIVING-ROOM",    // Always start in known location
  "give LAMP",               // Add required objects
  "turnon LAMP",             // Activate timing objects
  "setlampfuel 150"          // Set initial timing state
]
```

### 2. Command Sequences
- **One concept per command** - Test one thing at a time
- **Clear progression** - Logical sequence of events
- **Verify state changes** - Check results of state changes
- **Use descriptive commands** - Make intent clear

### 3. Expected Output
- **Exact text matching** - Use exact message text from game
- **Include debug output** - Debug commands return specific format
- **Multiple messages** - Some commands produce multiple lines
- **Consistent formatting** - Match game's output format exactly

### 4. Error Handling
```json
{
  "command": "setlampfuel 250",
  "expectedOutput": "[DEBUG: Invalid fuel level (0-200)]"
}
```

### 5. State Verification
```json
{
  "command": "look",
  "expectedOutput": "Living Room\nYou are in the living room..."
}
```

## Common Patterns

### Pattern 1: Warning Sequence Testing
```json
{
  "command": "setlampfuel 101",
  "expectedOutput": "[DEBUG: Set lamp fuel to 101 turns (stage 0, next event in 99 turns)]"
},
{
  "command": "advance 1", 
  "expectedOutput": "[DEBUG: Advanced 1 turns to turn 1]\nThe lamp appears a bit dimmer."
}
```

### Pattern 2: State Transition Testing
```json
{
  "command": "setnpcposition THIEF WEST-OF-HOUSE",
  "expectedOutput": "[DEBUG: Moved THIEF to WEST-OF-HOUSE]"
},
{
  "command": "teleport WEST-OF-HOUSE",
  "expectedOutput": "[DEBUG: Teleported to WEST-OF-HOUSE]"
},
{
  "command": "look",
  "expectedOutput": "West of House\n...\nA seedy-looking individual with a large bag just wandered through the area."
}
```

### Pattern 3: Multiple Event Testing
```json
{
  "command": "setlampfuel 101",
  "expectedOutput": "[DEBUG: Set lamp fuel to 101 turns (stage 0, next event in 99 turns)]"
},
{
  "command": "setcandlefuel 21", 
  "expectedOutput": "[DEBUG: Set candle fuel to 21 turns (stage 0, next event in 19 turns)]"
},
{
  "command": "advance 1",
  "expectedOutput": "[DEBUG: Advanced 1 turns to turn 1]\nThe lamp appears a bit dimmer.\nThe candles grow shorter."
}
```

## Validation Checklist

Before submitting a timing transcript, verify:

### ✅ Structure
- [ ] All required fields present
- [ ] Valid JSON format
- [ ] Consistent naming convention
- [ ] Appropriate category and priority

### ✅ Setup
- [ ] Setup commands establish correct initial state
- [ ] Required objects are given to player
- [ ] Timing objects are activated
- [ ] Player is in appropriate location

### ✅ Commands
- [ ] Debug commands use correct syntax
- [ ] Parameters are within valid ranges
- [ ] Command sequence is logical
- [ ] Each command tests specific behavior

### ✅ Expected Output
- [ ] Exact text matching from game
- [ ] Debug output format is correct
- [ ] Multiple messages handled correctly
- [ ] Formatting matches game output

### ✅ Coverage
- [ ] Tests the intended timing behavior
- [ ] Covers all relevant warning stages
- [ ] Tests state transitions
- [ ] Includes error conditions if applicable

## Testing and Validation

### 1. Manual Testing
Run each transcript manually to verify:
```bash
npx tsx scripts/verify-all-transcripts.ts --category timing
```

### 2. Individual Transcript Testing
Test specific transcripts:
```bash
npx tsx scripts/compare-transcript.ts .kiro/transcripts/timing/70-lamp-fuel-early.json
```

### 3. Similarity Targets
- **Individual transcripts**: 98%+ similarity required
- **Category average**: 85%+ similarity required
- **Pass rate**: 100% (all transcripts must pass)

## Troubleshooting

### Common Issues

#### 1. Debug Command Syntax Errors
**Problem**: Debug command not recognized
**Solution**: Check command spelling and parameter format
```json
// Wrong
{"command": "setlampfuel150", "expectedOutput": "..."}

// Right  
{"command": "setlampfuel 150", "expectedOutput": "..."}
```

#### 2. Expected Output Mismatch
**Problem**: Output doesn't match expected
**Solution**: Run command manually to get exact output
```bash
# Test command manually first
npx tsx scripts/debug-lamp-timing-analysis.ts
```

#### 3. State Setup Issues
**Problem**: Initial state not correct
**Solution**: Verify setup commands establish proper state
```json
"setupCommands": [
  "teleport LIVING-ROOM",  // Establish location
  "give LAMP",             // Add required objects
  "turnon LAMP"            // Activate timing
]
```

#### 4. Timing Calculation Errors
**Problem**: Wrong fuel levels or timing expectations
**Solution**: Refer to timing system analysis document
- Lamp warnings: turns 100, 130, 185, 200
- Candle warnings: turns 20, 30, 35, 40

## Maintenance

### 1. Regular Validation
- Run timing transcripts weekly
- Monitor pass rates and similarity scores
- Update transcripts when game behavior changes

### 2. Documentation Updates
- Keep guidelines current with game changes
- Update examples when debug commands change
- Document new timing behaviors discovered

### 3. Version Control
- Commit transcript changes with clear messages
- Tag releases when major updates complete
- Maintain changelog of transcript modifications

## Conclusion

Following these guidelines will ensure timing transcripts achieve:
- **100% pass rate** for all timing tests
- **85%+ average similarity** across all timing transcripts
- **Maintainable and reliable** test suite
- **Comprehensive coverage** of all timing behaviors

The key is using debug commands for precise control while maintaining focus on testing actual game behavior accurately.