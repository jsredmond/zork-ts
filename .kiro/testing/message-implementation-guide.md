# Message Implementation Guide

**Purpose**: Reference guide for implementing messages from ZIL source code  
**Date**: December 7, 2025  
**Status**: Complete - 100% production message coverage achieved

---

## Overview

This guide documents the methodology used to achieve 100% message coverage from the original Zork I ZIL source code. It serves as a reference for future maintenance and similar projects.

---

## Implementation Workflow

### 1. Message Identification

**Tools:**
- `scripts/extract-zil-messages.ts` - Extracts all TELL messages from ZIL files
- `scripts/identify-next-messages.ts` - Categorizes and prioritizes missing messages
- `scripts/verify-coverage-threshold.ts` - Validates coverage percentage

**Process:**
1. Run extraction script to get all ZIL messages
2. Run identification script to categorize missing messages
3. Group by category and priority
4. Plan implementation batches

### 2. Message Categorization

**Categories:**
- **Conditional**: Messages that vary based on game state/flags
- **Parser**: Internal parser feedback and error messages
- **Generic**: Refusal and generic action responses
- **V-Object**: Verb handler messages from gverbs.zil
- **Puzzle**: Puzzle-specific feedback
- **Scenery**: Environmental interaction messages
- **Special**: Object-specific behaviors

**Priority Levels:**
- **Critical**: Core gameplay messages
- **High**: Important feedback messages
- **Medium**: Variations and conditional messages
- **Low**: Edge cases and rare conditions

### 3. Implementation Locations

**File Organization:**

```
src/game/
├── conditionalMessages.ts    # Flag/state-dependent messages
├── errorMessages.ts           # Generic errors and refusals
├── verbHandlers.ts            # V-object messages
├── puzzles.ts                 # Puzzle-specific messages
├── sceneryActions.ts          # Scenery interactions
├── specialBehaviors.ts        # Object-specific messages
├── deadState.ts               # Death state messages
└── selfReference.ts           # Self-directed actions

src/parser/
└── feedback.ts                # Parser internal messages
```

### 4. Implementation Pattern

**Standard Pattern:**

```typescript
// 1. Add ZIL source reference
// ZIL: 1actions.zil:123
// Message: "You can't do that here."
// Condition: EQUAL? ,HERE ,KITCHEN

// 2. Implement condition check
if (state.currentRoom === 'KITCHEN') {
  // 3. Return exact message text
  return "You can't do that here.";
}
```

**Conditional Message Pattern:**

```typescript
// Helper function for common patterns
function getConditionalMessage(state: GameState): string {
  // Check flags
  if (state.flags.WON_FLAG) {
    return "The game is over.";
  }
  
  // Check object states
  if (state.objects.LAMP.properties.ONBIT) {
    return "The lamp is on.";
  }
  
  // Check location
  if (state.currentRoom === 'DARK-ROOM') {
    return "It is pitch black.";
  }
  
  // Default message
  return "Nothing special happens.";
}
```

### 5. Testing Strategy

**Test Types:**

1. **Unit Tests**: Test individual message functions
```typescript
describe('conditionalMessages', () => {
  it('returns correct message for flag state', () => {
    const state = createTestState({ flags: { WON_FLAG: true } });
    expect(getMessage(state)).toBe("The game is over.");
  });
});
```

2. **Integration Tests**: Test message sequences
```typescript
it('shows correct messages during puzzle solution', () => {
  const game = createGame();
  game.execute('take lamp');
  expect(game.lastOutput).toContain('Taken.');
  game.execute('turn on lamp');
  expect(game.lastOutput).toContain('The brass lantern is now on.');
});
```

3. **Validation Tests**: Compare against ZIL source
```typescript
it('matches ZIL message text exactly', () => {
  const zilMessage = "You can't do that here.";
  const tsMessage = getErrorMessage('INVALID_ACTION');
  expect(tsMessage).toBe(zilMessage);
});
```

