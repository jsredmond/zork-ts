/**
 * Report Generator for Vocabulary Comparison
 *
 * Generates human-readable and machine-readable reports from vocabulary
 * comparison results. Provides summary statistics and detailed discrepancy lists.
 *
 * Requirements: 4.4
 */

import {
  ComparisonReport,
  VocabularyDiscrepancy,
  ObjectVocabularyIssue,
  filterByCategory,
  getWords,
} from './comparator';
import { ZilVocabulary } from './zil-extractor';
import { TsVocabulary } from './ts-extractor';

/**
 * Full report structure with summary statistics and categorized discrepancies.
 */
export interface FullReport {
  summary: {
    totalZilWords: number;
    totalTsWords: number;
    missingCount: number;
    extraCount: number;
  };
  missing: {
    nouns: string[];
    adjectives: string[];
    verbs: string[];
    prepositions: string[];
  };
  extra: {
    nouns: string[];
    adjectives: string[];
    verbs: string[];
    prepositions: string[];
  };
  objectIssues: Array<{
    objectId: string;
    missingSynonyms: string[];
    missingAdjectives: string[];
  }>;
}

/**
 * Counts total words in a ZIL vocabulary.
 *
 * @param vocab - The ZIL vocabulary
 * @returns Total count of words across all categories
 */
export function countZilWords(vocab: ZilVocabulary): number {
  return (
    vocab.nouns.size +
    vocab.adjectives.size +
    vocab.verbs.size +
    vocab.prepositions.size
  );
}

/**
 * Counts total words in a TypeScript vocabulary.
 *
 * @param vocab - The TypeScript vocabulary
 * @returns Total count of words across all categories
 */
export function countTsWords(vocab: TsVocabulary): number {
  return (
    vocab.nouns.size +
    vocab.adjectives.size +
    vocab.verbs.size +
    vocab.prepositions.size
  );
}

/**
 * Groups object vocabulary issues by object ID.
 *
 * Takes flat arrays of ObjectVocabularyIssue and groups them by objectId,
 * combining missing synonyms and adjectives for each object.
 *
 * @param synonymsMissing - Array of missing synonym issues
 * @param adjectivesMissing - Array of missing adjective issues
 * @returns Array of grouped object issues
 */
export function groupObjectIssues(
  synonymsMissing: ObjectVocabularyIssue[],
  adjectivesMissing: ObjectVocabularyIssue[]
): Array<{ objectId: string; missingSynonyms: string[]; missingAdjectives: string[] }> {
  // Collect all unique object IDs
  const objectIds = new Set<string>();
  for (const issue of synonymsMissing) {
    objectIds.add(issue.objectId);
  }
  for (const issue of adjectivesMissing) {
    objectIds.add(issue.objectId);
  }

  // Group issues by object ID
  const result: Array<{ objectId: string; missingSynonyms: string[]; missingAdjectives: string[] }> = [];

  for (const objectId of Array.from(objectIds).sort()) {
    const missingSynonyms = synonymsMissing
      .filter((issue) => issue.objectId === objectId)
      .map((issue) => issue.word)
      .sort();

    const missingAdjectives = adjectivesMissing
      .filter((issue) => issue.objectId === objectId)
      .map((issue) => issue.word)
      .sort();

    result.push({
      objectId,
      missingSynonyms,
      missingAdjectives,
    });
  }

  return result;
}

/**
 * Generates a FullReport from a ComparisonReport and vocabulary statistics.
 *
 * Creates a comprehensive report with:
 * - Summary statistics (total words, missing count, extra count)
 * - Missing words grouped by category
 * - Extra words grouped by category
 * - Object issues grouped by object ID
 *
 * @param comparisonReport - The comparison report from compareVocabularies/crossReferenceObjects
 * @param zilVocab - The ZIL vocabulary (for word counts)
 * @param tsVocab - The TypeScript vocabulary (for word counts)
 * @returns A FullReport with all discrepancies categorized
 *
 * Requirements: 4.4
 */
export function generateReport(
  comparisonReport: ComparisonReport,
  zilVocab: ZilVocabulary,
  tsVocab: TsVocabulary
): FullReport {
  // Extract missing words by category
  const missingNouns = getWords(filterByCategory(comparisonReport.missingInTs, 'noun'));
  const missingAdjectives = getWords(filterByCategory(comparisonReport.missingInTs, 'adjective'));
  const missingVerbs = getWords(filterByCategory(comparisonReport.missingInTs, 'verb'));
  const missingPrepositions = getWords(filterByCategory(comparisonReport.missingInTs, 'preposition'));

  // Extract extra words by category
  const extraNouns = getWords(filterByCategory(comparisonReport.extraInTs, 'noun'));
  const extraAdjectives = getWords(filterByCategory(comparisonReport.extraInTs, 'adjective'));
  const extraVerbs = getWords(filterByCategory(comparisonReport.extraInTs, 'verb'));
  const extraPrepositions = getWords(filterByCategory(comparisonReport.extraInTs, 'preposition'));

  // Group object issues by object ID
  const objectIssues = groupObjectIssues(
    comparisonReport.objectSynonymsMissing,
    comparisonReport.objectAdjectivesMissing
  );

  return {
    summary: {
      totalZilWords: countZilWords(zilVocab),
      totalTsWords: countTsWords(tsVocab),
      missingCount: comparisonReport.missingInTs.length,
      extraCount: comparisonReport.extraInTs.length,
    },
    missing: {
      nouns: missingNouns,
      adjectives: missingAdjectives,
      verbs: missingVerbs,
      prepositions: missingPrepositions,
    },
    extra: {
      nouns: extraNouns,
      adjectives: extraAdjectives,
      verbs: extraVerbs,
      prepositions: extraPrepositions,
    },
    objectIssues,
  };
}

