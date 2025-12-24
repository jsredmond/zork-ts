#!/usr/bin/env npx tsx
/**
 * Enhanced Difference Analysis Tool
 * 
 * Analyzes specific differences in test sequences with advanced deep analysis
 * capabilities to identify root causes and generate surgical fix recommendations
 * for achieving perfect 100% parity.
 * 
 * Usage:
 *   npx tsx scripts/analyze-differences.ts [options] <sequence-file>
 * 
 * Options:
 *   --format <text|json|markdown>  Output format (default: text)
 *   --output <file>                Output file (default: stdout)
 *   --detailed                     Include detailed diff analysis
 *   --categorize                   Group differences by category
 *   --deep                         Enable deep analysis mode with state capture
 *   --surgical                     Generate surgical fix recommendations
 *   --risk-assessment              Include regression risk assessment
 *   --help                         Show help message
 * 
 * Requirements: 3.4, 3.5
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
  DeepAnalyzer, 
  DeepAnalysisResult, 
  FixRecommendation,
  RiskLevel 
} from '../src/testing/recording/deepAnalyzer.js';
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
  deep: boolean;
  surgical: boolean;
  riskAssessment: boolean;
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
  deepAnalysis?: DeepAnalysisResult;  // Enhanced deep analysis
  surgicalFixes?: SurgicalFix[];      // Surgical fix recommendations
  riskAssessment?: RiskAssessmentReport; // Regression risk analysis
}

interface SurgicalFix {
  differenceIndex: number;
  targetFile: string;
  targetFunction: string;
  changeType: 'message' | 'logic' | 'condition';
  originalCode: string;
  correctedCode: string;
  regressionRisk: RiskLevel;
  estimatedImprovement: number;
  confidence: number;
}

interface RiskAssessmentReport {
  overallRisk: RiskLevel;
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  testingRecommendations: string[];
}

interface RiskFactor {
  type: 'complexity' | 'dependencies' | 'core_system' | 'widespread_impact';
  description: string;
  impact: RiskLevel;
  affectedSystems: string[];
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
      deep: {
        type: 'boolean',
        default: false
      },
      surgical: {
        type: 'boolean',
        short: 's',
        default: false
      },
      'risk-assessment': {
        type: 'boolean',
        short: 'r',
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
    deep: values.deep as boolean,
    surgical: values.surgical as boolean,
    riskAssessment: values['risk-assessment'] as boolean,
    help: values.help as boolean,
    input: positionals[0]
  };
}

function showHelp(): void {
  console.log(`
Enhanced Difference Analysis Tool

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

  --deep                      Enable deep analysis mode with comprehensive
                              state capture and root cause analysis

  -s, --surgical              Generate surgical fix recommendations with
                              minimal regression risk

  -r, --risk-assessment       Include comprehensive regression risk assessment
                              and mitigation strategies

  -h, --help                  Show this help message

Examples:
  # Basic analysis of puzzle solutions sequence
  npx tsx scripts/analyze-differences.ts scripts/sequences/puzzle-solutions.txt

  # Deep analysis with surgical fix recommendations
  npx tsx scripts/analyze-differences.ts --deep --surgical scripts/sequences/puzzle-solutions.txt

  # Comprehensive analysis with risk assessment
  npx tsx scripts/analyze-differences.ts --deep --surgical --risk-assessment --format markdown scripts/sequences/puzzle-solutions.txt

  # Generate detailed report for all analysis modes
  npx tsx scripts/analyze-differences.ts --deep --surgical --risk-assessment --detailed --categorize --output analysis.md scripts/sequences/inventory-management.txt

Environment Variables:
  ZORK_INTERPRETER_PATH   Path to dfrotz/frotz executable
  ZORK_GAME_FILE_PATH     Path to zork1.z3 game file
`);
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyze differences in a sequence with enhanced deep analysis capabilities
 * Requirements: 3.4, 3.5
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

  // Perform basic analysis
  let analysis = analyzeDifferences(sequence.name, diffReport);

  // Perform deep analysis if requested
  if (options.deep) {
    console.error('Performing deep analysis...');
    const deepAnalyzer = new DeepAnalyzer();
    const deepAnalysis = await deepAnalyzer.analyzeReport(
      diffReport,
      tsTranscript,
      zmTranscript,
      sequence.id
    );
    analysis.deepAnalysis = deepAnalysis;
  }

  // Generate surgical fixes if requested
  if (options.surgical && analysis.deepAnalysis) {
    console.error('Generating surgical fix recommendations...');
    analysis.surgicalFixes = generateSurgicalFixes(analysis.deepAnalysis);
  }

  // Perform risk assessment if requested
  if (options.riskAssessment && analysis.deepAnalysis) {
    console.error('Performing risk assessment...');
    analysis.riskAssessment = performRiskAssessment(analysis.deepAnalysis);
  }

  return analysis;
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

/**
 * Generate surgical fix recommendations from deep analysis
 * Requirements: 3.4, 3.5
 */
