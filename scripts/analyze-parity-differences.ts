#!/usr/bin/env tsx

/**
 * Analyze Parity Differences
 * 
 * This script runs parity tests across multiple seeds and classifies
 * each difference as either RNG-related or logic-related.
 * 
 * RNG-related: Both messages are from the same valid pool (YUKS, HO-HUM, HELLOS)
 * Logic-related: Messages from different pools or structural differences
 * 
 * Requirements: 9.7, 10.1, 10.2, 10.3
 */

import { SpotTestRunner } from '../src/testing/spotTesting/spotTestRunner.js';
import { 
  REFUSAL_MESSAGES, 
  INEFFECTIVE_ACTION_MESSAGES, 
  HELLO_MESSAGES,
  GENERIC_REFUSAL_MESSAGES,
  SILLY_ACTION_MESSAGES
} from '../src/game/data/messages.js';

// Define the RNG message pools
const RNG_POOLS = {
  YUKS: [
    ...REFUSAL_MESSAGES,
    ...GENERIC_REFUSAL_MESSAGES,
    "A valiant attempt.",
    "You can't be serious.",
    "An interesting idea...",
    "What a concept!"
  ],
  HO_HUM: [
    " doesn't seem to work.",
    " isn't notably helpful.",
    " has no effect.",
    "doesn't seem to work.",
    "isn't notably helpful.",
    "has no effect."
  ],
  HELLOS: [
    ...HELLO_MESSAGES,
    "Hello.",
    "Good day.",
    "Nice weather we've been having lately.",
    "Goodbye."
  ],
  WHEEEEE: [
    ...SILLY_ACTION_MESSAGES,
    "Very good. Now you can go to the second grade.",
    "Are you enjoying yourself?",
    "Wheeeeeeeeee!!!!!",
    "Do you expect me to applaud?"
  ]
};

interface DifferenceClassification {
  commandIndex: number;
  command: string;
  tsOutput: string;
  zmOutput: string;
  classification: 'RNG' | 'LOGIC';
  rngPool?: string;
  reason: string;
  category: string;
}

interface AnalysisResult {
  seed: number;
  totalCommands: number;
  totalDifferences: number;
  rngDifferences: number;
  logicDifferences: number;
  totalParity: number;
  logicParity: number;
  differences: DifferenceClassification[];
}

/**
 * Check if a message is from a specific RNG pool
 */
function isFromPool(message: string, pool: string[]): boolean {
  const normalizedMessage = message.trim().toLowerCase();
  return pool.some(poolMsg => {
    const normalizedPoolMsg = poolMsg.trim().toLowerCase();
    return normalizedMessage.includes(normalizedPoolMsg) || 
           normalizedPoolMsg.includes(normalizedMessage) ||
           normalizedMessage === normalizedPoolMsg;
  });
}

/**
 * Find which RNG pool a message belongs to
 */
function findPool(message: string): string | null {
  for (const [poolName, pool] of Object.entries(RNG_POOLS)) {
    if (isFromPool(message, pool)) {
      return poolName;
    }
  }
  return null;
}

/**
 * Extract the core message from output (remove status bar)
 */
function extractCoreMessage(output: string): string {
  // Remove status bar line (contains Score: and Moves:)
  const lines = output.split('\n');
  const filteredLines = lines.filter(line => 
    !line.includes('Score:') && 
    !line.includes('Moves:') &&
    line.trim() !== ''
  );
  return filteredLines.join('\n').trim();
}

/**
 * Classify a single difference as RNG or LOGIC
 */
function classifyDifference(diff: {
  commandIndex: number;
  command: string;
  tsOutput: string;
  zmOutput: string;
  differenceType: string;
}): DifferenceClassification {
  const tsCore = extractCoreMessage(diff.tsOutput);
  const zmCore = extractCoreMessage(diff.zmOutput);
  
  // Check if both messages are from the same RNG pool
  const tsPool = findPool(tsCore);
  const zmPool = findPool(zmCore);
  
  // If both are from the same pool, it's an RNG difference
  if (tsPool && zmPool && tsPool === zmPool) {
    return {
      commandIndex: diff.commandIndex,
      command: diff.command,
      tsOutput: tsCore,
      zmOutput: zmCore,
      classification: 'RNG',
      rngPool: tsPool,
      reason: `Both messages from ${tsPool} pool`,
      category: 'rng_variance'
    };
  }
  
  // Check for status bar only difference
  if (tsCore.toLowerCase() === zmCore.toLowerCase()) {
    return {
      commandIndex: diff.commandIndex,
      command: diff.command,
      tsOutput: tsCore,
      zmOutput: zmCore,
      classification: 'LOGIC',
      reason: 'Status bar formatting difference only',
      category: 'status_bar_format'
    };
  }
  
  // Check for specific known logic differences
  const logicCategory = categorizeLogicDifference(diff.command, tsCore, zmCore);
  
  return {
    commandIndex: diff.commandIndex,
    command: diff.command,
    tsOutput: tsCore,
    zmOutput: zmCore,
    classification: 'LOGIC',
    reason: logicCategory.reason,
    category: logicCategory.category
  };
}

