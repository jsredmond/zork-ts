# Timing Transcript Templates

This document provides templates for creating timing-based transcripts using the new debug commands and methodology.

## Lamp Fuel Warning Template

### Template: lamp-fuel-warnings.json

```json
{
  "id": "lamp-fuel-warnings",
  "name": "Lamp Fuel Warning Sequence",
  "description": "Tests all lamp fuel warning messages using debug commands",
  "category": "timing",
  "priority": "low",
  "setupCommands": [
    "teleport LIVING-ROOM",
    "give LAMP",
    "turnon LAMP"
  ],
  "entries": [
    {
      "command": "setlampfuel 101",
      "expectedOutput": "[DEBUG: Set lamp fuel to 101 turns (stage 0, next event in 99 turns)]"
    },
    {
      "command": "advance 1",
      "expectedOutput": "[DEBUG: Advanced 1 turns to turn 1]\nThe lamp appears a bit dimmer."
    },
    {
      "command": "setlampfuel 71",
      "expectedOutput": "[DEBUG: Set lamp fuel to 71 turns (stage 1, next event in 29 turns)]"
    },
    {
      "command": "advance 1",
      "expectedOutput": "[DEBUG: Advanced 1 turns to turn 2]\nThe lamp is definitely dimmer now."
    },
    {
      "command": "setlampfuel 16",
      "expectedOutput": "[DEBUG: Set lamp fuel to 16 turns (stage 2, next event in 54 turns)]"
    },
    {
      "command": "advance 1",
      "expectedOutput": "[DEBUG: Advanced 1 turns to turn 3]\nThe lamp is nearly out."
    },
    {
      "command": "setlampfuel 1",
      "expectedOutput": "[DEBUG: Set lamp fuel to 1 turns (stage 3, next event in 14 turns)]"
    },
    {
      "command": "advance 1",
      "expectedOutput": "[DEBUG: Advanced 1 turns to turn 4]\nThe brass lantern has gone out."
    }
  ]
}
```

### Template: lamp-fuel-early.json

```json
{
  "id": "lamp-fuel-early",
  "name": "Lamp Fuel Early Consumption",
  "description": "Tests early lamp fuel consumption without warnings",
  "category": "timing",
  "priority": "low",
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
    },
    {
      "command": "setlampfuel 150",
      "expectedOutput": "[DEBUG: Set lamp fuel to 150 turns (stage 0, next event in 50 turns)]"
    },
    {
      "command": "advance 5",
      "expectedOutput": "[DEBUG: Advanced 5 turns to turn 15]"
    }
  ]
}
```

## Candle Burning Template

### Template: candle-burning-warnings.json

```json
{
  "id": "candle-burning-warnings",
  "name": "Candle Burning Warning Sequence",
  "description": "Tests all candle burning warning messages using debug commands",
  "category": "timing",
  "priority": "low",
  "setupCommands": [
    "teleport LIVING-ROOM",
    "give CANDLES",
    "light CANDLES"
  ],
  "entries": [
    {
      "command": "setcandlefuel 21",
      "expectedOutput": "[DEBUG: Set candle fuel to 21 turns (stage 0, next event in 19 turns)]"
    },
    {
      "command": "advance 1",
      "expectedOutput": "[DEBUG: Advanced 1 turns to turn 1]\nThe candles grow shorter."
    },
    {
      "command": "setcandlefuel 11",
      "expectedOutput": "[DEBUG: Set candle fuel to 11 turns (stage 1, next event in 9 turns)]"
    },
    {
      "command": "advance 1",
      "expectedOutput": "[DEBUG: Advanced 1 turns to turn 2]\nThe candles are becoming quite short."
    },
    {
      "command": "setcandlefuel 6",
      "expectedOutput": "[DEBUG: Set candle fuel to 6 turns (stage 2, next event in 4 turns)]"
    },
    {
      "command": "advance 1",
      "expectedOutput": "[DEBUG: Advanced 1 turns to turn 3]\nThe candles won't last long now."
    },
    {
      "command": "setcandlefuel 1",
      "expectedOutput": "[DEBUG: Set candle fuel to 1 turns (stage 3, next event in 4 turns)]"
    },
    {
      "command": "advance 1",
      "expectedOutput": "[DEBUG: Advanced 1 turns to turn 4]\nYou'd better have more light than from the pair of candles."
    }
  ]
}
```

## NPC Movement Template

### Template: thief-movement.json

```json
{
  "id": "thief-movement",
  "name": "Thief Movement Pattern",
  "description": "Tests thief movement patterns using debug commands",
  "category": "timing",
  "priority": "low",
  "setupCommands": [
    "teleport LIVING-ROOM"
  ],
  "entries": [
    {
      "command": "setnpcposition THIEF WEST-OF-HOUSE",
      "expectedOutput": "[DEBUG: Moved THIEF to WEST-OF-HOUSE]"
    },
    {
      "command": "triggerdaemon THIEF",
      "expectedOutput": "[DEBUG: Triggered thief daemon]"
    },
    {
      "command": "teleport WEST-OF-HOUSE",
      "expectedOutput": "[DEBUG: Teleported to WEST-OF-HOUSE]"
    },
    {
      "command": "look",
      "expectedOutput": "West of House\nYou are standing in an open field west of a white house, with a boarded front door.\nThere is a small mailbox here.\n\nA seedy-looking individual with a large bag just wandered through the area."
    }
  ]
}
```

