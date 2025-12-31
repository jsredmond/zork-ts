#!/usr/bin/env tsx
/**
 * Detailed Parity Difference Analysis Tool
 * 
 * This script runs parity validation and exports all differences to JSON files
 * for detailed analysis. It categorizes differences by type and identifies
 * patterns for prioritized fixing.
 * 
 * Usage:
 *   npx tsx scripts/analyze-parity-differences-detailed.ts
 *   npx tsx scripts/analyze-parity-differences-detailed.ts --iteration 2
 *   npx tsx scripts/analyze-parity-differences-detailed.ts --quick
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import {
  createExhaustiveParityValidator,
  DEFAULT_PARITY_CONFIG,
  ParityResults,
  SeedResult,
} from '../src/testing/exhaustiveParityValidator.js';
import {
  ClassifiedDifference,
  DifferenceType,
} from '../src/testing/differenceClassifier.js';
import * as fs from 'fs';

/**
 * Categories for difference analysis
 */
type DifferenceCategory = 
  | 'message_content'      // Wrong message text
  | 'object_behavior'      // Object interaction differs
  | 'parser_response'      // Parser error/handling differs
  | 'room_description'     // Room text differs
  | 'conditional_logic'    // Condition evaluation differs
  | 'state_logic'          // Game state handling differs
  | 'timing_difference'    // Daemon/event timing differs
  | 'atmospheric_message'  // Random atmospheric messages
  | 'status_bar'           // Status bar formatting
  | 'unknown';             // Cannot categorize

/**
 * Extended difference with category
 */
interface CategorizedDifference extends ClassifiedDifference {
  category: DifferenceCategory;
  pattern?: string;
}


/**
 * Pattern for grouping similar differences
 */
interface DifferencePattern {
  id: string;
  category: DifferenceCategory;
  description: string;
  occurrences: number;
  examples: CategorizedDifference[];
  targetFiles: string[];
  estimatedImpact: number;
}

/**
 * Analysis results
 */
interface AnalysisResults {
  timestamp: string;
  iteration: number;
  config: {
    seeds: number;
    commandsPerSeed: number;
    totalCommands: number;
  };
  summary: {
    logicParity: number;
    overallParity: number;
    totalDifferences: number;
    logicDifferences: number;
    rngDifferences: number;
    stateDivergences: number;
    statusBarDifferences: number;
  };
  byCategory: Record<DifferenceCategory, number>;
  patterns: DifferencePattern[];
  allDifferences: CategorizedDifference[];
}

/**
 * Prioritized fix list
 */
interface PrioritizedFix {
  rank: number;
  patternId: string;
  category: DifferenceCategory;
  description: string;
  occurrences: number;
  targetFiles: string[];
  estimatedImpact: number;
  examples: Array<{
    command: string;
    tsOutput: string;
    zmOutput: string;
  }>;
}

interface PrioritizedFixList {
  timestamp: string;
  iteration: number;
  totalPatterns: number;
  fixes: PrioritizedFix[];
}

/**
 * Categorize a difference based on its content
 */
function categorizeDifference(diff: ClassifiedDifference): DifferenceCategory {
  const tsLower = diff.tsOutput.toLowerCase();
  const zmLower = diff.zmOutput.toLowerCase();
  const cmdLower = diff.command.toLowerCase();
  
  // Check for atmospheric messages (random messages appended to output)
  const atmosphericPatterns = [
    'you hear',
    'a hollow voice',
    'in the distance',
    'chirping',
    'song bird',
    'rumbling noise',
    'faint rustling',
  ];
  
  for (const pattern of atmosphericPatterns) {
    if (tsLower.includes(pattern) !== zmLower.includes(pattern)) {
      return 'atmospheric_message';
    }
  }
  
  // Check for parser responses
  const parserPatterns = [
    "i don't understand",
    "i don't know the word",
    "i don't know how",
    "you can't see any",
    "there is no",
    "what do you want",
    "i can't reach",
    "you don't have",
  ];
  
  for (const pattern of parserPatterns) {
    if (tsLower.includes(pattern) || zmLower.includes(pattern)) {
      return 'parser_response';
    }
  }
  
  // Check for room descriptions
  if (cmdLower === 'look' || cmdLower === 'l') {
    return 'room_description';
  }
  
  // Check for object behavior
  const objectVerbs = [
    'take', 'get', 'drop', 'put', 'examine', 'x', 'open', 'close',
    'read', 'move', 'push', 'pull', 'turn', 'light', 'extinguish',
    'eat', 'drink', 'wear', 'remove', 'tie', 'untie', 'attack', 'kill',
  ];
  
  for (const verb of objectVerbs) {
    if (cmdLower.startsWith(verb + ' ') || cmdLower === verb) {
      return 'object_behavior';
    }
  }
  
  // Check for navigation
  const navCommands = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw', 'u', 'd', 
                       'north', 'south', 'east', 'west', 'up', 'down',
                       'enter', 'exit', 'climb', 'go'];
  
  if (navCommands.includes(cmdLower) || cmdLower.startsWith('go ')) {
    return 'room_description';
  }
  
  // Check for timing/daemon differences
  if (tsLower.includes('lamp') || zmLower.includes('lamp') ||
      tsLower.includes('candle') || zmLower.includes('candle') ||
      tsLower.includes('thief') || zmLower.includes('thief') ||
      tsLower.includes('troll') || zmLower.includes('troll')) {
    return 'timing_difference';
  }
  
  // Default to message content
  return 'message_content';
}


