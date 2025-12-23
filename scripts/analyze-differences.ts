#!/usr/bin/env npx tsx
/**
 * Difference Analysis Tool
 * 
 * Analyzes specific differences in worst-performing test sequences to identify
 * highest-impact fixes for achieving 90%+ parity.
 * 
 * Usage:
 *   npx tsx scripts/analyze-differences.ts [options] <sequence-file>
 * 
 * Options:
 *   --format <text|json|markdown>  Output format (default: text)
 *   --output <file>                Output file (default: stdout)
 *   --detailed                     Include detailed diff analysis
 *   --categorize                   Group differences by category
 *   --help                         Show help message
 * 
 * Requirements: 1.1, 2.4
 */

import { parseArgs } from 'util';
import { existsSync, writeFileSync } from 'fs';
import { resolve, basename } from 'path';

import { TypeScriptRecorder } from '../src/testing/recording/tsRecorder.js';
import { ZMachineRecorder } from '../src/testing/recording/zmRecorder.js';
import { TranscriptComparator } from '../src/testing/recording/comparator.js';
import { CommandSequenceLoader } from '../src/testing/recording/sequenceLoader.js';
import { loadZMachineConfig, validateConfig } from '../src/testing/recording/config.js';
import { 
  CommandSequence,
  Transcript,
  ComparisonOptions,
  DiffEntry,
  DiffReport,
  DiffSeverity,
  RecordingOptions
} from '../src/testing/recording/types.js';

// ============================================================================
// Types
// ============================================================================

interface AnalysisOptions {
  format: 'text' | 'json' | 'markdown';
  output?: string;
  detailed: boolean;
  categorize: boolean;
  help: boolean;
  input?: string;
}

interface SpecificIssue {
  commandIndex: number;
  command: string;
  category: string;
  expected: string;
  actual: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  suggestedFix?: string;
}

