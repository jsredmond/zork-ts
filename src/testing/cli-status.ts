#!/usr/bin/env node
/**
 * CLI entry point for checking test status
 */

import { runStatusCommand } from './cli.js';

const args = process.argv.slice(2);

runStatusCommand(args);
