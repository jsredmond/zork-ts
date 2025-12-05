/**
 * CLI interface for the exhaustive testing system
 * Provides commands for running tests, checking status, and managing bugs
 */

import { TestCoordinator } from './coordinator';
import { TestReporter } from './reporter';
import { createInitialGameState } from '../game/factories/gameFactory';
import { loadTestProgress, loadBugReports, updateBugReport, getBugs } from './persistence';
import { BugStatus, TestOptions } from './types';

/**
 * Parse command line arguments into test options
 */
export function parseTestOptions(args: string[]): TestOptions {
  const options: TestOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--rooms':
        options.testRooms = true;
        break;
      case '--objects':
        options.testObjects = true;
        break;
      case '--puzzles':
        options.testPuzzles = true;
        break;
      case '--npcs':
        options.testNPCs = true;
        break;
      case '--edge-cases':
        options.testEdgeCases = true;
        break;
      case '--max':
        if (i + 1 < args.length) {
          options.maxTests = parseInt(args[++i], 10);
        }
        break;
      case '--room-filter':
        if (i + 1 < args.length) {
          options.roomFilter = args[++i].split(',');
        }
        break;
      case '--object-filter':
        if (i + 1 < args.length) {
          options.objectFilter = args[++i].split(',');
        }
        break;
    }
  }
  
  // Default to testing rooms and objects if nothing specified
  if (!options.testRooms && !options.testObjects && !options.testPuzzles && 
      !options.testNPCs && !options.testEdgeCases) {
    options.testRooms = true;
    options.testObjects = true;
  }
  
  return options;
}

/**
 * Run tests with the specified options
 */
export async function runTestCommand(args: string[]): Promise<void> {
  console.log('='.repeat(50));
  console.log('ZORK EXHAUSTIVE TESTING SYSTEM');
  console.log('='.repeat(50));
  console.log('');
  
  // Parse options
  const options = parseTestOptions(args);
  
  // Display what will be tested
  console.log('Test Configuration:');
  if (options.testRooms) console.log('  ✓ Rooms');
  if (options.testObjects) console.log('  ✓ Objects');
  if (options.testPuzzles) console.log('  ✓ Puzzles');
  if (options.testNPCs) console.log('  ✓ NPCs');
  if (options.testEdgeCases) console.log('  ✓ Edge Cases');
  if (options.maxTests) console.log(`  ✓ Max Tests: ${options.maxTests}`);
  if (options.roomFilter) console.log(`  ✓ Room Filter: ${options.roomFilter.join(', ')}`);
  if (options.objectFilter) console.log(`  ✓ Object Filter: ${options.objectFilter.join(', ')}`);
  console.log('');
  
  // Initialize coordinator and game state
  const coordinator = new TestCoordinator();
  const state = createInitialGameState();
  
  console.log('Starting tests...');
  console.log('');
  
  // Run tests
  const startTime = Date.now();
  const results = await coordinator.runTests(options, state);
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Clear progress line
  process.stdout.write('\r' + ' '.repeat(80) + '\r');
  
  // Display summary
  console.log('');
  console.log('='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('');
  console.log(`Total Tests:    ${results.totalTests}`);
  console.log(`Passed:         ${results.passedTests} (${((results.passedTests / results.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Failed:         ${results.failedTests} (${((results.failedTests / results.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Bugs Found:     ${results.bugsFound}`);
  console.log(`Duration:       ${duration}s`);
  console.log('');
  
  // Display coverage
  console.log('Coverage:');
  console.log(`  Rooms:        ${results.coverage.rooms.toFixed(2)}%`);
  console.log(`  Objects:      ${results.coverage.objects.toFixed(2)}%`);
  console.log(`  Interactions: ${results.coverage.interactions.toFixed(2)}%`);
  console.log('');
  console.log('='.repeat(50));
  console.log('');
  
  if (results.bugsFound > 0) {
    console.log(`⚠️  ${results.bugsFound} bug(s) found. Run 'npm run test:status' to see details.`);
  } else {
    console.log('✓ All tests passed!');
  }
  console.log('');
}

/**
 * Display current test status
 */
export function runStatusCommand(args: string[]): void {
  console.log('');
  
  // Load test progress
  const progress = loadTestProgress();
  if (!progress) {
    console.log('No test progress found. Run tests first with: npm run test:run');
    console.log('');
    return;
  }
  
  // Load bugs
  const database = loadBugReports();
  
  // Create reporter and display dashboard
  const reporter = new TestReporter();
  const dashboard = reporter.displayTestDashboard(progress, database.bugs);
  console.log(dashboard);
  
  // Check for verbose flag
  const verbose = args.includes('--verbose') || args.includes('-v');
  
  if (verbose) {
    console.log('');
    console.log(reporter.displayUntestedItems(progress));
    console.log('');
  }
}

/**
 * List bugs with optional filtering
 */
export function runBugListCommand(args: string[]): void {
  console.log('');
  console.log('='.repeat(50));
  console.log('BUG REPORTS');
  console.log('='.repeat(50));
  console.log('');
  
  // Parse filter options
  const filter: { status?: string; category?: string; severity?: string } = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--status':
        if (i + 1 < args.length) {
          filter.status = args[++i].toUpperCase();
        }
        break;
      case '--category':
        if (i + 1 < args.length) {
          filter.category = args[++i].toUpperCase();
        }
        break;
      case '--severity':
        if (i + 1 < args.length) {
          filter.severity = args[++i].toUpperCase();
        }
        break;
    }
  }
  
  // Get bugs with filter
  const bugs = getBugs(filter);
  
  if (bugs.length === 0) {
    console.log('No bugs found matching the criteria.');
    console.log('');
    return;
  }
  
  console.log(`Found ${bugs.length} bug(s):`);
  console.log('');
  
  // Display bugs
  bugs.forEach(bug => {
    console.log(`${bug.id}: ${bug.title}`);
    console.log(`  Status:   ${bug.status}`);
    console.log(`  Severity: ${bug.severity}`);
    console.log(`  Category: ${bug.category}`);
    console.log(`  Found:    ${bug.foundDate.toISOString()}`);
    console.log('');
  });
}