interface DifferenceAnalysis {
  sequenceName: string;
  currentParity: number;
  totalDifferences: number;
  differencesByCategory: Map<string, number>;
  differencesBySeverity: Map<string, number>;
  specificIssues: SpecificIssue[];
  quickWins: SpecificIssue[];  // Easy fixes with high impact
  estimatedImpact: number;     // Estimated parity improvement
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArguments(): AnalysisOptions {
  const { values, positionals } = parseArgs({
    options: {
      format: {
        type: 'string',
        short: 'f',
        default: 'text'
      },
      output: {
        type: 'string',
        short: 'o'
      },
      detailed: {
        type: 'boolean',
        short: 'd',
        default: false
      },
      categorize: {
        type: 'boolean',
        short: 'c',
        default: false
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false
      }
    },
    allowPositionals: true
  });

  // Validate format
  const format = values.format as string;
  if (!['text', 'json', 'markdown'].includes(format)) {
    console.error(`Invalid format: ${format}. Must be 'text', 'json', or 'markdown'.`);
    process.exit(1);
  }

  return {
    format: format as 'text' | 'json' | 'markdown',
    output: values.output as string | undefined,
    detailed: values.detailed as boolean,
    categorize: values.categorize as boolean,
    help: values.help as boolean,
    input: positionals[0]
  };
}

function showHelp(): void {
  console.log(`
Difference Analysis Tool

Usage:
  npx tsx scripts/analyze-differences.ts [options] <sequence-file>

Options:
  -f, --format <format>       Output format (default: text)
                              text     - Plain text analysis
                              json     - JSON format
                              markdown - Markdown format

  -o, --output <file>         Output file (default: stdout)

  -d, --detailed              Include detailed diff analysis with full text

  -c, --categorize            Group differences by category and severity

  -h, --help                  Show this help message

Examples:
  # Analyze puzzle solutions sequence
  npx tsx scripts/analyze-differences.ts scripts/sequences/puzzle-solutions.txt

  # Generate detailed markdown report
  npx tsx scripts/analyze-differences.ts --format markdown --detailed --output analysis.md scripts/sequences/puzzle-solutions.txt

  # Categorize differences by type
  npx tsx scripts/analyze-differences.ts --categorize scripts/sequences/inventory-management.txt

Environment Variables:
  ZORK_INTERPRETER_PATH   Path to dfrotz/frotz executable
  ZORK_GAME_FILE_PATH     Path to zork1.z3 game file
`);
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyze differences in a sequence and provide detailed breakdown
 */
async function analyzeSequence(
  sequence: CommandSequence,
  options: AnalysisOptions
): Promise<DifferenceAnalysis> {
  // Record both versions
  const recordingOptions: RecordingOptions = {
    captureTimestamps: true,
    preserveFormatting: false,
    suppressRandomMessages: true
  };

  console.error(`Recording TypeScript: ${sequence.name}...`);
  const tsRecorder = new TypeScriptRecorder();
  const tsTranscript = await tsRecorder.record(sequence.commands, recordingOptions);

  console.error(`Recording Z-Machine: ${sequence.name}...`);
  const config = await loadZMachineConfig();
  const validation = validateConfig(config);
  
  if (!validation.valid) {
    throw new Error(`Z-Machine configuration invalid:\n${validation.errors.join('\n')}`);
  }

  const zmRecorder = new ZMachineRecorder(config);
  if (!await zmRecorder.isAvailable()) {
    throw new Error('Z-Machine interpreter not available');
  }

  const zmTranscript = await zmRecorder.record(sequence.commands, recordingOptions);

  // Compare with enhanced normalization
  console.error('Comparing transcripts...');
  const comparisonOptions: ComparisonOptions = {
    stripStatusBar: true,
    normalizeLineWrapping: true,
    normalizeWhitespace: true,
    stripGameHeader: true
  };
  
  const comparator = new TranscriptComparator(comparisonOptions);
  const diffReport = comparator.compare(zmTranscript, tsTranscript);

  // Analyze the differences
  return analyzeDifferences(sequence.name, diffReport);
}

/**
 * Analyze a diff report to extract insights
 */
function analyzeDifferences(sequenceName: string, diffReport: DiffReport): DifferenceAnalysis {
  const differencesByCategory = new Map<string, number>();
  const differencesBySeverity = new Map<string, number>();
  const specificIssues: SpecificIssue[] = [];
  const quickWins: SpecificIssue[] = [];

  // Process each difference
  for (const diff of diffReport.differences) {
    // Count by category
    const categoryCount = differencesByCategory.get(diff.category) || 0;
    differencesByCategory.set(diff.category, categoryCount + 1);

    // Count by severity
    const severityCount = differencesBySeverity.get(diff.severity) || 0;
    differencesBySeverity.set(diff.severity, severityCount + 1);

    // Create specific issue
    const issue: SpecificIssue = {
      commandIndex: diff.index,
      command: diff.command,
      category: diff.category,
      expected: diff.expected,
      actual: diff.actual,
      severity: mapSeverity(diff.severity),
      suggestedFix: generateSuggestedFix(diff)
    };

    specificIssues.push(issue);

    // Identify quick wins (high similarity, easy to fix)
    if (diff.similarity > 0.8 && diff.severity !== 'critical') {
      quickWins.push(issue);
    }
  }

  // Estimate impact of fixing all differences
  const estimatedImpact = estimateParityImprovement(diffReport);

  return {
    sequenceName,
    currentParity: diffReport.parityScore,
    totalDifferences: diffReport.differences.length,
    differencesByCategory,
    differencesBySeverity,
    specificIssues,
    quickWins,
    estimatedImpact
  };
}

/**
 * Map DiffSeverity to analysis severity
 */
function mapSeverity(severity: DiffSeverity): 'CRITICAL' | 'MAJOR' | 'MINOR' {
  switch (severity) {
    case 'critical':
      return 'CRITICAL';
    case 'major':
      return 'MAJOR';
    case 'minor':
    case 'formatting':
      return 'MINOR';
  }
}

/**
 * Generate suggested fix for a difference
 */
function generateSuggestedFix(diff: DiffEntry): string {
  const category = diff.category;
  const command = diff.command.toLowerCase();

  if (category === 'object examination') {
    return `Update object description or examine handler for "${diff.command}"`;
  }
  
  if (category === 'object manipulation') {
    if (command.startsWith('take') || command.startsWith('get')) {
      return `Fix take action message consistency in src/game/actions.ts`;
    }
    if (command.startsWith('drop')) {
      return `Fix drop action message consistency in src/game/actions.ts`;
    }
  }
  
  if (category === 'navigation') {
    return `Fix navigation error messages in src/game/verbHandlers.ts`;
  }
  
  if (category === 'room description') {
    return `Update room description in src/game/data/rooms.ts`;
  }
  
  if (category === 'inventory') {
    return `Fix inventory display formatting in src/game/actions.ts`;
  }
  
  if (category === 'container interaction') {
    return `Fix container interaction messages in src/game/actions.ts`;
  }
  
  if (category === 'combat') {
    return `Fix combat messages in src/engine/combat.ts`;
  }

  // Generic suggestion based on similarity
  if (diff.similarity > 0.9) {
    return `Minor text formatting fix needed`;
  } else if (diff.similarity > 0.7) {
    return `Message content needs adjustment`;
  } else {
    return `Major logic or content difference - investigate thoroughly`;
  }
}

/**
 * Estimate parity improvement if all differences were fixed
 */
function estimateParityImprovement(diffReport: DiffReport): number {
  // If all differences were fixed, we'd have 100% parity
  // But some differences might be harder to fix than others
  const criticalDiffs = diffReport.differences.filter(d => d.severity === 'critical').length;
  const majorDiffs = diffReport.differences.filter(d => d.severity === 'major').length;
  const minorDiffs = diffReport.differences.filter(d => d.severity === 'minor').length;
  
  // Assume we can fix 90% of minor, 70% of major, 50% of critical
  const fixableCount = (minorDiffs * 0.9) + (majorDiffs * 0.7) + (criticalDiffs * 0.5);
  const potentialMatches = diffReport.exactMatches + diffReport.closeMatches + fixableCount;
  
  return Math.min(100, (potentialMatches / diffReport.totalCommands) * 100);
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate analysis report in specified format
 */
function generateReport(analysis: DifferenceAnalysis, format: 'text' | 'json' | 'markdown', detailed: boolean, categorize: boolean): string {
  switch (format) {
    case 'json':
      return generateJsonReport(analysis);
    case 'markdown':
      return generateMarkdownReport(analysis, detailed, categorize);
    case 'text':
    default:
      return generateTextReport(analysis, detailed, categorize);
  }
}

function generateJsonReport(analysis: DifferenceAnalysis): string {
  // Convert Maps to objects for JSON serialization
  const result = {
    ...analysis,
    differencesByCategory: Object.fromEntries(analysis.differencesByCategory),
    differencesBySeverity: Object.fromEntries(analysis.differencesBySeverity)
  };
  return JSON.stringify(result, null, 2);
}

function generateTextReport(analysis: DifferenceAnalysis, detailed: boolean, categorize: boolean): string {
  const lines: string[] = [];
  
  lines.push(`DIFFERENCE ANALYSIS: ${analysis.sequenceName}`);
  lines.push('='.repeat(50));
  lines.push('');
  
  lines.push(`Current Parity: ${analysis.currentParity.toFixed(2)}%`);
  lines.push(`Total Differences: ${analysis.totalDifferences}`);
  lines.push(`Estimated Max Parity: ${analysis.estimatedImpact.toFixed(2)}%`);
  lines.push(`Quick Wins Available: ${analysis.quickWins.length}`);
  lines.push('');

  if (categorize) {
    lines.push('DIFFERENCES BY CATEGORY:');
    lines.push('-'.repeat(30));
    for (const [category, count] of analysis.differencesByCategory.entries()) {
      lines.push(`  ${category}: ${count}`);
    }
    lines.push('');

    lines.push('DIFFERENCES BY SEVERITY:');
    lines.push('-'.repeat(30));
    for (const [severity, count] of analysis.differencesBySeverity.entries()) {
      lines.push(`  ${severity}: ${count}`);
    }
    lines.push('');
  }

  if (analysis.quickWins.length > 0) {
    lines.push('QUICK WINS (High Impact, Easy Fixes):');
    lines.push('-'.repeat(40));
    for (const issue of analysis.quickWins) {
      lines.push(`  Command ${issue.commandIndex}: ${issue.command}`);
      lines.push(`    Category: ${issue.category}`);
      lines.push(`    Fix: ${issue.suggestedFix}`);
      lines.push('');
    }
  }

  if (detailed) {
    lines.push('DETAILED DIFFERENCES:');
    lines.push('-'.repeat(30));
    for (const issue of analysis.specificIssues) {
      lines.push(`Command ${issue.commandIndex}: ${issue.command}`);
      lines.push(`  Category: ${issue.category} | Severity: ${issue.severity}`);
      lines.push(`  Suggested Fix: ${issue.suggestedFix}`);
      lines.push(`  Expected: ${issue.expected.substring(0, 100)}${issue.expected.length > 100 ? '...' : ''}`);
      lines.push(`  Actual:   ${issue.actual.substring(0, 100)}${issue.actual.length > 100 ? '...' : ''}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function generateMarkdownReport(analysis: DifferenceAnalysis, detailed: boolean, categorize: boolean): string {
  const lines: string[] = [];
  
  lines.push(`# Difference Analysis: ${analysis.sequenceName}`);
  lines.push('');
  
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Current Parity:** ${analysis.currentParity.toFixed(2)}%`);
  lines.push(`- **Total Differences:** ${analysis.totalDifferences}`);
  lines.push(`- **Estimated Max Parity:** ${analysis.estimatedImpact.toFixed(2)}%`);
  lines.push(`- **Quick Wins Available:** ${analysis.quickWins.length}`);
  lines.push('');

  if (categorize) {
    lines.push('## Differences by Category');
    lines.push('');
    lines.push('| Category | Count |');
    lines.push('|----------|-------|');
    for (const [category, count] of analysis.differencesByCategory.entries()) {
      lines.push(`| ${category} | ${count} |`);
    }
    lines.push('');

    lines.push('## Differences by Severity');
    lines.push('');
    lines.push('| Severity | Count |');
    lines.push('|----------|-------|');
    for (const [severity, count] of analysis.differencesBySeverity.entries()) {
      lines.push(`| ${severity} | ${count} |`);
    }
    lines.push('');
  }

  if (analysis.quickWins.length > 0) {
    lines.push('## Quick Wins (High Impact, Easy Fixes)');
    lines.push('');
    for (const issue of analysis.quickWins) {
      lines.push(`### Command ${issue.commandIndex}: \`${issue.command}\``);
      lines.push('');
      lines.push(`- **Category:** ${issue.category}`);
      lines.push(`- **Suggested Fix:** ${issue.suggestedFix}`);
      lines.push('');
    }
  }

  if (detailed) {
    lines.push('## Detailed Differences');
    lines.push('');
    for (const issue of analysis.specificIssues) {
      lines.push(`### Command ${issue.commandIndex}: \`${issue.command}\``);
      lines.push('');
      lines.push(`- **Category:** ${issue.category}`);
      lines.push(`- **Severity:** ${issue.severity}`);
      lines.push(`- **Suggested Fix:** ${issue.suggestedFix}`);
      lines.push('');
      lines.push('**Expected:**');
      lines.push('```');
      lines.push(issue.expected);
      lines.push('```');
      lines.push('');
      lines.push('**Actual:**');
      lines.push('```');
      lines.push(issue.actual);
      lines.push('```');
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  const options = parseArguments();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (!options.input) {
    console.error('Error: No sequence file specified.');
    console.error('Use --help for usage information.');
    process.exit(1);
  }

  const inputPath = resolve(options.input);
  
  if (!existsSync(inputPath)) {
    console.error(`Error: Sequence file not found: ${inputPath}`);
    process.exit(1);
  }

  try {
    const loader = new CommandSequenceLoader();
    const sequence = loader.load(inputPath);

    console.error(`Analyzing sequence: ${sequence.name}`);
    const analysis = await analyzeSequence(sequence, options);

    const report = generateReport(analysis, options.format, options.detailed, options.categorize);

    // Output result
    if (options.output) {
      writeFileSync(options.output, report);
      console.error(`Analysis written to: ${options.output}`);
    } else {
      console.log(report);
    }

  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run main
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});