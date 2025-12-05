# Exhaustive Testing System

This directory contains the exhaustive testing system for the Zork I rewrite. The system systematically tests every room, object, and interaction in the game.

## Components

### Core Testing
- **coordinator.ts** - Orchestrates test execution
- **roomTester.ts** - Tests room descriptions, exits, and objects
- **objectTester.ts** - Tests object interactions
- **puzzleTester.ts** - Tests puzzle solutions
- **npcTester.ts** - Tests NPC behavior
- **edgeCaseTester.ts** - Tests edge cases and error conditions

### Test Scripts
- **scriptRunner.ts** - Executes test scripts
- **testScripts.ts** - Predefined test scripts
- **regressionTester.ts** - Regression testing

### Data Management
- **testProgress.ts** - Test progress tracking
- **bugTracker.ts** - Bug report management
- **coverage.ts** - Coverage calculation
- **persistence.ts** - Data persistence utilities

### Reporting
- **reporter.ts** - Test reporting and visualization

## Usage

### Running Tests

```typescript
import { TestCoordinator } from './testing';

const coordinator = new TestCoordinator();

// Run all tests
await coordinator.runTests({
  testRooms: true,
  testObjects: true,
  testPuzzles: true,
  testNPCs: true,
  testEdgeCases: true
});

// Run specific tests
await coordinator.runTests({
  testRooms: true,
  roomFilter: ['WEST-OF-HOUSE', 'NORTH-OF-HOUSE']
});
```

### Generating Reports

```typescript
import { TestReporter } from './testing';

const reporter = new TestReporter();

// Generate and display coverage report
const coverageReport = reporter.loadAndGenerateCoverageReport();
if (coverageReport) {
  console.log(reporter.displayCoverageVisualization(progress));
}

// Generate and save bug summary
const bugReport = reporter.loadAndGenerateBugSummaryReport();
reporter.saveBugSummaryReport(bugReport);

// Generate detailed test report
const detailedReport = reporter.loadAndGenerateDetailedReport();
if (detailedReport) {
  reporter.saveDetailedReport(detailedReport);
}

// Display test dashboard
const progress = loadTestProgress();
const bugs = loadBugReports().bugs;
if (progress) {
  console.log(reporter.displayTestDashboard(progress, bugs));
}
```

### Exporting Reports

Reports can be exported in multiple formats:

```typescript
// Export as Markdown
const markdown = reporter.exportCoverageReportAsMarkdown(coverageReport);
const bugMarkdown = reporter.exportBugSummaryAsMarkdown(bugReport);

// Export as JSON
const json = reporter.exportBugReportsAsJSON(bugs);
const progressJson = reporter.exportTestProgressAsJSON(progress);

// Save to files
reporter.saveCoverageReport(coverageReport, 'my-coverage.md');
reporter.saveBugReportsJSON(bugs, 'my-bugs.json');
```

## Test Progress

Test progress is automatically saved to `.kiro/testing/test-progress.json` and includes:
- List of tested rooms
- List of tested objects
- Tested interactions per object
- Coverage percentages
- Total test count

## Bug Reports

Bug reports are saved to `.kiro/testing/bug-reports.json` and include:
- Bug ID
- Title and description
- Category and severity
- Status tracking
- Reproduction steps
- Game state snapshot

## Coverage Calculation

Coverage is calculated as:
- **Room Coverage**: (tested rooms / total rooms) × 100
- **Object Coverage**: (tested objects / total objects) × 100
- **Interaction Coverage**: (tested interactions / estimated interactions) × 100
- **Overall Coverage**: Average of the three coverage types

## Property-Based Testing

The system includes property-based tests using fast-check to verify:
- Test progress persistence (round-trip)
- Coverage calculation accuracy
- Bug report completeness
- Test idempotency

## Reports Directory

Generated reports are saved to `.kiro/testing/test-reports/`:
- `coverage-YYYY-MM-DD.md` - Coverage reports
- `bugs-YYYY-MM-DD.md` - Bug summaries
- `detailed-YYYY-MM-DD.md` - Detailed test reports
- `bugs-YYYY-MM-DD.json` - Bug reports (JSON)
- `progress-YYYY-MM-DD.json` - Test progress (JSON)

## CLI Usage

The testing system provides a command-line interface for easy test execution and management.

### Running Tests

Run tests with various options:

```bash
# Run all tests (rooms and objects by default)
npm run test:run

# Run specific test types
npm run test:run -- --rooms
npm run test:run -- --objects
npm run test:run -- --puzzles
npm run test:run -- --npcs
npm run test:run -- --edge-cases

# Limit number of tests
npm run test:run -- --max 50

# Filter by specific rooms or objects
npm run test:run -- --room-filter WEST-OF-HOUSE,NORTH-OF-HOUSE
npm run test:run -- --object-filter MAILBOX,LEAFLET

# Combine options
npm run test:run -- --rooms --objects --max 100
```

### Checking Status

View current test status and coverage:

```bash
# Show test dashboard
npm run test:status

# Show detailed information including untested items
npm run test:status -- --verbose
npm run test:status -- -v
```

### Managing Bugs

List, update, and export bug reports:

```bash
# List all bugs
npm run test:bugs

# Filter bugs by status
npm run test:bugs -- --status OPEN
npm run test:bugs -- --status FIXED

# Filter bugs by severity
npm run test:bugs -- --severity CRITICAL
npm run test:bugs -- --severity MAJOR

# Filter bugs by category
npm run test:bugs -- --category PARSER_ERROR
npm run test:bugs -- --category MISSING_CONTENT

# Combine filters
npm run test:bugs -- --status OPEN --severity CRITICAL

# Update bug status
npm run test:bug-update BUG-001 FIXED
npm run test:bug-update BUG-002 IN_PROGRESS
npm run test:bug-update BUG-003 VERIFIED

# Export bug reports
npm run test:bug-export                    # Export as Markdown
npm run test:bug-export -- --json          # Export as JSON
```

### Valid Bug Statuses

- `OPEN` - Bug is newly reported
- `IN_PROGRESS` - Bug is being worked on
- `FIXED` - Bug has been fixed
- `VERIFIED` - Fix has been verified
- `WONT_FIX` - Bug will not be fixed

### Valid Bug Severities

- `CRITICAL` - Game-breaking, crashes
- `MAJOR` - Feature doesn't work
- `MINOR` - Small issue, workaround exists
- `TRIVIAL` - Cosmetic, typos

### Valid Bug Categories

- `PARSER_ERROR` - Parser issues
- `ACTION_ERROR` - Action handler issues
- `MISSING_CONTENT` - Missing content
- `INCORRECT_BEHAVIOR` - Wrong behavior
- `CRASH` - Crashes
- `TEXT_ERROR` - Text issues

### CLI Examples

```bash
# Quick test of a few rooms
npm run test:run -- --rooms --max 20

# Check what's been tested
npm run test:status

# See detailed status with untested items
npm run test:status -- --verbose

# Find all critical bugs
npm run test:bugs -- --severity CRITICAL

# Mark a bug as fixed
npm run test:bug-update BUG-001 FIXED

# Export bugs for review
npm run test:bug-export
```