### Template: cyclops-behavior.json

```json
{
  "id": "cyclops-behavior",
  "name": "Cyclops Behavior Pattern",
  "description": "Tests cyclops behavior and wrath escalation",
  "category": "timing",
  "priority": "low",
  "setupCommands": [
    "teleport CYCLOPS-ROOM",
    "give LUNCH"
  ],
  "entries": [
    {
      "command": "setnpcposition CYCLOPS CYCLOPS-ROOM",
      "expectedOutput": "[DEBUG: Moved CYCLOPS to CYCLOPS-ROOM]"
    },
    {
      "command": "look",
      "expectedOutput": "Cyclops Room\nThis room has an exit on the northwest and a staircase leading up.\n\nA cyclops, who looks prepared to eat horses (much less mere adventurers), blocks the staircase. From his state of health, and the bloodstains on the walls, you gather that he is not very friendly to visitors."
    },
    {
      "command": "feed CYCLOPS",
      "expectedOutput": "The cyclops says \"Mmm. Good!\" and falls asleep.\n\nThe cyclops seems to have enjoyed the sandwich."
    }
  ]
}
```

## Multiple Daemon Interaction Template

### Template: multiple-daemons.json

```json
{
  "id": "multiple-daemons",
  "name": "Multiple Daemon Interactions",
  "description": "Tests multiple daemons running simultaneously",
  "category": "timing",
  "priority": "low",
  "setupCommands": [
    "teleport LIVING-ROOM",
    "give LAMP",
    "give CANDLES",
    "turnon LAMP",
    "light CANDLES"
  ],
  "entries": [
    {
      "command": "setlampfuel 101",
      "expectedOutput": "[DEBUG: Set lamp fuel to 101 turns (stage 0, next event in 99 turns)]"
    },
    {
      "command": "setcandlefuel 21",
      "expectedOutput": "[DEBUG: Set candle fuel to 21 turns (stage 0, next event in 19 turns)]"
    },
    {
      "command": "setnpcposition THIEF WEST-OF-HOUSE",
      "expectedOutput": "[DEBUG: Moved THIEF to WEST-OF-HOUSE]"
    },
    {
      "command": "advance 1",
      "expectedOutput": "[DEBUG: Advanced 1 turns to turn 1]\nThe lamp appears a bit dimmer.\nThe candles grow shorter."
    },
    {
      "command": "triggerdaemon THIEF",
      "expectedOutput": "[DEBUG: Triggered thief daemon]"
    }
  ]
}
```

## Template Usage Guidelines

### 1. Setup Commands
- Always use `teleport` to position player
- Use `give` to add required objects to inventory
- Use `turnon`/`light` to activate timing objects
- Use `setnpcposition` to place NPCs

### 2. Timing Commands
- Use `setlampfuel <turns>` to set lamp fuel level
- Use `setcandlefuel <turns>` to set candle fuel level
- Use `advance <turns>` to advance game time
- Use `triggerdaemon <daemon>` to manually trigger events

### 3. Verification Commands
- Use `look` to verify room state
- Use standard game commands to test interactions
- Check for expected warning messages

### 4. Expected Output Format
- Debug commands return `[DEBUG: ...]` messages
- Game commands return normal game output
- Warning messages appear after `advance` commands
- Multiple messages can appear on same turn

### 5. Timing Calculations

#### Lamp Fuel Stages:
- Stage 0: Fuel > 100, warning at turn when fuel = 100
- Stage 1: Fuel > 70, warning at turn when fuel = 70  
- Stage 2: Fuel > 15, warning at turn when fuel = 15
- Stage 3: Fuel > 0, lamp dies when fuel = 0

#### Candle Fuel Stages:
- Stage 0: Fuel > 20, warning at turn when fuel = 20
- Stage 1: Fuel > 10, warning at turn when fuel = 10
- Stage 2: Fuel > 5, warning at turn when fuel = 5
- Stage 3: Fuel > 0, candles die when fuel = 0

### 6. Best Practices
- Test one timing system at a time for clarity
- Use descriptive command sequences
- Verify state changes with `look` commands
- Test edge cases (fuel = 0, stage transitions)
- Include multiple daemon interactions

## Template Customization

These templates can be customized for specific test scenarios:

1. **Different starting conditions** - Modify setupCommands
2. **Different timing sequences** - Adjust fuel levels and advance commands
3. **Different locations** - Change teleport destinations
4. **Different NPCs** - Use setnpcposition for various NPCs
5. **Combined scenarios** - Mix multiple timing systems

The key is to use the debug commands to create precise, reproducible timing scenarios that test the exact behavior documented in the timing system analysis.