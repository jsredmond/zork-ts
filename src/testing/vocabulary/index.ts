/**
 * Vocabulary Audit Utilities
 *
 * This module exports all vocabulary audit utilities for easy importing.
 * Use this index to access extractors, comparators, and report generators.
 *
 * @example
 * import {
 *   extractZilVocabulary,
 *   extractTsVocabulary,
 *   compareVocabularies,
 *   generateReport
 * } from './testing/vocabulary';
 */

// ZIL Extractor exports
export {
  extractZilVocabulary,
  parseZilSynonym,
  parseZilAdjective,
  parseZilBuzz,
  parseZilDirections,
  parseZilObject,
  normalizeZilWord,
  isZilComment,
  createEmptyZilVocabulary,
  DEFAULT_ZIL_FILES,
  DEFAULT_ZIL_PATH,
  type ZilVocabulary,
  type ZilObjectDef,
} from './zil-extractor';

// TypeScript Extractor exports
export {
  extractTsVocabulary,
  extractObjectDefinitions,
  extractWordsFromArray,
  extractMethodBody,
  extractWordsFromLoadMethod,
  parseObjectDefinition,
  getAllObjectSynonyms,
  getAllObjectAdjectives,
  getTotalWordCount,
  vocabularyToObject,
  createEmptyTsVocabulary,
  DEFAULT_VOCABULARY_PATH,
  DEFAULT_OBJECTS_PATH,
  type TsVocabulary,
  type TsObjectDef,
} from './ts-extractor';

// Comparator exports
export {
  compareVocabularies,
  crossReferenceObjects,
  setDifference,
  setIntersection,
  setUnion,
  compareCategory,
  countByCategory,
  filterByCategory,
  getWords,
  summarizeReport,
  createEmptyComparisonReport,
  type ComparisonReport,
  type VocabularyDiscrepancy,
  type ObjectVocabularyIssue,
} from './comparator';

// Report Generator exports
export {
  generateReport,
  formatReportAsText,
  formatReportAsJson,
  countZilWords,
  countTsWords,
  groupObjectIssues,
  createEmptyFullReport,
  type FullReport,
} from './report-generator';

// Run Audit exports
export {
  runExtraction,
  calculateSummary,
  formatSummary,
  main as runAudit,
  type AuditExtractionResult,
  type ExtractionSummary,
} from './run-audit';