/**
 * Generate a pattern ID from a difference
 */
function generatePatternId(diff: CategorizedDifference): string {
  // Create a pattern based on the command and key parts of the output
  const cmdParts = diff.command.toLowerCase().split(' ');
  const verb = cmdParts[0] || 'unknown';
  
  // Extract key phrases from outputs
  const tsKey = extractKeyPhrase(diff.tsOutput);
  const zmKey = extractKeyPhrase(diff.zmOutput);
  
  return `${diff.category}:${verb}:${tsKey}:${zmKey}`.substring(0, 100);
}

/**
 * Extract a key phrase from output for pattern matching
 */
function extractKeyPhrase(output: string): string {
  const normalized = output.toLowerCase().trim();
  
  // Common patterns to extract
  const patterns = [
    /you can't ([\w\s]+)/,
    /you don't ([\w\s]+)/,
    /there is no ([\w\s]+)/,
    /i don't ([\w\s]+)/,
    /the ([\w]+) is/,
    /^([\w\s]{1,30})/,
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return match[1].substring(0, 20).replace(/\s+/g, '_');
    }
  }
  
  return normalized.substring(0, 20).replace(/\s+/g, '_');
}

/**
 * Get target files for a category
 */
function getTargetFiles(category: DifferenceCategory): string[] {
  switch (category) {
    case 'message_content':
      return ['src/game/data/messages.ts', 'src/game/actions.ts'];
    case 'object_behavior':
      return ['src/game/actions.ts', 'src/game/sceneryActions.ts', 'src/game/objects.ts'];
    case 'parser_response':
      return ['src/parser/feedback.ts', 'src/game/errorMessages.ts', 'src/parser/parser.ts'];
    case 'room_description':
      return ['src/game/data/rooms.ts', 'src/game/rooms.ts'];
    case 'conditional_logic':
      return ['src/game/actions.ts', 'src/game/puzzles.ts'];
    case 'state_logic':
      return ['src/game/state.ts', 'src/engine/executor.ts'];
    case 'timing_difference':
      return ['src/engine/daemons.ts', 'src/engine/events.ts'];
    case 'atmospheric_message':
      return ['src/game/atmosphericMessages.ts', 'src/engine/daemons.ts'];
    case 'status_bar':
      return ['src/parity/StatusBarNormalizer.ts', 'src/io/terminal.ts'];
    default:
      return ['src/game/actions.ts'];
  }
}

/**
 * Analyze all differences and generate patterns
 */
function analyzeDifferences(
  results: ParityResults,
  iteration: number
): AnalysisResults {
  const allDifferences: CategorizedDifference[] = [];
  const byCategory: Record<DifferenceCategory, number> = {
    message_content: 0,
    object_behavior: 0,
    parser_response: 0,
    room_description: 0,
    conditional_logic: 0,
    state_logic: 0,
    timing_difference: 0,
    atmospheric_message: 0,
    status_bar: 0,
    unknown: 0,
  };
  
  // Collect and categorize all differences
  for (const [_seed, seedResult] of results.seedResults) {
    for (const diff of seedResult.differences) {
      const category = categorizeDifference(diff);
      const categorized: CategorizedDifference = {
        ...diff,
        category,
      };
      categorized.pattern = generatePatternId(categorized);
      allDifferences.push(categorized);
      byCategory[category]++;
    }
  }
  
  // Group by pattern
  const patternMap = new Map<string, CategorizedDifference[]>();
  for (const diff of allDifferences) {
    const pattern = diff.pattern || 'unknown';
    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, []);
    }
    patternMap.get(pattern)!.push(diff);
  }
  
  // Create pattern objects
  const patterns: DifferencePattern[] = [];
  for (const [patternId, diffs] of patternMap) {
    const firstDiff = diffs[0];
    patterns.push({
      id: patternId,
      category: firstDiff.category,
      description: `${firstDiff.command}: TS="${firstDiff.tsOutput.substring(0, 50)}" vs ZM="${firstDiff.zmOutput.substring(0, 50)}"`,
      occurrences: diffs.length,
      examples: diffs.slice(0, 3),
      targetFiles: getTargetFiles(firstDiff.category),
      estimatedImpact: diffs.length,
    });
  }
  
  // Sort patterns by occurrence count
  patterns.sort((a, b) => b.occurrences - a.occurrences);
  
  const totalCommands = results.seedResults.size * 250;
  
  return {
    timestamp: new Date().toISOString(),
    iteration,
    config: {
      seeds: results.seedResults.size,
      commandsPerSeed: 250,
      totalCommands,
    },
    summary: {
      logicParity: results.logicParityPercentage,
      overallParity: results.overallParityPercentage,
      totalDifferences: results.totalDifferences,
      logicDifferences: results.logicDifferences,
      rngDifferences: results.rngDifferences,
      stateDivergences: results.stateDivergences,
      statusBarDifferences: results.statusBarDifferences,
    },
    byCategory,
    patterns,
    allDifferences,
  };
}