### 6. Validation Process

**Per-Batch Validation:**

```bash
# 1. Check coverage increase
npx tsx scripts/verify-coverage-threshold.ts

# 2. Run full test suite
npm test

# 3. Validate message accuracy
npx tsx scripts/validate-messages.ts --category [category]

# 4. Check for regressions
npm test -- --reporter=verbose
```

**Final Validation:**

```bash
# Run coverage validation 5 times
for i in {1..5}; do
  npx tsx scripts/verify-coverage-threshold.ts
done

# Run test suite 3 times
for i in {1..3}; do
  npm test
done

# Validate all messages
npx tsx scripts/validate-messages.ts --all
```

---

## Common Patterns

### Pattern 1: Flag-Based Messages

```typescript
// ZIL: <COND (<FSET? ,HERE ,TOUCHBIT> <TELL "It's hot!">)>
function getTemperatureMessage(state: GameState): string {
  if (state.rooms[state.currentRoom].flags.TOUCHBIT) {
    return "It's hot!";
  }
  return "It feels normal.";
}
```

### Pattern 2: Multi-Condition Messages

```typescript
// ZIL: <COND (<AND <FSET? ,LAMP ,ONBIT> <G? ,LAMP-LIFE 0>>
//            <TELL "The lamp is on.">)>
function getLampMessage(state: GameState): string {
  const lamp = state.objects.LAMP;
  if (lamp.properties.ONBIT && lamp.properties.LIFE > 0) {
    return "The lamp is on.";
  }
  return "The lamp is off.";
}
```

### Pattern 3: Time-Based Messages

```typescript
// ZIL: Lamp dimming stages
function getLampDimmingMessage(life: number): string {
  if (life < 30) {
    return "The lamp is getting dim.";
  } else if (life < 50) {
    return "The lamp is flickering.";
  }
  return "The lamp is burning brightly.";
}
```

### Pattern 4: Location-Based Messages

```typescript
// ZIL: <EQUAL? ,HERE ,KITCHEN ,LIVING-ROOM>
function getLocationMessage(state: GameState): string {
  if (['KITCHEN', 'LIVING-ROOM'].includes(state.currentRoom)) {
    return "You are in a familiar place.";
  }
  return "You are in an unfamiliar place.";
}
```

### Pattern 5: Inventory-Based Messages

```typescript
// ZIL: <IN? ,SWORD ,PLAYER>
function getInventoryMessage(state: GameState): string {
  if (state.inventory.includes('SWORD')) {
    return "You are armed.";
  }
  return "You are unarmed.";
}
```

---

## Helper Functions

### Common Condition Helpers

```typescript
// Check if object is in inventory
function hasObject(state: GameState, objectId: string): boolean {
  return state.inventory.includes(objectId);
}

// Check if flag is set
function hasFlag(state: GameState, flagName: string): boolean {
  return state.flags[flagName] === true;
}

// Check if in specific room
function inRoom(state: GameState, roomId: string): boolean {
  return state.currentRoom === roomId;
}

// Check object property
function hasProperty(state: GameState, objectId: string, property: string): boolean {
  return state.objects[objectId]?.properties[property] === true;
}
```

### Message Selection Helpers

```typescript
// Select message based on conditions
function selectMessage(conditions: Array<[boolean, string]>, defaultMsg: string): string {
  for (const [condition, message] of conditions) {
    if (condition) return message;
  }
  return defaultMsg;
}

// Example usage:
const message = selectMessage([
  [state.flags.WON_FLAG, "You have won!"],
  [state.flags.DEAD_FLAG, "You are dead."],
  [state.score > 100, "You're doing well."]
], "Nothing special.");
```

---

## Troubleshooting

### Issue: Message Not Appearing

**Diagnosis:**
1. Check if condition is being met
2. Verify message is in correct file
3. Check if message is being called
4. Validate ZIL source reference

