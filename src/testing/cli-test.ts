#!/usr/bin/env node
/**
 * CLI entry point for running tests
 */

import { runTestCommand } from './cli.js';

const args = process.argv.slice(2);

runTestCommand(args).catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
