/**
 * Vocabulary Audit Runner
 *
 * Executes the full vocabulary extraction and comparison pipeline:
 * 1. Extracts vocabulary from ZIL source files
 * 2. Extracts vocabulary from TypeScript implementation
 * 3. Extracts object definitions from objects-complete.ts
 * 4. Compares vocabularies and cross-references objects
 * 5. Generates and outputs discrepancy report
 * 6. Saves report to file
 *
 * Run with: npx tsx src/testing/vocabulary/run-audit.ts
 *
 * Requirements: 1.5, 2.5, 2.6, 4.4
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  extractZilVocabulary,
  ZilVocabulary,
  DEFAULT_ZIL_FILES,
  DEFAULT_ZIL_PATH,
} from './zil-extractor';
import {
  extractTsVocabulary,
  extractObjectDefinitions,
  TsVocabulary,
  TsObjectDef,
  DEFAULT_VOCABULARY_PATH,
  DEFAULT_OBJECTS_PATH,
} from './ts-extractor';
import {
  compareVocabularies,
  crossReferenceObjects,
  ComparisonReport,
  createEmptyComparisonReport,
} from './comparator';
import {
  generateReport,
  formatReportAsText,
  FullReport,
} from './report-generator';

/**
 * Result of the vocabulary extraction audit.
 */
export interface AuditExtractionResult {
  zilVocabulary: ZilVocabulary;
  tsVocabulary: TsVocabulary;
  objectDefinitions: TsObjectDef[];
  timestamp: string;
}

/**
 * Full audit result including extraction and comparison.
 */
export interface AuditResult {
  extraction: AuditExtractionResult;
  comparisonReport: ComparisonReport;
  fullReport: FullReport;
  reportText: string;
}

/**
 * Summary statistics for the extraction.
 */
export interface ExtractionSummary {
  zil: {
    nouns: number;
    adjectives: number;
    verbs: number;
    prepositions: number;
    buzzWords: number;
    directions: number;
    total: number;
  };
  ts: {
    nouns: number;
    adjectives: number;
    verbs: number;
    prepositions: number;
    directions: number;
    articles: number;
    pronouns: number;
    conjunctions: number;
    total: number;
  };
  objects: {
    count: number;
    totalSynonyms: number;
    totalAdjectives: number;
  };
}

/**
 * Calculates summary statistics from extracted vocabularies.
 *
 * @param zilVocab - The extracted ZIL vocabulary
 * @param tsVocab - The extracted TypeScript vocabulary
 * @param objects - The extracted object definitions
 * @returns Summary statistics
 */
export function calculateSummary(
  zilVocab: ZilVocabulary,
  tsVocab: TsVocabulary,
  objects: TsObjectDef[]
): ExtractionSummary {
  // Count ZIL words
  const zilNouns = zilVocab.nouns.size;
  const zilAdjectives = zilVocab.adjectives.size;
  const zilVerbs = zilVocab.verbs.size;
  const zilPrepositions = zilVocab.prepositions.size;
  const zilBuzzWords = zilVocab.buzzWords.size;
  const zilDirections = zilVocab.directions.size;
  const zilTotal = zilNouns + zilAdjectives + zilVerbs + zilPrepositions + zilBuzzWords + zilDirections;

  // Count TypeScript words
  const tsNouns = tsVocab.nouns.size;
  const tsAdjectives = tsVocab.adjectives.size;
  const tsVerbs = tsVocab.verbs.size;
  const tsPrepositions = tsVocab.prepositions.size;
  const tsDirections = tsVocab.directions.size;
  const tsArticles = tsVocab.articles.size;
  const tsPronouns = tsVocab.pronouns.size;
  const tsConjunctions = tsVocab.conjunctions.size;
  const tsTotal =
    tsNouns + tsAdjectives + tsVerbs + tsPrepositions + tsDirections + tsArticles + tsPronouns + tsConjunctions;

  // Count object statistics
  let totalSynonyms = 0;
  let totalAdjectives = 0;
  for (const obj of objects) {
    totalSynonyms += obj.synonyms.length;
    totalAdjectives += obj.adjectives.length;
  }

  return {
    zil: {
      nouns: zilNouns,
      adjectives: zilAdjectives,
      verbs: zilVerbs,
      prepositions: zilPrepositions,
      buzzWords: zilBuzzWords,
      directions: zilDirections,
      total: zilTotal,
    },
    ts: {
      nouns: tsNouns,
      adjectives: tsAdjectives,
      verbs: tsVerbs,
      prepositions: tsPrepositions,
      directions: tsDirections,
      articles: tsArticles,
      pronouns: tsPronouns,
      conjunctions: tsConjunctions,
      total: tsTotal,
    },
    objects: {
      count: objects.length,
      totalSynonyms,
      totalAdjectives,
    },
  };
}