/**
 * Generate prioritized fix list from analysis
 */
function generatePrioritizedFixes(
  analysis: AnalysisResults
): PrioritizedFixList {
  const fixes: PrioritizedFix[] = analysis.patterns
    .filter(p => p.occurrences > 0)
    .map((pattern, index) => ({
      rank: index + 1,
      patternId: pattern.id,
      category: pattern.category,
      description: pattern.description,
      occurrences: pattern.occurrences,
      targetFiles: pattern.targetFiles,
      estimatedImpact: pattern.estimatedImpact,
      examples: pattern.examples.slice(0, 3).map(ex => ({
        command: ex.command,
        tsOutput: ex.tsOutput,
        zmOutput: ex.zmOutput,
      })),
    }));
  
  return {
    timestamp: analysis.timestamp,
    iteration: analysis.iteration,
    totalPatterns: fixes.length,
    fixes,
  };
}

/**
 * Parse command line arguments
 */
function parseArgs(): { iteration: number; quick: boolean } {
  const args = process.argv.slice(2);
  let iteration = 1;
  let quick = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--iteration' || args[i] === '-i') {
      iteration = parseInt(args[++i] || '1', 10);
    } else if (args[i] === '--quick' || args[i] === '-q') {
      quick = true;
    }
  }
  
  return { iteration, quick };
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const { iteration, quick } = parseArgs();
  
  console.log('');
  console.log('='.repeat(60));
  console.log('Detailed Parity Difference Analysis');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Iteration: ${iteration}`);
  console.log(`Mode: ${quick ? 'Quick' : 'Full'}`);
  console.log('');
  
  // Configure validator
  const seeds = quick 
    ? [12345, 67890, 54321, 99999, 11111]
    : DEFAULT_PARITY_CONFIG.seeds;
  const commandsPerSeed = quick ? 100 : 250;
  
  console.log(`Seeds: ${seeds.length}`);
  console.log(`Commands per seed: ${commandsPerSeed}`);
  console.log('');
  
  // Create validator
  const validator = createExhaustiveParityValidator({
    seeds,
    commandsPerSeed,
  });
  
  // Load sequences
  const sequenceCount = validator.loadDefaultSequences();
  console.log(`Loaded ${sequenceCount} command sequences`);
  
  // Initialize Z-Machine
  console.log('Initializing Z-Machine recorder...');
  const zmAvailable = await validator.initialize();
  if (!zmAvailable) {
    console.log('Warning: Z-Machine not available');
  }
  console.log('');
  
  // Run validation
  console.log('Running parity validation...');
  const startTime = Date.now();
  const results = await validator.runWithSeeds(seeds);
  const elapsed = Date.now() - startTime;
  console.log(`Completed in ${(elapsed / 1000).toFixed(2)}s`);
  console.log('');
  
  // Print summary
  console.log(results.summary);
  console.log('');
  
  // Analyze differences
  console.log('Analyzing differences...');
  const analysis = analyzeDifferences(results, iteration);
  
  // Generate prioritized fixes
  const prioritizedFixes = generatePrioritizedFixes(analysis);
  
  // Write output files
  const differencesFile = `parity-differences-iteration-${iteration}.json`;
  const prioritiesFile = `parity-fix-priorities-iteration-${iteration}.json`;
  
  // Write differences (without full allDifferences to keep file manageable)
  const differencesOutput = {
    ...analysis,
    allDifferences: analysis.allDifferences.slice(0, 500), // Limit to first 500
    totalDifferencesCount: analysis.allDifferences.length,
  };
  
  fs.writeFileSync(differencesFile, JSON.stringify(differencesOutput, null, 2));
  console.log(`Wrote differences to: ${differencesFile}`);
  
  fs.writeFileSync(prioritiesFile, JSON.stringify(prioritizedFixes, null, 2));
  console.log(`Wrote priorities to: ${prioritiesFile}`);
  console.log('');
  
  // Print top 10 patterns
  console.log('Top 10 Difference Patterns:');
  console.log('-'.repeat(60));
  for (let i = 0; i < Math.min(10, prioritizedFixes.fixes.length); i++) {
    const fix = prioritizedFixes.fixes[i];
    console.log(`${fix.rank}. [${fix.category}] ${fix.occurrences} occurrences`);
    console.log(`   ${fix.description.substring(0, 80)}`);
    console.log(`   Files: ${fix.targetFiles.join(', ')}`);
    console.log('');
  }
  
  // Print category summary
  console.log('Differences by Category:');
  console.log('-'.repeat(60));
  for (const [category, count] of Object.entries(analysis.byCategory)) {
    if (count > 0) {
      console.log(`  ${category}: ${count}`);
    }
  }
  console.log('');
  
  console.log('Analysis complete!');
}

// Run main
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