/**
 * Categorize a logic difference
 */
function categorizeLogicDifference(command: string, tsOutput: string, zmOutput: string): { reason: string; category: string } {
  const cmd = command.toLowerCase().trim();
  const ts = tsOutput.toLowerCase();
  const zm = zmOutput.toLowerCase();
  
  // Parser differences
  if (ts.includes("there seems to be a noun missing") && zm.includes("what do you want")) {
    return { reason: 'Parser prompt style differs', category: 'parser_prompt' };
  }
  
  if (ts.includes("i don't know the word") !== zm.includes("i don't know the word")) {
    return { reason: 'Unknown word handling differs', category: 'parser_vocabulary' };
  }
  
  if (ts.includes("you can't see any") && zm.includes("you don't have")) {
    return { reason: 'Visibility vs possession check order', category: 'check_order' };
  }
  
  // Look around handling
  if (cmd === 'look around') {
    return { reason: '"look around" command handling differs', category: 'look_around' };
  }
  
  // Room word handling
  if (cmd.includes('room')) {
    return { reason: '"room" word not in vocabulary', category: 'vocabulary_room' };
  }
  
  // Default
  return { reason: 'Message text differs', category: 'message_text' };
}

/**
 * Run analysis for a single seed
 */
async function analyzeForSeed(seed: number): Promise<AnalysisResult> {
  const runner = new SpotTestRunner();
  
  console.log(`\nRunning parity test with seed ${seed}...`);
  
  const result = await runner.runSpotTest({
    commandCount: 200,
    seed: seed,
    timeoutMs: 60000
  });
  
  const classifications: DifferenceClassification[] = [];
  
  for (const diff of result.differences) {
    const classification = classifyDifference(diff);
    classifications.push(classification);
  }
  
  const rngDifferences = classifications.filter(c => c.classification === 'RNG').length;
  const logicDifferences = classifications.filter(c => c.classification === 'LOGIC').length;
  
  const totalParity = result.parityScore;
  const logicParity = result.totalCommands > 0 
    ? ((result.totalCommands - logicDifferences) / result.totalCommands) * 100 
    : 100;
  
  return {
    seed,
    totalCommands: result.totalCommands,
    totalDifferences: result.differences.length,
    rngDifferences,
    logicDifferences,
    totalParity,
    logicParity,
    differences: classifications
  };
}

/**
 * Generate summary report
 */
