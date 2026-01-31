/**
 * Unit tests for the Report Generator
 *
 * Tests report generation, formatting, and helper functions for
 * vocabulary comparison reports.
 *
 * Requirements: 4.4
 */

import { describe, it, expect } from 'vitest';
import {
  generateReport,
  formatReportAsText,
  formatReportAsJson,
  groupObjectIssues,
  countZilWords,
  countTsWords,
  createEmptyFullReport,
  FullReport,
} from './report-generator';
import { ComparisonReport, createEmptyComparisonReport } from './comparator';
import { ZilVocabulary, createEmptyZilVocabulary } from './zil-extractor';
import { TsVocabulary, createEmptyTsVocabulary } from './ts-extractor';

describe('countZilWords', () => {
  it('should count all words across categories', () => {
    const vocab: ZilVocabulary = {
      nouns: new Set(['lamp', 'sword', 'key']),
      adjectives: new Set(['brass', 'elvish']),
      verbs: new Set(['take', 'drop']),
      prepositions: new Set(['with']),
      buzzWords: new Set(['the', 'a']),
      directions: new Set(['north', 'south']),
    };

    const count = countZilWords(vocab);

    // 3 nouns + 2 adjectives + 2 verbs + 1 preposition = 8
    // buzzWords and directions are not counted
    expect(count).toBe(8);
  });

  it('should return 0 for empty vocabulary', () => {
    const vocab = createEmptyZilVocabulary();

    const count = countZilWords(vocab);

    expect(count).toBe(0);
  });
});

describe('countTsWords', () => {
  it('should count all words across categories', () => {
    const vocab: TsVocabulary = {
      nouns: new Set(['lamp', 'sword']),
      adjectives: new Set(['brass']),
      verbs: new Set(['take', 'drop', 'attack']),
      prepositions: new Set(['with', 'to']),
      directions: new Set(['north']),
      articles: new Set(['the']),
      pronouns: new Set(['it']),
      conjunctions: new Set(['and']),
    };

    const count = countTsWords(vocab);

    // 2 nouns + 1 adjective + 3 verbs + 2 prepositions = 8
    // directions, articles, pronouns, conjunctions are not counted
    expect(count).toBe(8);
  });

  it('should return 0 for empty vocabulary', () => {
    const vocab = createEmptyTsVocabulary();

    const count = countTsWords(vocab);

    expect(count).toBe(0);
  });
});

describe('groupObjectIssues', () => {
  it('should group issues by object ID', () => {
    const synonymsMissing = [
      { objectId: 'LAMP', word: 'lantern' },
      { objectId: 'LAMP', word: 'light' },
      { objectId: 'SWORD', word: 'blade' },
    ];
    const adjectivesMissing = [
      { objectId: 'LAMP', word: 'brass' },
      { objectId: 'SWORD', word: 'elvish' },
    ];

    const result = groupObjectIssues(synonymsMissing, adjectivesMissing);

    expect(result).toHaveLength(2);

    const lampIssue = result.find((r) => r.objectId === 'LAMP');
    expect(lampIssue).toBeDefined();
    expect(lampIssue?.missingSynonyms).toEqual(['lantern', 'light']);
    expect(lampIssue?.missingAdjectives).toEqual(['brass']);

    const swordIssue = result.find((r) => r.objectId === 'SWORD');
    expect(swordIssue).toBeDefined();
    expect(swordIssue?.missingSynonyms).toEqual(['blade']);
    expect(swordIssue?.missingAdjectives).toEqual(['elvish']);
  });

  it('should handle objects with only missing synonyms', () => {
    const synonymsMissing = [
      { objectId: 'LAMP', word: 'lantern' },
    ];
    const adjectivesMissing: { objectId: string; word: string }[] = [];

    const result = groupObjectIssues(synonymsMissing, adjectivesMissing);

    expect(result).toHaveLength(1);
    expect(result[0].objectId).toBe('LAMP');
    expect(result[0].missingSynonyms).toEqual(['lantern']);
    expect(result[0].missingAdjectives).toEqual([]);
  });

  it('should handle objects with only missing adjectives', () => {
    const synonymsMissing: { objectId: string; word: string }[] = [];
    const adjectivesMissing = [
      { objectId: 'LAMP', word: 'brass' },
    ];

    const result = groupObjectIssues(synonymsMissing, adjectivesMissing);

    expect(result).toHaveLength(1);
    expect(result[0].objectId).toBe('LAMP');
    expect(result[0].missingSynonyms).toEqual([]);
    expect(result[0].missingAdjectives).toEqual(['brass']);
  });

  it('should return empty array when no issues', () => {
    const result = groupObjectIssues([], []);

    expect(result).toEqual([]);
  });

  it('should sort results by object ID', () => {
    const synonymsMissing = [
      { objectId: 'ZEBRA', word: 'animal' },
      { objectId: 'APPLE', word: 'fruit' },
    ];
    const adjectivesMissing: { objectId: string; word: string }[] = [];

    const result = groupObjectIssues(synonymsMissing, adjectivesMissing);

    expect(result[0].objectId).toBe('APPLE');
    expect(result[1].objectId).toBe('ZEBRA');
  });

  it('should sort words within each object', () => {
    const synonymsMissing = [
      { objectId: 'LAMP', word: 'zebra' },
      { objectId: 'LAMP', word: 'apple' },
    ];
    const adjectivesMissing = [
      { objectId: 'LAMP', word: 'yellow' },
      { objectId: 'LAMP', word: 'blue' },
    ];

    const result = groupObjectIssues(synonymsMissing, adjectivesMissing);

    expect(result[0].missingSynonyms).toEqual(['apple', 'zebra']);
    expect(result[0].missingAdjectives).toEqual(['blue', 'yellow']);
  });
});

