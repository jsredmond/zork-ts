/**
 * Vocabulary Comparator
 *
 * Compares ZIL and TypeScript vocabularies to identify discrepancies.
 * Computes set differences and categorizes missing words by type.
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import { ZilVocabulary } from './zil-extractor';
import { TsVocabulary, TsObjectDef } from './ts-extractor';

/**
 * Represents a vocabulary discrepancy between ZIL and TypeScript.
 */
export interface VocabularyDiscrepancy {
  word: string;
  category: 'noun' | 'adjective' | 'verb' | 'preposition';
  source: 'zil-only' | 'ts-only';
  context?: string; // Object ID or file location
}

/**
 * Represents missing object synonyms or adjectives.
 */
export interface ObjectVocabularyIssue {
  objectId: string;
  word: string;
}

/**
 * Represents the full comparison report between ZIL and TypeScript vocabularies.
 */
export interface ComparisonReport {
  missingInTs: VocabularyDiscrepancy[];
  extraInTs: VocabularyDiscrepancy[];
  objectSynonymsMissing: ObjectVocabularyIssue[];
  objectAdjectivesMissing: ObjectVocabularyIssue[];
}

/**
 * Creates an empty ComparisonReport structure.
 */
export function createEmptyComparisonReport(): ComparisonReport {
  return {
    missingInTs: [],
    extraInTs: [],
    objectSynonymsMissing: [],
    objectAdjectivesMissing: [],
  };
}

/**
 * Computes the set difference: elements in setA that are not in setB.
 *
 * @param setA - The first set
 * @param setB - The second set
 * @returns A new Set containing elements in setA but not in setB
 */
export function setDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const difference = new Set<T>();
  for (const element of setA) {
    if (!setB.has(element)) {
      difference.add(element);
    }
  }
  return difference;
}

/**
 * Computes the set intersection: elements in both setA and setB.
 *
 * @param setA - The first set
 * @param setB - The second set
 * @returns A new Set containing elements in both setA and setB
 */
export function setIntersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const intersection = new Set<T>();
  for (const element of setA) {
    if (setB.has(element)) {
      intersection.add(element);
    }
  }
  return intersection;
}

/**
 * Computes the set union: all elements in either setA or setB.
 *
 * @param setA - The first set
 * @param setB - The second set
 * @returns A new Set containing all elements from both sets
 */
export function setUnion<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const union = new Set<T>(setA);
  for (const element of setB) {
    union.add(element);
  }
  return union;
}

/**
 * Compares a single vocabulary category between ZIL and TypeScript.
 *
 * @param zilWords - Set of words from ZIL
 * @param tsWords - Set of words from TypeScript
 * @param category - The vocabulary category being compared
 * @returns Object containing arrays of missing and extra discrepancies
 */
export function compareCategory(
  zilWords: Set<string>,
  tsWords: Set<string>,
  category: 'noun' | 'adjective' | 'verb' | 'preposition'
): { missing: VocabularyDiscrepancy[]; extra: VocabularyDiscrepancy[] } {
  const missing: VocabularyDiscrepancy[] = [];
  const extra: VocabularyDiscrepancy[] = [];

  // Words in ZIL but not in TypeScript (missing)
  const missingWords = setDifference(zilWords, tsWords);
  for (const word of missingWords) {
    missing.push({
      word,
      category,
      source: 'zil-only',
    });
  }

  // Words in TypeScript but not in ZIL (extra)
  const extraWords = setDifference(tsWords, zilWords);
  for (const word of extraWords) {
    extra.push({
      word,
      category,
      source: 'ts-only',
    });
  }

  return { missing, extra };
}

/**
 * Compares ZIL and TypeScript vocabularies to identify all discrepancies.
 *
 * This function computes set differences for each vocabulary category:
 * - nouns
 * - adjectives
 * - verbs
 * - prepositions
 *
 * It identifies:
 * - Words present in ZIL but missing from TypeScript (missingInTs)
 * - Words present in TypeScript but not in ZIL (extraInTs)
 *
 * @param zil - The ZIL vocabulary extracted from source files
 * @param ts - The TypeScript vocabulary extracted from vocabulary.ts
 * @returns ComparisonReport with all discrepancies categorized
 *
 * Requirements: 4.1, 4.2, 4.3
 *
 * @example
 * const zilVocab = extractZilVocabulary();
 * const tsVocab = extractTsVocabulary();
 * const report = compareVocabularies(zilVocab, tsVocab);
 * console.log(`Missing nouns: ${report.missingInTs.filter(d => d.category === 'noun').length}`);
 */
export function compareVocabularies(zil: ZilVocabulary, ts: TsVocabulary): ComparisonReport {
  const report = createEmptyComparisonReport();

  // Compare nouns
  const nounComparison = compareCategory(zil.nouns, ts.nouns, 'noun');
  report.missingInTs.push(...nounComparison.missing);
  report.extraInTs.push(...nounComparison.extra);

  // Compare adjectives
  const adjectiveComparison = compareCategory(zil.adjectives, ts.adjectives, 'adjective');
  report.missingInTs.push(...adjectiveComparison.missing);
  report.extraInTs.push(...adjectiveComparison.extra);

  // Compare verbs
  const verbComparison = compareCategory(zil.verbs, ts.verbs, 'verb');
  report.missingInTs.push(...verbComparison.missing);
  report.extraInTs.push(...verbComparison.extra);

  // Compare prepositions
  const prepositionComparison = compareCategory(zil.prepositions, ts.prepositions, 'preposition');
  report.missingInTs.push(...prepositionComparison.missing);
  report.extraInTs.push(...prepositionComparison.extra);

  // Sort discrepancies by category then by word for consistent output
  report.missingInTs.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.word.localeCompare(b.word);
  });

  report.extraInTs.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.word.localeCompare(b.word);
  });

  return report;
}

