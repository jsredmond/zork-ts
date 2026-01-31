/**
 * Unit tests for the Vocabulary Comparator
 *
 * Tests the comparison logic for identifying discrepancies between
 * ZIL and TypeScript vocabularies.
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import { describe, it, expect } from 'vitest';
import {
  setDifference,
  setIntersection,
  setUnion,
  compareCategory,
  compareVocabularies,
  crossReferenceObjects,
  countByCategory,
  filterByCategory,
  getWords,
  summarizeReport,
  createEmptyComparisonReport,
  VocabularyDiscrepancy,
  ComparisonReport,
} from './comparator';
import { ZilVocabulary, createEmptyZilVocabulary } from './zil-extractor';
import { TsVocabulary, TsObjectDef, createEmptyTsVocabulary } from './ts-extractor';

describe('Set Operations', () => {
  describe('setDifference', () => {
    it('should return elements in A but not in B', () => {
      const setA = new Set(['a', 'b', 'c', 'd']);
      const setB = new Set(['b', 'd', 'e']);

      const result = setDifference(setA, setB);

      expect(result).toEqual(new Set(['a', 'c']));
    });

    it('should return empty set when A is subset of B', () => {
      const setA = new Set(['a', 'b']);
      const setB = new Set(['a', 'b', 'c']);

      const result = setDifference(setA, setB);

      expect(result.size).toBe(0);
    });

    it('should return all elements when B is empty', () => {
      const setA = new Set(['a', 'b', 'c']);
      const setB = new Set<string>();

      const result = setDifference(setA, setB);

      expect(result).toEqual(setA);
    });

    it('should return empty set when A is empty', () => {
      const setA = new Set<string>();
      const setB = new Set(['a', 'b', 'c']);

      const result = setDifference(setA, setB);

      expect(result.size).toBe(0);
    });

    it('should handle identical sets', () => {
      const setA = new Set(['a', 'b', 'c']);
      const setB = new Set(['a', 'b', 'c']);

      const result = setDifference(setA, setB);

      expect(result.size).toBe(0);
    });

    it('should handle completely disjoint sets', () => {
      const setA = new Set(['a', 'b']);
      const setB = new Set(['c', 'd']);

      const result = setDifference(setA, setB);

      expect(result).toEqual(setA);
    });
  });

  describe('setIntersection', () => {
    it('should return elements in both A and B', () => {
      const setA = new Set(['a', 'b', 'c', 'd']);
      const setB = new Set(['b', 'd', 'e']);

      const result = setIntersection(setA, setB);

      expect(result).toEqual(new Set(['b', 'd']));
    });

    it('should return empty set for disjoint sets', () => {
      const setA = new Set(['a', 'b']);
      const setB = new Set(['c', 'd']);

      const result = setIntersection(setA, setB);

      expect(result.size).toBe(0);
    });

    it('should return A when A is subset of B', () => {
      const setA = new Set(['a', 'b']);
      const setB = new Set(['a', 'b', 'c']);

      const result = setIntersection(setA, setB);

      expect(result).toEqual(setA);
    });
  });

  describe('setUnion', () => {
    it('should return all elements from both sets', () => {
      const setA = new Set(['a', 'b', 'c']);
      const setB = new Set(['b', 'd', 'e']);

      const result = setUnion(setA, setB);

      expect(result).toEqual(new Set(['a', 'b', 'c', 'd', 'e']));
    });

    it('should handle empty sets', () => {
      const setA = new Set(['a', 'b']);
      const setB = new Set<string>();

      const result = setUnion(setA, setB);

      expect(result).toEqual(setA);
    });
  });

  describe('Set difference property: A - B, B - A, and A ∩ B partition A ∪ B', () => {
    it('should satisfy: (A - B) ∪ (B - A) ∪ (A ∩ B) = A ∪ B', () => {
      const setA = new Set(['a', 'b', 'c', 'd']);
      const setB = new Set(['c', 'd', 'e', 'f']);

      const aMinusB = setDifference(setA, setB);
      const bMinusA = setDifference(setB, setA);
      const intersection = setIntersection(setA, setB);
      const union = setUnion(setA, setB);

      // Combine the three partitions
      const combined = setUnion(setUnion(aMinusB, bMinusA), intersection);

      expect(combined).toEqual(union);
    });
  });
});

describe('compareCategory', () => {
  it('should identify missing words (in ZIL but not TS)', () => {
    const zilWords = new Set(['lamp', 'lantern', 'light']);
    const tsWords = new Set(['lamp', 'light']);

    const result = compareCategory(zilWords, tsWords, 'noun');

    expect(result.missing).toHaveLength(1);
    expect(result.missing[0]).toEqual({
      word: 'lantern',
      category: 'noun',
      source: 'zil-only',
    });
  });

  it('should identify extra words (in TS but not ZIL)', () => {
    const zilWords = new Set(['lamp', 'light']);
    const tsWords = new Set(['lamp', 'light', 'torch']);

    const result = compareCategory(zilWords, tsWords, 'noun');

    expect(result.extra).toHaveLength(1);
    expect(result.extra[0]).toEqual({
      word: 'torch',
      category: 'noun',
      source: 'ts-only',
    });
  });

  it('should handle identical vocabularies', () => {
    const zilWords = new Set(['lamp', 'lantern', 'light']);
    const tsWords = new Set(['lamp', 'lantern', 'light']);

    const result = compareCategory(zilWords, tsWords, 'noun');

    expect(result.missing).toHaveLength(0);
    expect(result.extra).toHaveLength(0);
  });

  it('should handle completely disjoint vocabularies', () => {
    const zilWords = new Set(['lamp', 'lantern']);
    const tsWords = new Set(['torch', 'flashlight']);

    const result = compareCategory(zilWords, tsWords, 'noun');

    expect(result.missing).toHaveLength(2);
    expect(result.extra).toHaveLength(2);
  });

  it('should use the correct category in discrepancies', () => {
    const zilWords = new Set(['brass', 'small']);
    const tsWords = new Set(['brass']);

    const result = compareCategory(zilWords, tsWords, 'adjective');

    expect(result.missing[0].category).toBe('adjective');
  });
});

describe('compareVocabularies', () => {
  it('should compare all vocabulary categories', () => {
    const zil: ZilVocabulary = {
      nouns: new Set(['lamp', 'sword', 'chimney']),
      adjectives: new Set(['brass', 'elvish']),
      verbs: new Set(['take', 'drop', 'attack']),
      prepositions: new Set(['with', 'to']),
      buzzWords: new Set(['the', 'a']),
      directions: new Set(['north', 'south']),
    };

    const ts: TsVocabulary = {
      nouns: new Set(['lamp', 'sword']), // missing 'chimney'
      adjectives: new Set(['brass', 'elvish', 'shiny']), // extra 'shiny'
      verbs: new Set(['take', 'drop']), // missing 'attack'
      prepositions: new Set(['with', 'to', 'from']), // extra 'from'
      directions: new Set(['north', 'south']),
      articles: new Set(['the', 'a']),
      pronouns: new Set(['it']),
      conjunctions: new Set(['and']),
    };

    const report = compareVocabularies(zil, ts);

    // Check missing words
    const missingNouns = report.missingInTs.filter((d) => d.category === 'noun');
    expect(missingNouns).toHaveLength(1);
    expect(missingNouns[0].word).toBe('chimney');

    const missingVerbs = report.missingInTs.filter((d) => d.category === 'verb');
    expect(missingVerbs).toHaveLength(1);
    expect(missingVerbs[0].word).toBe('attack');

    // Check extra words
    const extraAdjectives = report.extraInTs.filter((d) => d.category === 'adjective');
    expect(extraAdjectives).toHaveLength(1);
    expect(extraAdjectives[0].word).toBe('shiny');

    const extraPrepositions = report.extraInTs.filter((d) => d.category === 'preposition');
    expect(extraPrepositions).toHaveLength(1);
    expect(extraPrepositions[0].word).toBe('from');
  });

  it('should return empty report for identical vocabularies', () => {
    const zil: ZilVocabulary = {
      nouns: new Set(['lamp', 'sword']),
      adjectives: new Set(['brass']),
      verbs: new Set(['take']),
      prepositions: new Set(['with']),
      buzzWords: new Set(),
      directions: new Set(),
    };

    const ts: TsVocabulary = {
      nouns: new Set(['lamp', 'sword']),
      adjectives: new Set(['brass']),
      verbs: new Set(['take']),
      prepositions: new Set(['with']),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = compareVocabularies(zil, ts);

    expect(report.missingInTs).toHaveLength(0);
    expect(report.extraInTs).toHaveLength(0);
  });

  it('should handle empty vocabularies', () => {
    const zil = createEmptyZilVocabulary();
    const ts = createEmptyTsVocabulary();

    const report = compareVocabularies(zil, ts);

    expect(report.missingInTs).toHaveLength(0);
    expect(report.extraInTs).toHaveLength(0);
  });

  it('should sort discrepancies by category then word', () => {
    const zil: ZilVocabulary = {
      nouns: new Set(['zebra', 'apple']),
      adjectives: new Set(['big', 'small']),
      verbs: new Set(),
      prepositions: new Set(),
      buzzWords: new Set(),
      directions: new Set(),
    };

    const ts: TsVocabulary = {
      nouns: new Set(),
      adjectives: new Set(),
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = compareVocabularies(zil, ts);

    // Should be sorted: adjectives first (big, small), then nouns (apple, zebra)
    expect(report.missingInTs[0].category).toBe('adjective');
    expect(report.missingInTs[0].word).toBe('big');
    expect(report.missingInTs[1].category).toBe('adjective');
    expect(report.missingInTs[1].word).toBe('small');
    expect(report.missingInTs[2].category).toBe('noun');
    expect(report.missingInTs[2].word).toBe('apple');
    expect(report.missingInTs[3].category).toBe('noun');
    expect(report.missingInTs[3].word).toBe('zebra');
  });
});

describe('Helper Functions', () => {
  describe('countByCategory', () => {
    it('should count discrepancies by category', () => {
      const discrepancies: VocabularyDiscrepancy[] = [
        { word: 'lamp', category: 'noun', source: 'zil-only' },
        { word: 'sword', category: 'noun', source: 'zil-only' },
        { word: 'brass', category: 'adjective', source: 'zil-only' },
        { word: 'take', category: 'verb', source: 'zil-only' },
        { word: 'with', category: 'preposition', source: 'zil-only' },
        { word: 'to', category: 'preposition', source: 'zil-only' },
      ];

      const counts = countByCategory(discrepancies);

      expect(counts.noun).toBe(2);
      expect(counts.adjective).toBe(1);
      expect(counts.verb).toBe(1);
      expect(counts.preposition).toBe(2);
    });

    it('should return zeros for empty array', () => {
      const counts = countByCategory([]);

      expect(counts.noun).toBe(0);
      expect(counts.adjective).toBe(0);
      expect(counts.verb).toBe(0);
      expect(counts.preposition).toBe(0);
    });
  });

  describe('filterByCategory', () => {
    it('should filter discrepancies by category', () => {
      const discrepancies: VocabularyDiscrepancy[] = [
        { word: 'lamp', category: 'noun', source: 'zil-only' },
        { word: 'brass', category: 'adjective', source: 'zil-only' },
        { word: 'sword', category: 'noun', source: 'zil-only' },
      ];

      const nouns = filterByCategory(discrepancies, 'noun');

      expect(nouns).toHaveLength(2);
      expect(nouns.every((d) => d.category === 'noun')).toBe(true);
    });

    it('should return empty array when no matches', () => {
      const discrepancies: VocabularyDiscrepancy[] = [
        { word: 'lamp', category: 'noun', source: 'zil-only' },
      ];

      const verbs = filterByCategory(discrepancies, 'verb');

      expect(verbs).toHaveLength(0);
    });
  });

  describe('getWords', () => {
    it('should extract and sort words from discrepancies', () => {
      const discrepancies: VocabularyDiscrepancy[] = [
        { word: 'zebra', category: 'noun', source: 'zil-only' },
        { word: 'apple', category: 'noun', source: 'zil-only' },
        { word: 'mango', category: 'noun', source: 'zil-only' },
      ];

      const words = getWords(discrepancies);

      expect(words).toEqual(['apple', 'mango', 'zebra']);
    });
  });

  describe('summarizeReport', () => {
    it('should provide summary statistics', () => {
      const report: ComparisonReport = {
        missingInTs: [
          { word: 'lamp', category: 'noun', source: 'zil-only' },
          { word: 'brass', category: 'adjective', source: 'zil-only' },
          { word: 'take', category: 'verb', source: 'zil-only' },
        ],
        extraInTs: [
          { word: 'torch', category: 'noun', source: 'ts-only' },
        ],
        objectSynonymsMissing: [
          { objectId: 'LAMP', word: 'lantern' },
        ],
        objectAdjectivesMissing: [],
      };

      const summary = summarizeReport(report);

      expect(summary.totalMissing).toBe(3);
      expect(summary.totalExtra).toBe(1);
      expect(summary.missingByCategory.noun).toBe(1);
      expect(summary.missingByCategory.adjective).toBe(1);
      expect(summary.missingByCategory.verb).toBe(1);
      expect(summary.extraByCategory.noun).toBe(1);
      expect(summary.objectSynonymsMissingCount).toBe(1);
      expect(summary.objectAdjectivesMissingCount).toBe(0);
    });
  });

  describe('createEmptyComparisonReport', () => {
    it('should create an empty report structure', () => {
      const report = createEmptyComparisonReport();

      expect(report.missingInTs).toEqual([]);
      expect(report.extraInTs).toEqual([]);
      expect(report.objectSynonymsMissing).toEqual([]);
      expect(report.objectAdjectivesMissing).toEqual([]);
    });
  });
});


describe('crossReferenceObjects', () => {
  /**
   * Tests for cross-referencing object definitions against vocabulary.
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */

  it('should identify missing synonyms not in vocabulary nouns (Requirement 3.1, 3.3)', () => {
    const objects: TsObjectDef[] = [
      {
        id: 'LAMP',
        synonyms: ['lamp', 'lantern', 'light'],
        adjectives: ['brass'],
      },
    ];

    const vocab: TsVocabulary = {
      nouns: new Set(['lamp', 'light']), // missing 'lantern'
      adjectives: new Set(['brass']),
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = crossReferenceObjects(objects, vocab);

    expect(report.objectSynonymsMissing).toHaveLength(1);
    expect(report.objectSynonymsMissing[0]).toEqual({
      objectId: 'LAMP',
      word: 'lantern',
    });
  });

  it('should identify missing adjectives not in vocabulary adjectives (Requirement 3.2, 3.4)', () => {
    const objects: TsObjectDef[] = [
      {
        id: 'LAMP',
        synonyms: ['lamp'],
        adjectives: ['brass', 'small'],
      },
    ];

    const vocab: TsVocabulary = {
      nouns: new Set(['lamp']),
      adjectives: new Set(['brass']), // missing 'small'
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = crossReferenceObjects(objects, vocab);

    expect(report.objectAdjectivesMissing).toHaveLength(1);
    expect(report.objectAdjectivesMissing[0]).toEqual({
      objectId: 'LAMP',
      word: 'small',
    });
  });

  it('should report both missing synonyms and adjectives for the same object', () => {
    const objects: TsObjectDef[] = [
      {
        id: 'SWORD',
        synonyms: ['sword', 'blade', 'weapon'],
        adjectives: ['elvish', 'glowing'],
      },
    ];

    const vocab: TsVocabulary = {
      nouns: new Set(['sword']), // missing 'blade', 'weapon'
      adjectives: new Set(['elvish']), // missing 'glowing'
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = crossReferenceObjects(objects, vocab);

    expect(report.objectSynonymsMissing).toHaveLength(2);
    expect(report.objectAdjectivesMissing).toHaveLength(1);

    // Check specific missing words
    const missingSynonyms = report.objectSynonymsMissing.map((m) => m.word);
    expect(missingSynonyms).toContain('blade');
    expect(missingSynonyms).toContain('weapon');

    expect(report.objectAdjectivesMissing[0].word).toBe('glowing');
  });

  it('should handle multiple objects with missing words', () => {
    const objects: TsObjectDef[] = [
      {
        id: 'LAMP',
        synonyms: ['lamp', 'lantern'],
        adjectives: ['brass'],
      },
      {
        id: 'SWORD',
        synonyms: ['sword', 'blade'],
        adjectives: ['elvish'],
      },
    ];

    const vocab: TsVocabulary = {
      nouns: new Set(['lamp', 'sword']), // missing 'lantern', 'blade'
      adjectives: new Set(['brass']), // missing 'elvish'
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = crossReferenceObjects(objects, vocab);

    expect(report.objectSynonymsMissing).toHaveLength(2);
    expect(report.objectAdjectivesMissing).toHaveLength(1);

    // Verify object IDs are reported correctly
    const lampMissing = report.objectSynonymsMissing.find((m) => m.objectId === 'LAMP');
    expect(lampMissing?.word).toBe('lantern');

    const swordMissing = report.objectSynonymsMissing.find((m) => m.objectId === 'SWORD');
    expect(swordMissing?.word).toBe('blade');

    expect(report.objectAdjectivesMissing[0].objectId).toBe('SWORD');
    expect(report.objectAdjectivesMissing[0].word).toBe('elvish');
  });

  it('should return empty report when all words are in vocabulary', () => {
    const objects: TsObjectDef[] = [
      {
        id: 'LAMP',
        synonyms: ['lamp', 'lantern', 'light'],
        adjectives: ['brass', 'small'],
      },
      {
        id: 'SWORD',
        synonyms: ['sword', 'blade'],
        adjectives: ['elvish'],
      },
    ];

    const vocab: TsVocabulary = {
      nouns: new Set(['lamp', 'lantern', 'light', 'sword', 'blade']),
      adjectives: new Set(['brass', 'small', 'elvish']),
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = crossReferenceObjects(objects, vocab);

    expect(report.objectSynonymsMissing).toHaveLength(0);
    expect(report.objectAdjectivesMissing).toHaveLength(0);
  });

  it('should handle objects with empty synonyms and adjectives', () => {
    const objects: TsObjectDef[] = [
      {
        id: 'EMPTY_OBJECT',
        synonyms: [],
        adjectives: [],
      },
    ];

    const vocab: TsVocabulary = {
      nouns: new Set(['lamp']),
      adjectives: new Set(['brass']),
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = crossReferenceObjects(objects, vocab);

    expect(report.objectSynonymsMissing).toHaveLength(0);
    expect(report.objectAdjectivesMissing).toHaveLength(0);
  });

  it('should handle empty objects array', () => {
    const objects: TsObjectDef[] = [];

    const vocab: TsVocabulary = {
      nouns: new Set(['lamp']),
      adjectives: new Set(['brass']),
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = crossReferenceObjects(objects, vocab);

    expect(report.objectSynonymsMissing).toHaveLength(0);
    expect(report.objectAdjectivesMissing).toHaveLength(0);
  });

  it('should normalize words to lowercase for comparison', () => {
    const objects: TsObjectDef[] = [
      {
        id: 'LAMP',
        synonyms: ['LAMP', 'Lantern', 'LIGHT'],
        adjectives: ['BRASS', 'Small'],
      },
    ];

    const vocab: TsVocabulary = {
      nouns: new Set(['lamp', 'light']), // lowercase, missing 'lantern'
      adjectives: new Set(['brass']), // lowercase, missing 'small'
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = crossReferenceObjects(objects, vocab);

    expect(report.objectSynonymsMissing).toHaveLength(1);
    expect(report.objectSynonymsMissing[0].word).toBe('lantern'); // normalized to lowercase

    expect(report.objectAdjectivesMissing).toHaveLength(1);
    expect(report.objectAdjectivesMissing[0].word).toBe('small'); // normalized to lowercase
  });

  it('should sort results by object ID then by word', () => {
    const objects: TsObjectDef[] = [
      {
        id: 'ZEBRA',
        synonyms: ['zebra', 'animal'],
        adjectives: [],
      },
      {
        id: 'APPLE',
        synonyms: ['apple', 'fruit'],
        adjectives: [],
      },
    ];

    const vocab: TsVocabulary = {
      nouns: new Set(), // all missing
      adjectives: new Set(),
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = crossReferenceObjects(objects, vocab);

    // Should be sorted by objectId first (APPLE before ZEBRA)
    expect(report.objectSynonymsMissing[0].objectId).toBe('APPLE');
    expect(report.objectSynonymsMissing[1].objectId).toBe('APPLE');
    expect(report.objectSynonymsMissing[2].objectId).toBe('ZEBRA');
    expect(report.objectSynonymsMissing[3].objectId).toBe('ZEBRA');

    // Within same objectId, should be sorted by word
    expect(report.objectSynonymsMissing[0].word).toBe('apple');
    expect(report.objectSynonymsMissing[1].word).toBe('fruit');
    expect(report.objectSynonymsMissing[2].word).toBe('animal');
    expect(report.objectSynonymsMissing[3].word).toBe('zebra');
  });

  it('should not populate missingInTs or extraInTs fields', () => {
    const objects: TsObjectDef[] = [
      {
        id: 'LAMP',
        synonyms: ['lamp', 'lantern'],
        adjectives: ['brass'],
      },
    ];

    const vocab: TsVocabulary = {
      nouns: new Set(['lamp']),
      adjectives: new Set(),
      verbs: new Set(),
      prepositions: new Set(),
      directions: new Set(),
      articles: new Set(),
      pronouns: new Set(),
      conjunctions: new Set(),
    };

    const report = crossReferenceObjects(objects, vocab);

    // crossReferenceObjects should only populate object-related fields
    expect(report.missingInTs).toHaveLength(0);
    expect(report.extraInTs).toHaveLength(0);
  });
});