function generateReport(results: AnalysisResult[]): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push('PARITY DIFFERENCE ANALYSIS REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  // Overall summary
  lines.push('OVERALL SUMMARY');
  lines.push('-'.repeat(40));
  
  const totalCommands = results.reduce((sum, r) => sum + r.totalCommands, 0);
  const totalDiffs = results.reduce((sum, r) => sum + r.totalDifferences, 0);
  const totalRng = results.reduce((sum, r) => sum + r.rngDifferences, 0);
  const totalLogic = results.reduce((sum, r) => sum + r.logicDifferences, 0);
  const avgTotalParity = results.reduce((sum, r) => sum + r.totalParity, 0) / results.length;
  const avgLogicParity = results.reduce((sum, r) => sum + r.logicParity, 0) / results.length;
  
  lines.push(`Seeds tested: ${results.length}`);
  lines.push(`Total commands: ${totalCommands}`);
  lines.push(`Total differences: ${totalDiffs}`);
  lines.push(`  - RNG-related: ${totalRng} (${((totalRng / totalDiffs) * 100).toFixed(1)}%)`);
  lines.push(`  - Logic-related: ${totalLogic} (${((totalLogic / totalDiffs) * 100).toFixed(1)}%)`);
  lines.push('');
  lines.push(`Average Total Parity: ${avgTotalParity.toFixed(1)}%`);
  lines.push(`Average Logic Parity: ${avgLogicParity.toFixed(1)}%`);
  lines.push('');
  
  // Per-seed results
  lines.push('PER-SEED RESULTS');
  lines.push('-'.repeat(40));
  
  for (const result of results) {
    lines.push(`Seed ${result.seed}:`);
    lines.push(`  Total Parity: ${result.totalParity.toFixed(1)}%`);
    lines.push(`  Logic Parity: ${result.logicParity.toFixed(1)}%`);
    lines.push(`  Differences: ${result.totalDifferences} (RNG: ${result.rngDifferences}, Logic: ${result.logicDifferences})`);
    lines.push('');
  }
  
  // Logic differences by category
  lines.push('LOGIC DIFFERENCES BY CATEGORY');
  lines.push('-'.repeat(40));
  
  const categoryCount = new Map<string, number>();
  const categoryExamples = new Map<string, DifferenceClassification[]>();
  
  for (const result of results) {
    for (const diff of result.differences) {
      if (diff.classification === 'LOGIC') {
        const count = categoryCount.get(diff.category) || 0;
        categoryCount.set(diff.category, count + 1);
        
        const examples = categoryExamples.get(diff.category) || [];
        if (examples.length < 3) {
          examples.push(diff);
        }
        categoryExamples.set(diff.category, examples);
      }
    }
  }
  
  // Sort by frequency
  const sortedCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]);
  
  for (const [category, count] of sortedCategories) {
    lines.push(`${category}: ${count} occurrences`);
    const examples = categoryExamples.get(category) || [];
    for (const ex of examples.slice(0, 2)) {
      lines.push(`  Example: "${ex.command}"`);
      lines.push(`    TS: ${ex.tsOutput.substring(0, 60)}${ex.tsOutput.length > 60 ? '...' : ''}`);
      lines.push(`    ZM: ${ex.zmOutput.substring(0, 60)}${ex.zmOutput.length > 60 ? '...' : ''}`);
    }
    lines.push('');
  }
  
  // RNG differences summary
  lines.push('RNG DIFFERENCES BY POOL');
  lines.push('-'.repeat(40));
  
  const poolCount = new Map<string, number>();
  for (const result of results) {
    for (const diff of result.differences) {
      if (diff.classification === 'RNG' && diff.rngPool) {
        const count = poolCount.get(diff.rngPool) || 0;
        poolCount.set(diff.rngPool, count + 1);
      }
    }
  }
  
  for (const [pool, count] of poolCount.entries()) {
    lines.push(`${pool}: ${count} occurrences`);
  }
  
  if (poolCount.size === 0) {
    lines.push('No RNG differences detected');
  }
  
  lines.push('');
  
  // Recommendations
  lines.push('RECOMMENDATIONS');
  lines.push('-'.repeat(40));
  
  if (avgLogicParity >= 99) {
    lines.push('✅ Logic parity is at or above 99% - excellent!');
    lines.push('   Remaining differences are primarily RNG-related.');
  } else {
    lines.push('⚠️  Logic parity is below 99% - fixes needed');
    lines.push('');
    lines.push('Priority fixes:');
    
    let priority = 1;
    for (const [category, count] of sortedCategories.slice(0, 5)) {
      lines.push(`  ${priority}. ${category} (${count} occurrences)`);
      priority++;
    }
  }
  
  lines.push('');
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const seeds = [12345, 67890, 54321, 99999, 11111];
  const results: AnalysisResult[] = [];
  
  console.log('Parity Difference Analysis');
  console.log('==========================');
  console.log(`Testing ${seeds.length} seeds: ${seeds.join(', ')}`);
  
  for (const seed of seeds) {
    try {
      const result = await analyzeForSeed(seed);
      results.push(result);
      console.log(`  Seed ${seed}: Total ${result.totalParity.toFixed(1)}%, Logic ${result.logicParity.toFixed(1)}%`);
    } catch (error) {
      console.error(`  Seed ${seed}: Error - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Generate and output report
  const report = generateReport(results);
  console.log('\n' + report);
  
  // Also save to file
  const fs = await import('fs');
  fs.writeFileSync('parity-difference-analysis.md', report);
  console.log('\nReport saved to: parity-difference-analysis.md');
  
  // Save detailed JSON
  const jsonReport = {
    timestamp: new Date().toISOString(),
    seeds,
    results: results.map(r => ({
      seed: r.seed,
      totalCommands: r.totalCommands,
      totalDifferences: r.totalDifferences,
      rngDifferences: r.rngDifferences,
      logicDifferences: r.logicDifferences,
      totalParity: r.totalParity,
      logicParity: r.logicParity,
      differences: r.differences
    }))
  };
  
  fs.writeFileSync('parity-difference-analysis.json', JSON.stringify(jsonReport, null, 2));
  console.log('Detailed JSON saved to: parity-difference-analysis.json');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