describe('generateReport', () => {
  it('should generate a complete report with all sections', () => {
    const comparisonReport: ComparisonReport = {
      missingInTs: [
        { word: 'chimney', category: 'noun', source: 'zil-only' },
        { word: 'brass', category: 'adjective', source: 'zil-only' },
        { word: 'attack', category: 'verb', source: 'zil-only' },
        { word: 'toward', category: 'preposition', source: 'zil-only' },
      ],
      extraInTs: [
        { word: 'torch', category: 'noun', source: 'ts-only' },
      ],
      objectSynonymsMissing: [
        { objectId: 'LAMP', word: 'lantern' },
      ],
      objectAdjectivesMissing: [
        { objectId: 'LAMP', word: 'small' },
      ],
    };

    const zilVocab: ZilVocabulary = {
      nouns: new Set(['lamp', 'sword', 'chimney']),
      adjectives: new Set(['brass', 'elvish']),
      verbs: new Set(['take', 'attack']),
      prepositions: new Set(['with', 'toward']),
      buzzWords: new Set(),
      directions: new Set(),
    };

    const tsVocab: TsVocabulary = {
      nouns: new Set(['lamp', 'sword', 'torch']),
      adjectives: new Set(['elvish']),
      verbs: new Set(['take']),
      prepositions: new Set(['with']),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = generateReport(comparisonReport, zilVocab, tsVocab);

    // Check summary
    expect(report.summary.totalZilWords).toBe(9); // 3+2+2+2
    expect(report.summary.totalTsWords).toBe(6); // 3+1+1+1
    expect(report.summary.missingCount).toBe(4);
    expect(report.summary.extraCount).toBe(1);

    // Check missing words
    expect(report.missing.nouns).toEqual(['chimney']);
    expect(report.missing.adjectives).toEqual(['brass']);
    expect(report.missing.verbs).toEqual(['attack']);
    expect(report.missing.prepositions).toEqual(['toward']);

    // Check extra words
    expect(report.extra.nouns).toEqual(['torch']);
    expect(report.extra.adjectives).toEqual([]);
    expect(report.extra.verbs).toEqual([]);
    expect(report.extra.prepositions).toEqual([]);

    // Check object issues
    expect(report.objectIssues).toHaveLength(1);
    expect(report.objectIssues[0].objectId).toBe('LAMP');
    expect(report.objectIssues[0].missingSynonyms).toEqual(['lantern']);
    expect(report.objectIssues[0].missingAdjectives).toEqual(['small']);
  });

  it('should handle empty comparison report', () => {
    const comparisonReport = createEmptyComparisonReport();
    const zilVocab = createEmptyZilVocabulary();
    const tsVocab = createEmptyTsVocabulary();

    const report = generateReport(comparisonReport, zilVocab, tsVocab);

    expect(report.summary.totalZilWords).toBe(0);
    expect(report.summary.totalTsWords).toBe(0);
    expect(report.summary.missingCount).toBe(0);
    expect(report.summary.extraCount).toBe(0);
    expect(report.missing.nouns).toEqual([]);
    expect(report.missing.adjectives).toEqual([]);
    expect(report.missing.verbs).toEqual([]);
    expect(report.missing.prepositions).toEqual([]);
    expect(report.extra.nouns).toEqual([]);
    expect(report.objectIssues).toEqual([]);
  });

  it('should sort missing words alphabetically', () => {
    const comparisonReport: ComparisonReport = {
      missingInTs: [
        { word: 'zebra', category: 'noun', source: 'zil-only' },
        { word: 'apple', category: 'noun', source: 'zil-only' },
        { word: 'mango', category: 'noun', source: 'zil-only' },
      ],
      extraInTs: [],
      objectSynonymsMissing: [],
      objectAdjectivesMissing: [],
    };

    const zilVocab: ZilVocabulary = {
      nouns: new Set(['zebra', 'apple', 'mango']),
      adjectives: new Set(),
      verbs: new Set(),
      prepositions: new Set(),
      buzzWords: new Set(),
      directions: new Set(),
    };

    const tsVocab = createEmptyTsVocabulary();

    const report = generateReport(comparisonReport, zilVocab, tsVocab);

    expect(report.missing.nouns).toEqual(['apple', 'mango', 'zebra']);
  });
});

describe('formatReportAsText', () => {
  it('should format a complete report as readable text', () => {
    const report: FullReport = {
      summary: {
        totalZilWords: 100,
        totalTsWords: 95,
        missingCount: 5,
        extraCount: 2,
      },
      missing: {
        nouns: ['chimney', 'fireplace'],
        adjectives: ['brass'],
        verbs: ['attack'],
        prepositions: ['toward'],
      },
      extra: {
        nouns: ['torch'],
        adjectives: ['shiny'],
        verbs: [],
        prepositions: [],
      },
      objectIssues: [
        {
          objectId: 'LAMP',
          missingSynonyms: ['lantern'],
          missingAdjectives: ['small'],
        },
      ],
    };

    const text = formatReportAsText(report);

    // Check header
    expect(text).toContain('VOCABULARY COMPARISON REPORT');

    // Check summary
    expect(text).toContain('Total ZIL words:        100');
    expect(text).toContain('Total TypeScript words: 95');
    expect(text).toContain('Missing in TypeScript:  5');
    expect(text).toContain('Extra in TypeScript:    2');

    // Check missing words
    expect(text).toContain('MISSING WORDS (in ZIL but not TypeScript)');
    expect(text).toContain('Nouns (2):');
    expect(text).toContain('chimney, fireplace');
    expect(text).toContain('Adjectives (1):');
    expect(text).toContain('brass');
    expect(text).toContain('Verbs (1):');
    expect(text).toContain('attack');
    expect(text).toContain('Prepositions (1):');
    expect(text).toContain('toward');

    // Check extra words
    expect(text).toContain('EXTRA WORDS (in TypeScript but not ZIL)');
    expect(text).toContain('torch');
    expect(text).toContain('shiny');

    // Check object issues
    expect(text).toContain('OBJECT VOCABULARY ISSUES');
    expect(text).toContain('Object: LAMP');
    expect(text).toContain('Missing synonyms: lantern');
    expect(text).toContain('Missing adjectives: small');

    // Check footer
    expect(text).toContain('END OF REPORT');
  });

  it('should handle report with no missing words', () => {
    const report: FullReport = {
      summary: {
        totalZilWords: 50,
        totalTsWords: 50,
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

    const text = formatReportAsText(report);

    expect(text).toContain('MISSING WORDS: None');
    expect(text).toContain('EXTRA WORDS: None');
    expect(text).toContain('OBJECT VOCABULARY ISSUES: None');
  });

  it('should handle report with only some categories having missing words', () => {
    const report: FullReport = {
      summary: {
        totalZilWords: 50,
        totalTsWords: 48,
        missingCount: 2,
        extraCount: 0,
      },
      missing: {
        nouns: ['chimney'],
        adjectives: [],
        verbs: ['attack'],
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

    const text = formatReportAsText(report);

    expect(text).toContain('Nouns (1):');
    expect(text).toContain('chimney');
    expect(text).toContain('Verbs (1):');
    expect(text).toContain('attack');
    // Should not contain adjectives or prepositions sections
    expect(text).not.toContain('Adjectives (0):');
    expect(text).not.toContain('Prepositions (0):');
  });

  it('should handle multiple object issues', () => {
    const report: FullReport = {
      summary: {
        totalZilWords: 50,
        totalTsWords: 45,
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
      objectIssues: [
        {
          objectId: 'LAMP',
          missingSynonyms: ['lantern', 'light'],
          missingAdjectives: [],
        },
        {
          objectId: 'SWORD',
          missingSynonyms: [],
          missingAdjectives: ['elvish'],
        },
      ],
    };

    const text = formatReportAsText(report);

    expect(text).toContain('Object: LAMP');
    expect(text).toContain('Missing synonyms: lantern, light');
    expect(text).toContain('Object: SWORD');
    expect(text).toContain('Missing adjectives: elvish');
  });
});

describe('formatReportAsJson', () => {
  it('should format report as pretty JSON by default', () => {
    const report: FullReport = {
      summary: {
        totalZilWords: 100,
        totalTsWords: 95,
        missingCount: 5,
        extraCount: 2,
      },
      missing: {
        nouns: ['chimney'],
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

    const json = formatReportAsJson(report);

    // Should be pretty-printed (contains newlines and indentation)
    expect(json).toContain('\n');
    expect(json).toContain('  ');

    // Should be valid JSON
    const parsed = JSON.parse(json);
    expect(parsed.summary.totalZilWords).toBe(100);
    expect(parsed.missing.nouns).toEqual(['chimney']);
  });

  it('should format report as compact JSON when pretty=false', () => {
    const report: FullReport = {
      summary: {
        totalZilWords: 100,
        totalTsWords: 95,
        missingCount: 5,
        extraCount: 2,
      },
      missing: {
        nouns: ['chimney'],
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

    const json = formatReportAsJson(report, false);

    // Should not contain newlines (compact)
    expect(json).not.toContain('\n');

    // Should be valid JSON
    const parsed = JSON.parse(json);
    expect(parsed.summary.totalZilWords).toBe(100);
  });

  it('should produce valid JSON that can be parsed back to FullReport', () => {
    const report: FullReport = {
      summary: {
        totalZilWords: 100,
        totalTsWords: 95,
        missingCount: 5,
        extraCount: 2,
      },
      missing: {
        nouns: ['chimney', 'fireplace'],
        adjectives: ['brass'],
        verbs: ['attack'],
        prepositions: ['toward'],
      },
      extra: {
        nouns: ['torch'],
        adjectives: [],
        verbs: [],
        prepositions: [],
      },
      objectIssues: [
        {
          objectId: 'LAMP',
          missingSynonyms: ['lantern'],
          missingAdjectives: ['small'],
        },
      ],
    };

    const json = formatReportAsJson(report);
    const parsed = JSON.parse(json) as FullReport;

    expect(parsed).toEqual(report);
  });
});

describe('createEmptyFullReport', () => {
  it('should create an empty report structure', () => {
    const report = createEmptyFullReport();

    expect(report.summary.totalZilWords).toBe(0);
    expect(report.summary.totalTsWords).toBe(0);
    expect(report.summary.missingCount).toBe(0);
    expect(report.summary.extraCount).toBe(0);
    expect(report.missing.nouns).toEqual([]);
    expect(report.missing.adjectives).toEqual([]);
    expect(report.missing.verbs).toEqual([]);
    expect(report.missing.prepositions).toEqual([]);
    expect(report.extra.nouns).toEqual([]);
    expect(report.extra.adjectives).toEqual([]);
    expect(report.extra.verbs).toEqual([]);
    expect(report.extra.prepositions).toEqual([]);
    expect(report.objectIssues).toEqual([]);
  });
});

describe('Integration: generateReport + formatReportAsText', () => {
  it('should produce consistent output through the full pipeline', () => {
    const comparisonReport: ComparisonReport = {
      missingInTs: [
        { word: 'chimney', category: 'noun', source: 'zil-only' },
      ],
      extraInTs: [],
      objectSynonymsMissing: [
        { objectId: 'FIREPLACE', word: 'chimney' },
      ],
      objectAdjectivesMissing: [],
    };

    const zilVocab: ZilVocabulary = {
      nouns: new Set(['chimney', 'fireplace']),
      adjectives: new Set(),
      verbs: new Set(),
      prepositions: new Set(),
      buzzWords: new Set(),
      directions: new Set(),
    };

    const tsVocab: TsVocabulary = {
      nouns: new Set(['fireplace']),
      adjectives: new Set(),
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = generateReport(comparisonReport, zilVocab, tsVocab);
    const text = formatReportAsText(report);

    // Verify the text contains expected content
    expect(text).toContain('Missing in TypeScript:  1');
    expect(text).toContain('chimney');
    expect(text).toContain('Object: FIREPLACE');
    expect(text).toContain('Missing synonyms: chimney');
  });
});