/**
 * Formats a FullReport as human-readable text.
 *
 * Produces a formatted text report with:
 * - Summary section with statistics
 * - Missing words section grouped by category
 * - Extra words section grouped by category
 * - Object issues section with specific missing synonyms/adjectives
 *
 * @param report - The FullReport to format
 * @returns Human-readable text representation of the report
 *
 * Requirements: 4.4
 */
export function formatReportAsText(report: FullReport): string {
  const lines: string[] = [];

  // Header
  lines.push('='.repeat(60));
  lines.push('VOCABULARY COMPARISON REPORT');
  lines.push('='.repeat(60));
  lines.push('');

  // Summary section
  lines.push('SUMMARY');
  lines.push('-'.repeat(40));
  lines.push(`Total ZIL words:        ${report.summary.totalZilWords}`);
  lines.push(`Total TypeScript words: ${report.summary.totalTsWords}`);
  lines.push(`Missing in TypeScript:  ${report.summary.missingCount}`);
  lines.push(`Extra in TypeScript:    ${report.summary.extraCount}`);
  lines.push('');

  // Missing words section
  if (report.summary.missingCount > 0) {
    lines.push('MISSING WORDS (in ZIL but not TypeScript)');
    lines.push('-'.repeat(40));

    if (report.missing.nouns.length > 0) {
      lines.push(`Nouns (${report.missing.nouns.length}):`);
      lines.push(`  ${report.missing.nouns.join(', ')}`);
      lines.push('');
    }

    if (report.missing.adjectives.length > 0) {
      lines.push(`Adjectives (${report.missing.adjectives.length}):`);
      lines.push(`  ${report.missing.adjectives.join(', ')}`);
      lines.push('');
    }

    if (report.missing.verbs.length > 0) {
      lines.push(`Verbs (${report.missing.verbs.length}):`);
      lines.push(`  ${report.missing.verbs.join(', ')}`);
      lines.push('');
    }

    if (report.missing.prepositions.length > 0) {
      lines.push(`Prepositions (${report.missing.prepositions.length}):`);
      lines.push(`  ${report.missing.prepositions.join(', ')}`);
      lines.push('');
    }
  } else {
    lines.push('MISSING WORDS: None');
    lines.push('');
  }

  // Extra words section
  if (report.summary.extraCount > 0) {
    lines.push('EXTRA WORDS (in TypeScript but not ZIL)');
    lines.push('-'.repeat(40));

    if (report.extra.nouns.length > 0) {
      lines.push(`Nouns (${report.extra.nouns.length}):`);
      lines.push(`  ${report.extra.nouns.join(', ')}`);
      lines.push('');
    }

    if (report.extra.adjectives.length > 0) {
      lines.push(`Adjectives (${report.extra.adjectives.length}):`);
      lines.push(`  ${report.extra.adjectives.join(', ')}`);
      lines.push('');
    }

    if (report.extra.verbs.length > 0) {
      lines.push(`Verbs (${report.extra.verbs.length}):`);
      lines.push(`  ${report.extra.verbs.join(', ')}`);
      lines.push('');
    }

    if (report.extra.prepositions.length > 0) {
      lines.push(`Prepositions (${report.extra.prepositions.length}):`);
      lines.push(`  ${report.extra.prepositions.join(', ')}`);
      lines.push('');
    }
  } else {
    lines.push('EXTRA WORDS: None');
    lines.push('');
  }

  // Object issues section
  if (report.objectIssues.length > 0) {
    lines.push('OBJECT VOCABULARY ISSUES');
    lines.push('-'.repeat(40));

    for (const issue of report.objectIssues) {
      lines.push(`Object: ${issue.objectId}`);
      if (issue.missingSynonyms.length > 0) {
        lines.push(`  Missing synonyms: ${issue.missingSynonyms.join(', ')}`);
      }
      if (issue.missingAdjectives.length > 0) {
        lines.push(`  Missing adjectives: ${issue.missingAdjectives.join(', ')}`);
      }
      lines.push('');
    }
  } else {
    lines.push('OBJECT VOCABULARY ISSUES: None');
    lines.push('');
  }

  lines.push('='.repeat(60));
  lines.push('END OF REPORT');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Formats a FullReport as JSON for programmatic use.
 *
 * @param report - The FullReport to format
 * @param pretty - Whether to format with indentation (default: true)
 * @returns JSON string representation of the report
 *
 * Requirements: 4.4
 */
export function formatReportAsJson(report: FullReport, pretty: boolean = true): string {
  if (pretty) {
    return JSON.stringify(report, null, 2);
  }
  return JSON.stringify(report);
}

/**
 * Creates an empty FullReport structure.
 *
 * @returns An empty FullReport with zero counts and empty arrays
 */
export function createEmptyFullReport(): FullReport {
  return {
    summary: {
      totalZilWords: 0,
      totalTsWords: 0,
      missingCount: 0,
      extraCount: 0,
    },
    missing: {
      nouns: [],
      adjectives: [],
      verbs: [],
      prepositions: [],
    },
    extra: {
      nouns: [],
      adjectives: [],
      verbs: [],
      prepositions: [],
    },
    objectIssues: [],
  };
}