/**
 * Gets the count of discrepancies by category.
 *
 * @param discrepancies - Array of VocabularyDiscrepancy
 * @returns Object with counts for each category
 */
export function countByCategory(discrepancies: VocabularyDiscrepancy[]): {
  noun: number;
  adjective: number;
  verb: number;
  preposition: number;
} {
  const counts = {
    noun: 0,
    adjective: 0,
    verb: 0,
    preposition: 0,
  };

  for (const discrepancy of discrepancies) {
    counts[discrepancy.category]++;
  }

  return counts;
}

/**
 * Filters discrepancies by category.
 *
 * @param discrepancies - Array of VocabularyDiscrepancy
 * @param category - The category to filter by
 * @returns Array of discrepancies matching the category
 */
export function filterByCategory(
  discrepancies: VocabularyDiscrepancy[],
  category: 'noun' | 'adjective' | 'verb' | 'preposition'
): VocabularyDiscrepancy[] {
  return discrepancies.filter((d) => d.category === category);
}

/**
 * Gets just the words from an array of discrepancies.
 *
 * @param discrepancies - Array of VocabularyDiscrepancy
 * @returns Array of words (sorted alphabetically)
 */
export function getWords(discrepancies: VocabularyDiscrepancy[]): string[] {
  return discrepancies.map((d) => d.word).sort();
}

/**
 * Summarizes a comparison report for display.
 *
 * @param report - The ComparisonReport to summarize
 * @returns Object with summary statistics
 */
export function summarizeReport(report: ComparisonReport): {
  totalMissing: number;
  totalExtra: number;
  missingByCategory: { noun: number; adjective: number; verb: number; preposition: number };
  extraByCategory: { noun: number; adjective: number; verb: number; preposition: number };
  objectSynonymsMissingCount: number;
  objectAdjectivesMissingCount: number;
} {
  return {
    totalMissing: report.missingInTs.length,
    totalExtra: report.extraInTs.length,
    missingByCategory: countByCategory(report.missingInTs),
    extraByCategory: countByCategory(report.extraInTs),
    objectSynonymsMissingCount: report.objectSynonymsMissing.length,
    objectAdjectivesMissingCount: report.objectAdjectivesMissing.length,
  };
}


/**
 * Cross-references object definitions against the vocabulary to identify
 * missing synonyms and adjectives.
 *
 * For each object in the provided array:
 * - Checks if all synonyms exist in vocabulary.nouns
 * - Checks if all adjectives exist in vocabulary.adjectives
 *
 * Reports the object ID and missing word for each discrepancy found.
 *
 * @param tsObjects - Array of TsObjectDef from ts-extractor
 * @param tsVocab - The TsVocabulary extracted from vocabulary.ts
 * @returns ComparisonReport with objectSynonymsMissing and objectAdjectivesMissing populated
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 *
 * @example
 * const objects = extractObjectDefinitions();
 * const vocab = extractTsVocabulary();
 * const report = crossReferenceObjects(objects, vocab);
 * if (report.objectSynonymsMissing.length > 0) {
 *   console.log('Missing synonyms:', report.objectSynonymsMissing);
 * }
 */
export function crossReferenceObjects(
  tsObjects: TsObjectDef[],
  tsVocab: TsVocabulary
): ComparisonReport {
  const report = createEmptyComparisonReport();

  for (const obj of tsObjects) {
    // Check synonyms against vocabulary nouns (Requirement 3.1, 3.3)
    for (const synonym of obj.synonyms) {
      const normalizedSynonym = synonym.toLowerCase();
      if (!tsVocab.nouns.has(normalizedSynonym)) {
        report.objectSynonymsMissing.push({
          objectId: obj.id,
          word: normalizedSynonym,
        });
      }
    }

    // Check adjectives against vocabulary adjectives (Requirement 3.2, 3.4)
    for (const adjective of obj.adjectives) {
      const normalizedAdjective = adjective.toLowerCase();
      if (!tsVocab.adjectives.has(normalizedAdjective)) {
        report.objectAdjectivesMissing.push({
          objectId: obj.id,
          word: normalizedAdjective,
        });
      }
    }
  }

  // Sort results for consistent output
  report.objectSynonymsMissing.sort((a, b) => {
    if (a.objectId !== b.objectId) {
      return a.objectId.localeCompare(b.objectId);
    }
    return a.word.localeCompare(b.word);
  });

  report.objectAdjectivesMissing.sort((a, b) => {
    if (a.objectId !== b.objectId) {
      return a.objectId.localeCompare(b.objectId);
    }
    return a.word.localeCompare(b.word);
  });

  return report;
}