/**
 * Formats the summary statistics for console output.
 *
 * @param summary - The extraction summary
 * @returns Formatted string for display
 */
export function formatSummary(summary: ExtractionSummary): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('='.repeat(60));
  lines.push('VOCABULARY EXTRACTION SUMMARY');
  lines.push('='.repeat(60));
  lines.push('');

  // ZIL Statistics
  lines.push('ZIL Source Vocabulary:');
  lines.push('-'.repeat(40));
  lines.push(`  Nouns:        ${summary.zil.nouns.toString().padStart(5)}`);
  lines.push(`  Adjectives:   ${summary.zil.adjectives.toString().padStart(5)}`);
  lines.push(`  Verbs:        ${summary.zil.verbs.toString().padStart(5)}`);
  lines.push(`  Prepositions: ${summary.zil.prepositions.toString().padStart(5)}`);
  lines.push(`  Buzz Words:   ${summary.zil.buzzWords.toString().padStart(5)}`);
  lines.push(`  Directions:   ${summary.zil.directions.toString().padStart(5)}`);
  lines.push(`  ${'─'.repeat(20)}`);
  lines.push(`  Total:        ${summary.zil.total.toString().padStart(5)}`);
  lines.push('');

  // TypeScript Statistics
  lines.push('TypeScript Vocabulary:');
  lines.push('-'.repeat(40));
  lines.push(`  Nouns:        ${summary.ts.nouns.toString().padStart(5)}`);
  lines.push(`  Adjectives:   ${summary.ts.adjectives.toString().padStart(5)}`);
  lines.push(`  Verbs:        ${summary.ts.verbs.toString().padStart(5)}`);
  lines.push(`  Prepositions: ${summary.ts.prepositions.toString().padStart(5)}`);
  lines.push(`  Directions:   ${summary.ts.directions.toString().padStart(5)}`);
  lines.push(`  Articles:     ${summary.ts.articles.toString().padStart(5)}`);
  lines.push(`  Pronouns:     ${summary.ts.pronouns.toString().padStart(5)}`);
  lines.push(`  Conjunctions: ${summary.ts.conjunctions.toString().padStart(5)}`);
  lines.push(`  ${'─'.repeat(20)}`);
  lines.push(`  Total:        ${summary.ts.total.toString().padStart(5)}`);
  lines.push('');

  // Object Statistics
  lines.push('Object Definitions:');
  lines.push('-'.repeat(40));
  lines.push(`  Objects:      ${summary.objects.count.toString().padStart(5)}`);
  lines.push(`  Synonyms:     ${summary.objects.totalSynonyms.toString().padStart(5)}`);
  lines.push(`  Adjectives:   ${summary.objects.totalAdjectives.toString().padStart(5)}`);
  lines.push('');

  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Runs the full vocabulary extraction audit.
 *
 * Executes:
 * 1. ZIL vocabulary extraction from reference/zil/ files
 * 2. TypeScript vocabulary extraction from vocabulary.ts
 * 3. Object definition extraction from objects-complete.ts
 *
 * @returns AuditExtractionResult with all extracted data
 *
 * Requirements: 1.5, 2.5, 2.6
 */