function generateSurgicalFixes(deepAnalysis: DeepAnalysisResult): SurgicalFix[] {
  const surgicalFixes: SurgicalFix[] = [];

  for (const recommendation of deepAnalysis.fixRecommendations) {
    const difference = deepAnalysis.differences[recommendation.differenceIndex];
    const rootCause = deepAnalysis.rootCauseAnalysis[recommendation.differenceIndex];

    // Generate surgical fix based on the root cause and difference type
    const surgicalFix: SurgicalFix = {
      differenceIndex: recommendation.differenceIndex,
      targetFile: recommendation.targetFiles[0] || 'unknown',
      targetFunction: inferTargetFunction(difference, rootCause),
      changeType: inferChangeType(difference, rootCause),
      originalCode: generateOriginalCodeSnippet(difference, rootCause),
      correctedCode: generateCorrectedCodeSnippet(difference, rootCause),
      regressionRisk: recommendation.regressionRisk,
      estimatedImprovement: recommendation.estimatedImprovement,
      confidence: rootCause.confidence
    };

    surgicalFixes.push(surgicalFix);
  }

  return surgicalFixes;
}

/**
 * Infer the target function name from difference context
 */
function inferTargetFunction(difference: any, rootCause: any): string {
  const command = difference.command.toLowerCase();
  
  if (command.includes('take') || command.includes('get')) {
    return 'takeAction';
  }
  if (command.includes('drop')) {
    return 'dropAction';
  }
  if (command.includes('examine') || command.includes('x ')) {
    return 'examineAction';
  }
  if (command.includes('look')) {
    return 'lookAction';
  }
  if (command.includes('inventory')) {
    return 'inventoryAction';
  }
  if (['north', 'south', 'east', 'west', 'up', 'down', 'n', 's', 'e', 'w', 'u', 'd'].includes(command)) {
    return 'moveAction';
  }
  
  return 'handleCommand';
}

/**
 * Infer the type of change needed
 */
function inferChangeType(difference: any, rootCause: any): 'message' | 'logic' | 'condition' {
  if (difference.similarity > 0.9) {
    return 'message';
  }
  if (rootCause.primaryCause.issueType === 'CONDITIONAL_ERROR') {
    return 'condition';
  }
  return 'logic';
}

/**
 * Generate original code snippet (placeholder)
 */
function generateOriginalCodeSnippet(difference: any, rootCause: any): string {
  // This would analyze the actual codebase to find the relevant code
  // For now, return a placeholder
  return `// Original code in ${rootCause.primaryCause.component}\n// Command: ${difference.command}`;
}

/**
 * Generate corrected code snippet (placeholder)
 */
function generateCorrectedCodeSnippet(difference: any, rootCause: any): string {
  // This would generate the corrected code based on the Z-Machine behavior
  // For now, return a placeholder
  return `// Corrected code to match Z-Machine behavior\n// Expected: ${difference.expectedOutput.substring(0, 50)}...`;
}

/**
 * Perform comprehensive risk assessment
 * Requirements: 3.5
 */
function performRiskAssessment(deepAnalysis: DeepAnalysisResult): RiskAssessmentReport {
  const riskFactors: RiskFactor[] = [];
  
  // Analyze complexity risk
  const complexDifferences = deepAnalysis.differences.filter(d => d.affectedSystems.length > 3);
  if (complexDifferences.length > 0) {
    riskFactors.push({
      type: 'complexity',
      description: `${complexDifferences.length} differences involve multiple systems`,
      impact: RiskLevel.HIGH,
      affectedSystems: [...new Set(complexDifferences.flatMap(d => d.affectedSystems.map(s => s.toString())))]
    });
  }

  // Analyze core system risk
  const coreSystemDifferences = deepAnalysis.differences.filter(d => 
    d.affectedSystems.includes('parser' as any) || d.affectedSystems.includes('actions' as any)
  );
  if (coreSystemDifferences.length > 0) {
    riskFactors.push({
      type: 'core_system',
      description: `${coreSystemDifferences.length} differences affect core game systems`,
      impact: RiskLevel.MEDIUM,
      affectedSystems: ['parser', 'actions']
    });
  }

  // Analyze widespread impact risk
  const highImpactFixes = deepAnalysis.fixRecommendations.filter(r => r.estimatedImprovement > 2.0);
  if (highImpactFixes.length > 0) {
    riskFactors.push({
      type: 'widespread_impact',
      description: `${highImpactFixes.length} fixes have high estimated impact`,
      impact: RiskLevel.MEDIUM,
      affectedSystems: ['multiple']
    });
  }

  // Determine overall risk
  const overallRisk = calculateOverallRisk(riskFactors, deepAnalysis.riskAssessment);

  // Generate mitigation strategies
  const mitigationStrategies = generateMitigationStrategies(riskFactors);

  // Generate testing recommendations
  const testingRecommendations = generateTestingRecommendations(riskFactors, deepAnalysis);

  return {
    overallRisk,
    riskFactors,
    mitigationStrategies,
    testingRecommendations
  };
}

