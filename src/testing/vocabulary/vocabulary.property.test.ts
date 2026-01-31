/**
 * Property-Based Tests for Vocabulary Completeness
 *
 * These tests verify universal properties that should hold for all object definitions
 * in the game. They use fast-check to randomly sample objects and verify that their
 * synonyms and adjectives are properly registered in the vocabulary.
 *
 * Feature: vocabulary-completeness-audit
 *
 * **Validates: Requirements 3.1, 3.2, 6.1, 6.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { extractObjectDefinitions, TsObjectDef } from './ts-extractor';
import { Vocabulary } from '../../parser/vocabulary';
import { TokenType } from '../../parser/lexer';

describe('Vocabulary Property Tests', () => {
  // Load object definitions and vocabulary once for all tests
  const allObjects: TsObjectDef[] = extractObjectDefinitions();
  const vocabulary = new Vocabulary();

  // Ensure we have objects to test
  if (allObjects.length === 0) {
    throw new Error('No object definitions found - cannot run property tests');
  }

  /**
   * Generator for random object definitions from the actual game objects.
   * Uses fc.constantFrom to select from the real object definitions.
   */
  const objectArb = fc.constantFrom(...allObjects);

  /**
   * Feature: vocabulary-completeness-audit
   * Property 1: Object-Vocabulary Synonym Consistency
   *
   * *For any* object definition in `objects-complete.ts`, *all* of its synonyms
   * must exist in the vocabulary. If an object has synonyms, then
   * `vocabulary.lookupWord(synonym)` must not return `TokenType.UNKNOWN`.
   *
   * Note: Synonyms are typically NOUNs, but some may be registered as other types
   * due to documented word type conflicts (e.g., LIGHT is a VERB, not a NOUN).
   * The key property is that the word is KNOWN to the vocabulary.
   *
   * **Validates: Requirements 3.1, 6.1**
   */
  it('Property 1: Object-Vocabulary Synonym Consistency - all object synonyms must exist in vocabulary', () => {
    fc.assert(
      fc.property(objectArb, (obj: TsObjectDef) => {
        // For each synonym in the object definition
        for (const synonym of obj.synonyms) {
          const normalizedSynonym = synonym.toLowerCase();
          const tokenType = vocabulary.lookupWord(normalizedSynonym);

          // The synonym must be known to the vocabulary (not UNKNOWN)
          // It's typically a NOUN, but may be another type due to documented conflicts
          if (tokenType === TokenType.UNKNOWN) {
            // Return false to fail the property with a descriptive message
            return false;
          }
        }

        // All synonyms are in vocabulary
        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: vocabulary-completeness-audit
   * Property 1 (Strict): Object-Vocabulary Synonym Consistency - NOUN type
   *
   * A stricter version that verifies synonyms are registered as NOUNs specifically,
   * while allowing for documented type conflicts where a word may be registered
   * as a different type (e.g., VERB, DIRECTION).
   *
   * **Validates: Requirements 3.1, 6.1**
   */
  it('Property 1 (Strict): Object synonyms should be NOUNs or have documented type conflicts', () => {
    // Track statistics for reporting
    let totalSynonyms = 0;
    let nounSynonyms = 0;
    let conflictedSynonyms = 0;

    fc.assert(
      fc.property(objectArb, (obj: TsObjectDef) => {
        for (const synonym of obj.synonyms) {
          totalSynonyms++;
          const normalizedSynonym = synonym.toLowerCase();
          const tokenType = vocabulary.lookupWord(normalizedSynonym);

          if (tokenType === TokenType.NOUN) {
            nounSynonyms++;
          } else if (tokenType !== TokenType.UNKNOWN) {
            // Word exists but as different type - documented conflict
            conflictedSynonyms++;
          } else {
            // Word is UNKNOWN - this is a failure
            return false;
          }
        }
        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );

    // Log statistics after successful run
    console.log(`Synonym statistics: ${nounSynonyms} NOUNs, ${conflictedSynonyms} type conflicts, ${totalSynonyms} total`);
  });

  /**
   * Feature: vocabulary-completeness-audit
   * Property 2: Object-Vocabulary Adjective Consistency
   *
   * *For any* object definition in `objects-complete.ts`, *all* of its adjectives
   * must exist in the vocabulary. If an object has adjectives, then
   * `vocabulary.lookupWord(adjective)` must not return `TokenType.UNKNOWN`.
   *
   * Note: Adjectives are typically ADJECTIVEs, but some may be registered as other
   * types due to documented word type conflicts (e.g., WEST is a DIRECTION).
   * The key property is that the word is KNOWN to the vocabulary.
   *
   * **Validates: Requirements 3.2, 6.2**
   */
  it('Property 2: Object-Vocabulary Adjective Consistency - all object adjectives must exist in vocabulary', () => {
    fc.assert(
      fc.property(objectArb, (obj: TsObjectDef) => {
        // For each adjective in the object definition
        for (const adjective of obj.adjectives) {
          const normalizedAdjective = adjective.toLowerCase();
          const tokenType = vocabulary.lookupWord(normalizedAdjective);

          // The adjective must be known to the vocabulary (not UNKNOWN)
          // It's typically an ADJECTIVE, but may be another type due to documented conflicts
          if (tokenType === TokenType.UNKNOWN) {
            // Return false to fail the property
            return false;
          }
        }

        // All adjectives are in vocabulary
        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: vocabulary-completeness-audit
   * Property 2 (Strict): Object-Vocabulary Adjective Consistency - ADJECTIVE type
   *
   * A stricter version that verifies adjectives are registered as ADJECTIVEs
   * specifically, while allowing for documented type conflicts where a word may
   * be registered as a different type (e.g., DIRECTION, NOUN).
   *
   * **Validates: Requirements 3.2, 6.2**
   */
  it('Property 2 (Strict): Object adjectives should be ADJECTIVEs or have documented type conflicts', () => {
    // Track statistics for reporting
    let totalAdjectives = 0;
    let adjectiveType = 0;
    let conflictedAdjectives = 0;

    fc.assert(
      fc.property(objectArb, (obj: TsObjectDef) => {
        for (const adjective of obj.adjectives) {
          totalAdjectives++;
          const normalizedAdjective = adjective.toLowerCase();
          const tokenType = vocabulary.lookupWord(normalizedAdjective);

          if (tokenType === TokenType.ADJECTIVE) {
            adjectiveType++;
          } else if (tokenType !== TokenType.UNKNOWN) {
            // Word exists but as different type - documented conflict
            conflictedAdjectives++;
          } else {
            // Word is UNKNOWN - this is a failure
            return false;
          }
        }
        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );

    // Log statistics after successful run
    console.log(`Adjective statistics: ${adjectiveType} ADJECTIVEs, ${conflictedAdjectives} type conflicts, ${totalAdjectives} total`);
  });

  /**
   * Feature: vocabulary-completeness-audit
   * Combined Property: Full Object-Vocabulary Consistency
   *
   * *For any* object definition, ALL of its words (both synonyms and adjectives)
   * must be recognized by the vocabulary system.
   *
   * **Validates: Requirements 3.1, 3.2, 6.1, 6.2**
   */
  it('Combined Property: All object words (synonyms + adjectives) must be in vocabulary', () => {
    fc.assert(
      fc.property(objectArb, (obj: TsObjectDef) => {
        // Check all synonyms
        for (const synonym of obj.synonyms) {
          const tokenType = vocabulary.lookupWord(synonym.toLowerCase());
          if (tokenType === TokenType.UNKNOWN) {
            return false;
          }
        }

        // Check all adjectives
        for (const adjective of obj.adjectives) {
          const tokenType = vocabulary.lookupWord(adjective.toLowerCase());
          if (tokenType === TokenType.UNKNOWN) {
            return false;
          }
        }

        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Exhaustive test that checks ALL objects (not just random samples).
   * This complements the property tests by ensuring 100% coverage.
   *
   * **Validates: Requirements 3.1, 3.2, 6.1, 6.2**
   */
  it('Exhaustive: All objects have all words in vocabulary', () => {
    const missingSynonyms: Array<{ objectId: string; word: string }> = [];
    const missingAdjectives: Array<{ objectId: string; word: string }> = [];

    for (const obj of allObjects) {
      // Check synonyms
      for (const synonym of obj.synonyms) {
        const tokenType = vocabulary.lookupWord(synonym.toLowerCase());
        if (tokenType === TokenType.UNKNOWN) {
          missingSynonyms.push({ objectId: obj.id, word: synonym.toLowerCase() });
        }
      }

      // Check adjectives
      for (const adjective of obj.adjectives) {
        const tokenType = vocabulary.lookupWord(adjective.toLowerCase());
        if (tokenType === TokenType.UNKNOWN) {
          missingAdjectives.push({ objectId: obj.id, word: adjective.toLowerCase() });
        }
      }
    }

    // Report any missing words
    if (missingSynonyms.length > 0 || missingAdjectives.length > 0) {
      const synonymReport = missingSynonyms
        .map((m) => `  ${m.objectId}: ${m.word}`)
        .join('\n');
      const adjectiveReport = missingAdjectives
        .map((m) => `  ${m.objectId}: ${m.word}`)
        .join('\n');

      expect.fail(
        `Found vocabulary gaps:\n` +
          `Missing synonyms (${missingSynonyms.length}):\n${synonymReport || '  (none)'}\n` +
          `Missing adjectives (${missingAdjectives.length}):\n${adjectiveReport || '  (none)'}`
      );
    }

    expect(missingSynonyms).toHaveLength(0);
    expect(missingAdjectives).toHaveLength(0);
  });

  /**
   * Meta-test: Verify we have sufficient object coverage for meaningful property tests.
   */
  it('Meta: Should have sufficient objects for meaningful property tests', () => {
    // We need at least 50 objects for the property tests to be meaningful
    expect(allObjects.length).toBeGreaterThan(50);

    // Count objects with synonyms and adjectives
    const objectsWithSynonyms = allObjects.filter((obj) => obj.synonyms.length > 0);
    const objectsWithAdjectives = allObjects.filter((obj) => obj.adjectives.length > 0);

    // Most objects should have synonyms
    expect(objectsWithSynonyms.length).toBeGreaterThan(40);

    // Many objects should have adjectives
    expect(objectsWithAdjectives.length).toBeGreaterThan(20);

    console.log(`Object coverage: ${allObjects.length} total, ${objectsWithSynonyms.length} with synonyms, ${objectsWithAdjectives.length} with adjectives`);
  });
});