export function runExtraction(): AuditExtractionResult {
  console.log('Starting vocabulary extraction audit...');
  console.log('');

  // Step 1: Extract ZIL vocabulary
  console.log(`Extracting ZIL vocabulary from ${DEFAULT_ZIL_PATH}/`);
  console.log(`  Files: ${DEFAULT_ZIL_FILES.join(', ')}`);
  const zilVocabulary = extractZilVocabulary();

  // Step 2: Extract TypeScript vocabulary
  console.log(`Extracting TypeScript vocabulary from ${DEFAULT_VOCABULARY_PATH}`);
  const tsVocabulary = extractTsVocabulary();

  // Step 3: Extract object definitions
  console.log(`Extracting object definitions from ${DEFAULT_OBJECTS_PATH}`);
  const objectDefinitions = extractObjectDefinitions();

  return {
    zilVocabulary,
    tsVocabulary,
    objectDefinitions,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Merges two ComparisonReports into one.
 *
 * @param report1 - First comparison report
 * @param report2 - Second comparison report
 * @returns Merged comparison report
 */
export function mergeComparisonReports(
  report1: ComparisonReport,
  report2: ComparisonReport
): ComparisonReport {
  return {
    missingInTs: [...report1.missingInTs, ...report2.missingInTs],
    extraInTs: [...report1.extraInTs, ...report2.extraInTs],
    objectSynonymsMissing: [...report1.objectSynonymsMissing, ...report2.objectSynonymsMissing],
    objectAdjectivesMissing: [...report1.objectAdjectivesMissing, ...report2.objectAdjectivesMissing],
  };
}

/**
 * Default path for the audit report output file.
 */
export const DEFAULT_REPORT_PATH = 'src/testing/vocabulary/audit-report.txt';

/**
 * Runs the full vocabulary comparison and generates a discrepancy report.
 *
 * Executes:
 * 1. Compares ZIL and TypeScript vocabularies
 * 2. Cross-references object definitions against vocabulary
 * 3. Merges comparison results
 * 4. Generates full report
 *
 * @param extraction - The extraction result from runExtraction()
 * @returns Object containing comparison report, full report, and formatted text
 *
 * Requirements: 4.4
 */
export function runComparison(extraction: AuditExtractionResult): {
  comparisonReport: ComparisonReport;
  fullReport: FullReport;
  reportText: string;
} {
  console.log('');
  console.log('Running vocabulary comparison...');

  // Step 1: Compare ZIL and TypeScript vocabularies
  console.log('  Comparing ZIL and TypeScript vocabularies...');
  const vocabComparison = compareVocabularies(
    extraction.zilVocabulary,
    extraction.tsVocabulary
  );

  // Step 2: Cross-reference object definitions against vocabulary
  console.log('  Cross-referencing object definitions against vocabulary...');
  const objectComparison = crossReferenceObjects(
    extraction.objectDefinitions,
    extraction.tsVocabulary
  );

  // Step 3: Merge comparison results
  console.log('  Merging comparison results...');
  const mergedReport = mergeComparisonReports(vocabComparison, objectComparison);

  // Step 4: Generate full report
  console.log('  Generating full report...');
  const fullReport = generateReport(
    mergedReport,
    extraction.zilVocabulary,
    extraction.tsVocabulary
  );

  // Step 5: Format report as text
  const reportText = formatReportAsText(fullReport);

  return {
    comparisonReport: mergedReport,
    fullReport,
    reportText,
  };
}

/**
 * Saves the audit report to a file.
 *
 * @param reportText - The formatted report text
 * @param outputPath - Path to save the report (default: DEFAULT_REPORT_PATH)
 *
 * Requirements: 4.4
 */
export function saveReport(
  reportText: string,
  outputPath: string = DEFAULT_REPORT_PATH
): void {
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write report to file
  fs.writeFileSync(outputPath, reportText, 'utf-8');
  console.log(`Report saved to: ${outputPath}`);
}

/**
 * Runs the full vocabulary audit: extraction, comparison, and report generation.
 *
 * @param outputPath - Optional path to save the report
 * @returns Full audit result
 *
 * Requirements: 1.5, 2.5, 2.6, 4.4
 */
export function runFullAudit(outputPath: string = DEFAULT_REPORT_PATH): AuditResult {
  // Run extraction
  const extraction = runExtraction();

  // Calculate and display extraction summary
  const summary = calculateSummary(
    extraction.zilVocabulary,
    extraction.tsVocabulary,
    extraction.objectDefinitions
  );
  console.log(formatSummary(summary));

  // Run comparison and generate report
  const { comparisonReport, fullReport, reportText } = runComparison(extraction);

  // Output the report to console
  console.log('');
  console.log(reportText);

  // Save report to file
  saveReport(reportText, outputPath);

  return {
    extraction,
    comparisonReport,
    fullReport,
    reportText,
  };
}

/**
 * Main entry point for the vocabulary audit script.
 *
 * Runs the full audit: extraction, comparison, and report generation.
 * Outputs the discrepancy report to console and saves to file.
 *
 * Requirements: 1.5, 2.5, 2.6, 4.4
 */
export function main(): AuditResult {
  const result = runFullAudit();

  console.log('');
  console.log('Audit complete.');
  console.log(`Timestamp: ${result.extraction.timestamp}`);

  return result;
}

// Run if executed directly
// Using import.meta.url for ES module compatibility
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