/**
 * Calculate overall risk level
 */
function calculateOverallRisk(riskFactors: RiskFactor[], baseRisk: RiskLevel): RiskLevel {
  const highRiskCount = riskFactors.filter(f => f.impact === RiskLevel.HIGH).length;
  const mediumRiskCount = riskFactors.filter(f => f.impact === RiskLevel.MEDIUM).length;

  if (highRiskCount > 2 || baseRisk === RiskLevel.CRITICAL) {
    return RiskLevel.CRITICAL;
  }
  if (highRiskCount > 0 || mediumRiskCount > 3) {
    return RiskLevel.HIGH;
  }
  if (mediumRiskCount > 0) {
    return RiskLevel.MEDIUM;
  }
  return RiskLevel.LOW;
}

/**
 * Generate mitigation strategies based on risk factors
 */
function generateMitigationStrategies(riskFactors: RiskFactor[]): string[] {
  const strategies: string[] = [];

  if (riskFactors.some(f => f.type === 'complexity')) {
    strategies.push('Implement fixes incrementally, one system at a time');
    strategies.push('Create comprehensive integration tests before making changes');
  }

  if (riskFactors.some(f => f.type === 'core_system')) {
    strategies.push('Implement feature flags for core system changes');
    strategies.push('Create rollback plan for parser and action modifications');
  }

  if (riskFactors.some(f => f.type === 'widespread_impact')) {
    strategies.push('Use A/B testing approach for high-impact changes');
    strategies.push('Implement changes in isolated branches with thorough testing');
  }

  // Default strategies
  strategies.push('Run full regression test suite after each fix');
  strategies.push('Monitor parity scores continuously during implementation');

  return strategies;
}

/**
 * Generate testing recommendations based on risk analysis
 */
function generateTestingRecommendations(riskFactors: RiskFactor[], deepAnalysis: DeepAnalysisResult): string[] {
  const recommendations: string[] = [];

  recommendations.push('Run complete parity test suite before and after each fix');
  recommendations.push('Test with multiple random seeds to ensure consistency');

  if (riskFactors.some(f => f.type === 'complexity')) {
    recommendations.push('Create specific integration tests for multi-system interactions');
  }

  if (riskFactors.some(f => f.type === 'core_system')) {
    recommendations.push('Add parser-specific regression tests');
    recommendations.push('Test all basic game actions after core system changes');
  }

  const criticalDifferences = deepAnalysis.differences.filter(d => d.severity === 'critical');
  if (criticalDifferences.length > 0) {
    recommendations.push(`Focus testing on ${criticalDifferences.length} critical differences first`);
  }

  recommendations.push('Validate sustained parity over multiple test runs');
  recommendations.push('Test edge cases and boundary conditions for modified systems');

  return recommendations;
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate analysis report in specified format with enhanced features
 * Requirements: 3.4, 3.5
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
    differencesBySeverity: Object.fromEntries(analysis.differencesBySeverity),
    // Include deep analysis if available
    deepAnalysis: analysis.deepAnalysis ? {
      ...analysis.deepAnalysis,
      differences: analysis.deepAnalysis.differences.map(d => ({
        ...d,
        gameState: {
          ...d.gameState,
          objectStates: Object.fromEntries(d.gameState.objectStates),
          roomStates: Object.fromEntries(d.gameState.roomStates),
          puzzleStates: Object.fromEntries(d.gameState.puzzleStates),
          daemonStates: Object.fromEntries(d.gameState.daemonStates),
          globalFlags: Object.fromEntries(d.gameState.globalFlags)
        }
      }))
    } : undefined
  };
  return JSON.stringify(result, null, 2);
}

