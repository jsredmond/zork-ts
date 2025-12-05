# Exhaustive Testing System - Complete Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Test Options and Filters](#test-options-and-filters)
4. [Common Workflows](#common-workflows)
5. [Understanding Test Results](#understanding-test-results)
6. [Bug Management](#bug-management)
7. [Advanced Usage](#advanced-usage)
8. [Troubleshooting](#troubleshooting)

## Introduction

The exhaustive testing system systematically tests every room, object, and interaction in the Zork I rewrite. It maintains detailed logs of test progress and bug reports, allowing you to:

- Test all rooms for descriptions, exits, and objects
- Test all objects for basic and specific interactions
- Test puzzles and NPC behavior
- Track test coverage and progress
- Generate detailed bug reports
- Resume testing from where you left off

## Getting Started

### Prerequisites

Ensure you have the project dependencies installed:

```bash
npm install
```

### Running Your First Test

Start with a simple test run:

```bash
npm run test:run -- --rooms --max 10
```

This will test 10 rooms and show you the results.

### Checking Status

After running tests, check your progress:

```bash
npm run test:status
```

This displays:
- Overall test coverage percentage
- Number of rooms/objects tested
- Recent bugs found
- Untested items

## Test Options and Filters

### Test Types

Control which types of tests to run:

| Option | Description | Example |
|--------|-------------|---------|
| `--rooms` | Test room descriptions, exits, and objects | `npm run test:run -- --rooms` |
| `--objects` | Test object interactions | `npm run test:run -- --objects` |
| `--puzzles` | Test puzzle solutions | `npm run test:run -- --puzzles` |
| `--npcs` | Test NPC behavior | `npm run test:run -- --npcs` |
| `--edge-cases` | Test edge cases and error conditions | `npm run test:run -- --edge-cases` |

**Default behavior**: If no test type is specified, both `--rooms` and `--objects` are tested.

### Limiting Tests

Control how many tests to run:

```bash
# Run only 50 tests
npm run test:run -- --max 50

# Run all available tests (no limit)
npm run test:run
```

### Filtering by Specific Items

Test only specific rooms or objects:

```bash
# Test specific rooms
npm run test:run -- --room-filter WEST-OF-HOUSE,NORTH-OF-HOUSE,FOREST-1

# Test specific objects
npm run test:run -- --object-filter MAILBOX,LEAFLET,LAMP

# Combine filters
npm run test:run -- --rooms --room-filter WEST-OF-HOUSE --max 5
```

### Combining Options

You can combine multiple options:

```bash
# Test rooms and objects, limit to 100 tests
npm run test:run -- --rooms --objects --max 100

# Test only puzzles and NPCs
npm run test:run -- --puzzles --npcs

# Test specific rooms with a limit
npm run test:run -- --rooms --room-filter WEST-OF-HOUSE,KITCHEN --max 20
```

## Common Workflows

### Workflow 1: Initial Testing Session

Start testing the game from scratch:

```bash
# 1. Run a small test to verify everything works
npm run test:run -- --max 20

# 2. Check the results
npm run test:status

# 3. If everything looks good, run a larger test
npm run test:run -- --max 100

# 4. Review any bugs found
npm run test:bugs
```

### Workflow 2: Focused Room Testing

Test all rooms systematically:

```bash
# 1. Test rooms only
npm run test:run -- --rooms

# 2. Check room coverage
npm run test:status -- --verbose

# 3. Review untested rooms from the output
# 4. Test specific untested rooms if needed
npm run test:run -- --rooms --room-filter UNTESTED-ROOM-1,UNTESTED-ROOM-2
```

### Workflow 3: Object Interaction Testing

Test all object interactions:

```bash
# 1. Test objects only
npm run test:run -- --objects

# 2. Check object coverage
npm run test:status -- --verbose

# 3. Review any interaction failures
npm run test:bugs -- --category ACTION_ERROR
```

### Workflow 4: Puzzle Verification

Verify all puzzles work correctly:

```bash
# 1. Test puzzles
npm run test:run -- --puzzles

# 2. Check for puzzle-related bugs
npm run test:bugs -- --category INCORRECT_BEHAVIOR

# 3. Review critical puzzle bugs
npm run test:bugs -- --severity CRITICAL
```

### Workflow 5: Bug Fix Verification

After fixing bugs, verify the fixes:

```bash
# 1. Run regression tests
npm run test:run -- --max 50

# 2. Check if previously found bugs still occur
npm run test:bugs -- --status FIXED

# 3. Update bug status if verified
npm run test:bug-update BUG-001 VERIFIED

# 4. Export bug report for documentation
npm run test:bug-export
```

### Workflow 6: Comprehensive Testing

Run a complete test suite:

```bash
# 1. Test everything with no limits
npm run test:run -- --rooms --objects --puzzles --npcs --edge-cases

# 2. Generate detailed status report
npm run test:status -- --verbose

# 3. Export all results
npm run test:bug-export
npm run test:bug-export -- --json
```

### Workflow 7: Incremental Testing

Test in small increments over multiple sessions:

```bash
# Session 1: Test 50 items
npm run test:run -- --max 50
npm run test:status

# Session 2: Test 50 more items (progress is saved automatically)
npm run test:run -- --max 50
npm run test:status

# Session 3: Continue testing
npm run test:run -- --max 50
npm run test:status

# Check overall progress
npm run test:status -- --verbose
```

## Understanding Test Results

### Test Progress

Test progress is automatically saved to `.kiro/testing/test-progress.json` after each test session. It includes:

- **testedRooms**: Array of room IDs that have been tested
- **testedObjects**: Array of object IDs that have been tested
- **testedInteractions**: Map of object IDs to arrays of tested verbs
- **totalTests**: Total number of tests executed
- **coverage**: Coverage percentages for rooms, objects, and interactions

### Coverage Metrics

Coverage is calculated as:

- **Room Coverage**: `(tested rooms / total rooms) × 100`
- **Object Coverage**: `(tested objects / total objects) × 100`
- **Interaction Coverage**: `(tested interactions / estimated interactions) × 100`
- **Overall Coverage**: Average of the three coverage types

### Test Status Output

When you run `npm run test:status`, you'll see:

```
=== Test Dashboard ===

Overall Coverage: 45.2%

Room Coverage: 52.3% (34/65 rooms tested)
Object Coverage: 38.1% (48/126 objects tested)
Interaction Coverage: 45.2% (156/345 interactions tested)

Total Tests Run: 238

Recent Bugs (Last 5):
- BUG-001 [MAJOR] Cannot climb tree in Forest Path
- BUG-002 [MINOR] Mailbox description typo
- BUG-003 [CRITICAL] Game crashes when attacking thief
...

Untested Rooms (showing first 10):
- MAZE-1
- MAZE-2
- TREASURE-ROOM
...

Untested Objects (showing first 10):
- SWORD
- CHALICE
- PAINTING
...
```

## Bug Management

### Understanding Bug Reports

Each bug report includes:

- **ID**: Unique identifier (e.g., BUG-001)
- **Title**: Brief description
- **Description**: Detailed explanation
- **Category**: Type of bug (PARSER_ERROR, ACTION_ERROR, etc.)
- **Severity**: Impact level (CRITICAL, MAJOR, MINOR, TRIVIAL)
- **Status**: Current state (OPEN, IN_PROGRESS, FIXED, VERIFIED, WONT_FIX)
- **Reproduction Steps**: How to reproduce the bug
- **Game State**: State when bug was found (room, inventory, flags)
- **Timestamps**: When found, fixed, and verified

### Bug Categories

| Category | Description | Example |
|----------|-------------|---------|
| `PARSER_ERROR` | Parser doesn't understand valid input | "CLIMB TREE" not recognized |
| `ACTION_ERROR` | Action handler fails or behaves incorrectly | "TAKE LAMP" doesn't work |
| `MISSING_CONTENT` | Content is missing or incomplete | Room description is empty |
| `INCORRECT_BEHAVIOR` | Behavior doesn't match original game | Troll doesn't attack |
| `CRASH` | Game crashes or throws error | Null pointer exception |
| `TEXT_ERROR` | Typos or text formatting issues | "You see a lammp" |

### Bug Severities

| Severity | Description | Action Required |
|----------|-------------|-----------------|
| `CRITICAL` | Game-breaking, prevents progress | Fix immediately |
| `MAJOR` | Feature doesn't work, workaround difficult | Fix soon |
| `MINOR` | Small issue, workaround exists | Fix when convenient |
| `TRIVIAL` | Cosmetic, doesn't affect gameplay | Fix if time permits |

### Bug Workflow

1. **Bug Found**: System automatically creates bug report with status `OPEN`
2. **Start Work**: Update status to `IN_PROGRESS`
   ```bash
   npm run test:bug-update BUG-001 IN_PROGRESS
   ```
3. **Fix Bug**: Make code changes to fix the issue
4. **Mark Fixed**: Update status to `FIXED`
   ```bash
   npm run test:bug-update BUG-001 FIXED
   ```
5. **Verify Fix**: Run tests again to verify
   ```bash
   npm run test:run -- --max 50
   ```
6. **Mark Verified**: Update status to `VERIFIED`
   ```bash
   npm run test:bug-update BUG-001 VERIFIED
   ```

### Listing Bugs

```bash
# List all bugs
npm run test:bugs

# Filter by status
npm run test:bugs -- --status OPEN
npm run test:bugs -- --status FIXED

# Filter by severity
npm run test:bugs -- --severity CRITICAL
npm run test:bugs -- --severity MAJOR

# Filter by category
npm run test:bugs -- --category PARSER_ERROR
npm run test:bugs -- --category CRASH

# Combine filters
npm run test:bugs -- --status OPEN --severity CRITICAL
```

### Exporting Bug Reports

```bash
# Export as Markdown (human-readable)
npm run test:bug-export

# Export as JSON (machine-readable)
npm run test:bug-export -- --json
```

Exported files are saved to `.kiro/testing/test-reports/` with timestamps.

## Advanced Usage

### Programmatic API

You can use the testing system programmatically in your own scripts:

```typescript
import { TestCoordinator } from './testing/coordinator';
import { TestReporter } from './testing/reporter';
import { loadTestProgress, loadBugReports } from './testing/persistence';

// Create coordinator
const coordinator = new TestCoordinator();

// Run tests with options
const results = await coordinator.runTests({
  testRooms: true,
  testObjects: true,
  maxTests: 100,
  roomFilter: ['WEST-OF-HOUSE', 'KITCHEN']
});

// Generate reports
const reporter = new TestReporter();
const progress = loadTestProgress();
const bugs = loadBugReports().bugs;

if (progress) {
  const dashboard = reporter.displayTestDashboard(progress, bugs);
  console.log(dashboard);
}
```

### Custom Test Scripts

Create custom test scripts for specific scenarios:

```typescript
import { TestScriptRunner } from './testing/scriptRunner';
import { createInitialGameState } from './game/state';

const runner = new TestScriptRunner();
const state = createInitialGameState();

// Define custom test script
const script = {
  name: 'Custom Test',
  description: 'Test specific scenario',
  commands: [
    'open mailbox',
    'take leaflet',
    'read leaflet',
    'go north'
  ],
  expectedOutputs: [
    'Opening the mailbox reveals a leaflet',
    'Taken',
    'WELCOME TO ZORK',
    'North of House'
  ]
};

// Run script
const result = await runner.runScript(script, state);
console.log(result.passed ? 'PASS' : 'FAIL');
```

### Resetting Test Progress

If you want to start testing from scratch:

```bash
# Delete test progress file
rm .kiro/testing/test-progress.json

# Run tests again
npm run test:run
```

**Warning**: This will lose all test progress. Consider backing up the file first.

## Troubleshooting

### Problem: Tests are running slowly

**Solution**: Limit the number of tests per session:
```bash
npm run test:run -- --max 50
```

### Problem: Can't find specific bug

**Solution**: Use filters to narrow down:
```bash
npm run test:bugs -- --category PARSER_ERROR --severity MAJOR
```

### Problem: Test progress not saving

**Solution**: Check that `.kiro/testing/` directory exists:
```bash
mkdir -p .kiro/testing
npm run test:run
```

### Problem: Want to test only untested items

**Solution**: Check status with verbose flag to see untested items:
```bash
npm run test:status -- --verbose
```

Then test specific items:
```bash
npm run test:run -- --room-filter UNTESTED-ROOM-1,UNTESTED-ROOM-2
```

### Problem: Too many bugs to review

**Solution**: Focus on critical bugs first:
```bash
npm run test:bugs -- --severity CRITICAL
npm run test:bugs -- --severity MAJOR
```

### Problem: Need to share test results

**Solution**: Export reports:
```bash
npm run test:bug-export              # Markdown format
npm run test:bug-export -- --json    # JSON format
```

Files are saved to `.kiro/testing/test-reports/` and can be shared.

## Tips and Best Practices

1. **Start Small**: Begin with `--max 20` to verify everything works
2. **Test Incrementally**: Run multiple small sessions rather than one large session
3. **Check Status Often**: Use `npm run test:status` to track progress
4. **Prioritize Bugs**: Focus on CRITICAL and MAJOR bugs first
5. **Use Filters**: Test specific areas when debugging
6. **Export Regularly**: Export bug reports for documentation
7. **Update Bug Status**: Keep bug statuses current for accurate tracking
8. **Verify Fixes**: Always run tests after fixing bugs

## Next Steps

- Review the [Bug Report Template](BUG_REPORT_TEMPLATE.md) for bug reporting guidelines
- See [Test Result Examples](TEST_EXAMPLES.md) for sample outputs
- Check the main [README](README.md) for component details
