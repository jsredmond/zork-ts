#!/usr/bin/env node
/**
 * CLI entry point for bug management
 */

import { runBugListCommand, runBugUpdateCommand, runBugExportCommand, displayHelp } from './cli.js';

const args = process.argv.slice(2);

if (args.length === 0) {
  // Default to listing bugs
  runBugListCommand(args);
} else {
  const command = args[0];
  
  switch (command) {
    case 'list':
      runBugListCommand(args.slice(1));
      break;
    case 'update':
      runBugUpdateCommand(args.slice(1));
      break;
    case 'export':
      runBugExportCommand(args.slice(1));
      break;
    case 'help':
    case '--help':
    case '-h':
      displayHelp();
      break;
    default:
      // Treat as filter arguments for list
      runBugListCommand(args);
      break;
  }
}