function generateTextReport(analysis: DifferenceAnalysis, detailed: boolean, categorize: boolean): string {
  const lines: string[] = [];
  
  lines.push(`ENHANCED DIFFERENCE ANALYSIS: ${analysis.sequenceName}`);
  lines.push('='.repeat(60));
  lines.push('');
  
  lines.push(`Current Parity: ${analysis.currentParity.toFixed(2)}%`);
  lines.push(`Total Differences: ${analysis.totalDifferences}`);
  lines.push(`Estimated Max Parity: ${analysis.estimatedImpact.toFixed(2)}%`);
  lines.push(`Quick Wins Available: ${analysis.quickWins.length}`);
  
  // Add deep analysis summary if available
  if (analysis.deepAnalysis) {
    lines.push(`Deep Analysis Confidence: ${(analysis.deepAnalysis.metadata.completeness)}%`);
    lines.push(`Analysis Duration: ${analysis.deepAnalysis.metadata.duration}ms`);
  }
  
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

  // Add surgical fixes section
  if (analysis.surgicalFixes && analysis.surgicalFixes.length > 0) {
    lines.push('SURGICAL FIX RECOMMENDATIONS:');
    lines.push('-'.repeat(40));
    for (const fix of analysis.surgicalFixes.slice(0, 5)) { // Show top 5
      lines.push(`  Fix ${fix.differenceIndex}: ${fix.changeType} change in ${fix.targetFunction}`);
      lines.push(`    File: ${fix.targetFile}`);
      lines.push(`    Risk: ${fix.regressionRisk} | Confidence: ${(fix.confidence * 100).toFixed(0)}%`);
      lines.push(`    Improvement: +${fix.estimatedImprovement.toFixed(1)}%`);
      lines.push('');
    }
  }

  // Add risk assessment section
  if (analysis.riskAssessment) {
    lines.push('RISK ASSESSMENT:');
    lines.push('-'.repeat(20));
    lines.push(`Overall Risk: ${analysis.riskAssessment.overallRisk.toUpperCase()}`);
    lines.push('');
    
    if (analysis.riskAssessment.riskFactors.length > 0) {
      lines.push('Risk Factors:');
      for (const factor of analysis.riskAssessment.riskFactors) {
        lines.push(`  - ${factor.description} (${factor.impact})`);
      }
      lines.push('');
    }
    
    if (analysis.riskAssessment.mitigationStrategies.length > 0) {
      lines.push('Mitigation Strategies:');
      for (const strategy of analysis.riskAssessment.mitigationStrategies) {
        lines.push(`  - ${strategy}`);
      }
      lines.push('');
    }
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
  
  lines.push(`# Enhanced Difference Analysis: ${analysis.sequenceName}`);
  lines.push('');
  
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Current Parity:** ${analysis.currentParity.toFixed(2)}%`);
  lines.push(`- **Total Differences:** ${analysis.totalDifferences}`);
  lines.push(`- **Estimated Max Parity:** ${analysis.estimatedImpact.toFixed(2)}%`);
  lines.push(`- **Quick Wins Available:** ${analysis.quickWins.length}`);
  
  if (analysis.deepAnalysis) {
    lines.push(`- **Deep Analysis Confidence:** ${analysis.deepAnalysis.metadata.completeness}%`);
    lines.push(`- **Analysis Duration:** ${analysis.deepAnalysis.metadata.duration}ms`);
  }
  
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

  // Add surgical fixes section
  if (analysis.surgicalFixes && analysis.surgicalFixes.length > 0) {
    lines.push('## Surgical Fix Recommendations');
    lines.push('');
    lines.push('| Fix | Target | Type | Risk | Confidence | Improvement |');
    lines.push('|-----|--------|------|------|------------|-------------|');
    for (const fix of analysis.surgicalFixes.slice(0, 10)) {
      lines.push(`| ${fix.differenceIndex} | ${fix.targetFunction} | ${fix.changeType} | ${fix.regressionRisk} | ${(fix.confidence * 100).toFixed(0)}% | +${fix.estimatedImprovement.toFixed(1)}% |`);
    }
    lines.push('');
  }

  // Add risk assessment section
  if (analysis.riskAssessment) {
    lines.push('## Risk Assessment');
    lines.push('');
    lines.push(`**Overall Risk Level:** ${analysis.riskAssessment.overallRisk.toUpperCase()}`);
    lines.push('');
    
    if (analysis.riskAssessment.riskFactors.length > 0) {
      lines.push('### Risk Factors');
      lines.push('');
      for (const factor of analysis.riskAssessment.riskFactors) {
        lines.push(`- **${factor.type}:** ${factor.description} (Impact: ${factor.impact})`);
      }
      lines.push('');
    }
    
    if (analysis.riskAssessment.mitigationStrategies.length > 0) {
      lines.push('### Mitigation Strategies');
      lines.push('');
      for (const strategy of analysis.riskAssessment.mitigationStrategies) {
        lines.push(`- ${strategy}`);
      }
      lines.push('');
    }
    
    if (analysis.riskAssessment.testingRecommendations.length > 0) {
      lines.push('### Testing Recommendations');
      lines.push('');
      for (const recommendation of analysis.riskAssessment.testingRecommendations) {
        lines.push(`- ${recommendation}`);
      }
      lines.push('');
    }
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