**Solution:**
- Add debug logging to condition checks
- Verify state values match expectations
- Test condition in isolation

### Issue: Wrong Message Appearing

**Diagnosis:**
1. Check condition order (first match wins)
2. Verify flag/state values
3. Check for typos in conditions

**Solution:**
- Reorder conditions (most specific first)
- Add explicit state validation
- Add unit tests for each condition

### Issue: Message Text Doesn't Match

**Diagnosis:**
1. Compare against ZIL source exactly
2. Check for whitespace differences
3. Verify string interpolation

**Solution:**
- Copy message text directly from ZIL
- Normalize whitespace
- Test with validation script

---

## Best Practices

### 1. Always Reference ZIL Source

```typescript
// ✅ Good
// ZIL: 1actions.zil:123
// Message: "You can't do that."
return "You can't do that.";

// ❌ Bad
return "You can't do that."; // No reference
```

### 2. Document Conditions Clearly

```typescript
// ✅ Good
// Condition: Player has lamp AND lamp is on AND in dark room
if (hasObject(state, 'LAMP') && 
    hasProperty(state, 'LAMP', 'ONBIT') && 
    state.rooms[state.currentRoom].flags.DARKBIT) {
  return "The lamp illuminates the area.";
}

// ❌ Bad
if (state.inventory.includes('LAMP') && state.objects.LAMP.properties.ONBIT) {
  return "The lamp illuminates the area.";
}
```

### 3. Use Helper Functions

```typescript
// ✅ Good
if (hasFlag(state, 'WON_FLAG')) {
  return "You have won!";
}

// ❌ Bad
if (state.flags.WON_FLAG === true) {
  return "You have won!";
}
```

### 4. Test Each Condition Path

```typescript
describe('conditional message', () => {
  it('returns message when flag is set', () => {
    const state = createTestState({ flags: { WON_FLAG: true } });
    expect(getMessage(state)).toBe("You have won!");
  });
  
  it('returns default when flag is not set', () => {
    const state = createTestState({ flags: { WON_FLAG: false } });
    expect(getMessage(state)).toBe("Nothing happens.");
  });
});
```

### 5. Validate Against ZIL

```typescript
// Always run validation after implementation
// npx tsx scripts/validate-messages.ts --category conditional
```

---

## Batch Implementation Checklist

For each batch:

- [ ] Identify messages using `identify-next-messages.ts`
- [ ] Document ZIL source references
- [ ] Determine implementation location
- [ ] Implement messages with conditions
- [ ] Add unit tests for each message
- [ ] Run coverage validation
- [ ] Run full test suite
- [ ] Validate message text accuracy
- [ ] Document any deviations
- [ ] Commit with descriptive message

---

## Tools Reference

### Scripts

- **extract-zil-messages.ts**: Extract all TELL messages from ZIL files
- **identify-next-messages.ts**: Categorize and prioritize missing messages
- **verify-coverage-threshold.ts**: Validate coverage percentage
- **validate-messages.ts**: Compare TypeScript messages against ZIL source
- **generate-final-report.ts**: Generate comprehensive coverage report

### Commands

```bash
# Check coverage
npx tsx scripts/verify-coverage-threshold.ts

# Identify next messages
npx tsx scripts/identify-next-messages.ts --category [category]

# Validate messages
npx tsx scripts/validate-messages.ts --all

# Run tests
npm test

# Run specific test file
npm test -- src/game/conditionalMessages.test.ts
```

---

## Conclusion

This guide documents the systematic approach used to achieve 100% message coverage. The key principles are:

1. **Systematic categorization** of messages
2. **Clear ZIL source references** in code
3. **Comprehensive testing** at each step
4. **Automated validation** against source
5. **Documentation** of deviations

Following these patterns ensures maintainability and accuracy for future work.

---

**Guide Status**: Complete  
**Coverage Achieved**: 99.78% (100% production messages)  
**Last Updated**: December 7, 2025