/**
 * Update bug status
 */
export function runBugUpdateCommand(args: string[]): void {
  if (args.length < 2) {
    console.error('Usage: npm run test:bug-update <bug-id> <status>');
    console.error('Valid statuses: OPEN, IN_PROGRESS, FIXED, VERIFIED, WONT_FIX');
    process.exit(1);
  }
  
  const bugId = args[0];
  const newStatus = args[1].toUpperCase() as BugStatus;
  
  // Validate status
  if (!Object.values(BugStatus).includes(newStatus)) {
    console.error(`Invalid status: ${newStatus}`);
    console.error('Valid statuses: OPEN, IN_PROGRESS, FIXED, VERIFIED, WONT_FIX');
    process.exit(1);
  }
  
  try {
    // Update bug
    const updates: any = { status: newStatus };
    
    // Add timestamp for status changes
    if (newStatus === BugStatus.FIXED) {
      updates.fixedDate = new Date();
    } else if (newStatus === BugStatus.VERIFIED) {
      updates.verifiedDate = new Date();
    }
    
    updateBugReport(bugId, updates);
    
    console.log('');
    console.log(`✓ Bug ${bugId} status updated to ${newStatus}`);
    console.log('');
  } catch (error) {
    console.error('');
    console.error(`✗ Error updating bug: ${error instanceof Error ? error.message : String(error)}`);
    console.error('');
    process.exit(1);
  }
}

/**
 * Export bug reports
 */
export function runBugExportCommand(args: string[]): void {
  const format = args.includes('--json') ? 'json' : 'markdown';
  
  const database = loadBugReports();
  const reporter = new TestReporter();
  
  let filepath: string;
  
  if (format === 'json') {
    filepath = reporter.saveBugReportsJSON(database.bugs);
    console.log('');
    console.log(`✓ Bug reports exported to: ${filepath}`);
    console.log('');
  } else {
    const report = reporter.generateBugSummaryReport(database.bugs);
    filepath = reporter.saveBugSummaryReport(report);
    console.log('');
    console.log(`✓ Bug summary exported to: ${filepath}`);
    console.log('');
  }
}

/**
 * Display help information
 */
export function displayHelp(): void {
  console.log('');
  console.log('Zork Exhaustive Testing System');
  console.log('');
  console.log('Commands:');
  console.log('  npm run test:run [options]     Run tests');
  console.log('  npm run test:status [options]  Show test status');
  console.log('  npm run test:bugs [options]    List bugs');
  console.log('  npm run test:bug-update        Update bug status');
  console.log('  npm run test:bug-export        Export bug reports');
  console.log('');
  console.log('Test Options:');
  console.log('  --rooms                Test rooms');
  console.log('  --objects              Test objects');
  console.log('  --puzzles              Test puzzles');
  console.log('  --npcs                 Test NPCs');
  console.log('  --edge-cases           Test edge cases');
  console.log('  --max <n>              Maximum number of tests');
  console.log('  --room-filter <ids>    Comma-separated room IDs');
  console.log('  --object-filter <ids>  Comma-separated object IDs');
  console.log('');
  console.log('Status Options:');
  console.log('  --verbose, -v          Show detailed information');
  console.log('');
  console.log('Bug List Options:');
  console.log('  --status <status>      Filter by status');
  console.log('  --category <category>  Filter by category');
  console.log('  --severity <severity>  Filter by severity');
  console.log('');
  console.log('Bug Export Options:');
  console.log('  --json                 Export as JSON (default: markdown)');
  console.log('');
  console.log('Examples:');
  console.log('  npm run test:run --rooms --max 50');
  console.log('  npm run test:status --verbose');
  console.log('  npm run test:bugs --status OPEN --severity CRITICAL');
  console.log('  npm run test:bug-update BUG-001 FIXED');
  console.log('  npm run test:bug-export --json');
  console.log('');
}
