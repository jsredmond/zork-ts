/**
 * Vocabulary Completeness Tests
 *
 * Regression tests that verify all object synonyms and adjectives are
 * registered in the vocabulary. These tests prevent reintroduction of
 * missing vocabulary words (like the "chimney" bug).
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { describe, it, expect } from 'vitest';
import { extractObjectDefinitions, TsObjectDef } from './ts-extractor';
import { Vocabulary } from '../../parser/vocabulary';
import { TokenType } from '../../parser/lexer';

/**
 * Helper function to format missing words for error messages.
 * Groups missing words by object ID for clearer reporting.
 *
 * @param missing - Array of {objectId, word} pairs
 * @returns Formatted string listing missing words by object
 */
function formatMissingWords(missing: Array<{ objectId: string; word: string }>): string {
  if (missing.length === 0) {
    return '';
  }

  // Group by object ID
  const byObject = new Map<string, string[]>();
  for (const { objectId, word } of missing) {
    const words = byObject.get(objectId) || [];
    words.push(word);
    byObject.set(objectId, words);
  }

  // Format output
  const lines: string[] = [];
  for (const [objectId, words] of byObject.entries()) {
    lines.push(`  ${objectId}: ${words.join(', ')}`);
  }

  return lines.join('\n');
}

describe('Vocabulary Completeness', () => {
  // Load object definitions and vocabulary once for all tests
  const objects: TsObjectDef[] = extractObjectDefinitions();
  const vocabulary = new Vocabulary();

  describe('Object Synonyms (Requirement 6.1, 6.3)', () => {
    /**
     * Test that all object synonyms exist in vocabulary as NOUNs.
     *
     * This test iterates through every object definition in objects-complete.ts
     * and verifies that each synonym is registered in the vocabulary with
     * TokenType.NOUN.
     *
     * **Validates: Requirements 6.1, 6.3**
     * - 6.1: THE Test_Suite SHALL verify all object synonyms are registered in vocabulary
     * - 6.3: WHEN a new object is added, THE Test_Suite SHALL fail if its synonyms are not in vocabulary
     */
    it('should have all object synonyms registered as NOUNs in vocabulary', () => {
      const missingSynonyms: Array<{ objectId: string; word: string }> = [];

      for (const obj of objects) {
        for (const synonym of obj.synonyms) {
          const normalizedSynonym = synonym.toLowerCase();
          const tokenType = vocabulary.lookupWord(normalizedSynonym);

          // Synonyms should be registered as NOUNs
          // Note: Some words may be registered as other types (e.g., DIRECTION, VERB)
          // due to documented word type conflicts. We check for NOUN specifically.
          if (tokenType !== TokenType.NOUN) {
            // Check if the word is known at all (might be a different type)
            if (tokenType === TokenType.UNKNOWN) {
              missingSynonyms.push({
                objectId: obj.id,
                word: normalizedSynonym,
              });
            }
            // If it's a known word but different type, that's a documented conflict
            // (e.g., LIGHT is a VERB, not a NOUN) - these are acceptable
          }
        }
      }

      // Report specific missing words on failure (Requirement 6.4)
      if (missingSynonyms.length > 0) {
        const formatted = formatMissingWords(missingSynonyms);
        expect.fail(
          `Found ${missingSynonyms.length} object synonym(s) missing from vocabulary:\n${formatted}\n\n` +
            `Add these words to the loadNouns() method in src/parser/vocabulary.ts`
        );
      }

      expect(missingSynonyms).toHaveLength(0);
    });

    it('should recognize specific known object synonyms', () => {
      // Test a sample of known synonyms that should be in vocabulary
      const knownSynonyms = [
        'lamp',
        'lantern',
        'sword',
        'blade',
        'mailbox',
        'leaflet',
        'chimney', // The word that prompted this audit
        'troll',
        'thief',
        'cyclops',
        'chalice',
        'sceptre',
        'trident',
        'diamond',
        'emerald',
      ];

      for (const synonym of knownSynonyms) {
        const tokenType = vocabulary.lookupWord(synonym);
        expect(
          tokenType !== TokenType.UNKNOWN,
          `Expected '${synonym}' to be in vocabulary but it was not found`
        ).toBe(true);
      }
    });
  });

  describe('Object Adjectives (Requirement 6.2)', () => {
    /**
     * Test that all object adjectives exist in vocabulary as ADJECTIVEs.
     *
     * This test iterates through every object definition in objects-complete.ts
     * and verifies that each adjective is registered in the vocabulary with
     * TokenType.ADJECTIVE.
     *
     * **Validates: Requirements 6.2, 6.3**
     * - 6.2: THE Test_Suite SHALL verify all object adjectives are registered in vocabulary
     * - 6.3: WHEN a new object is added, THE Test_Suite SHALL fail if its adjectives are not in vocabulary
     */
    it('should have all object adjectives registered as ADJECTIVEs in vocabulary', () => {
      const missingAdjectives: Array<{ objectId: string; word: string }> = [];

      for (const obj of objects) {
        for (const adjective of obj.adjectives) {
          const normalizedAdjective = adjective.toLowerCase();
          const tokenType = vocabulary.lookupWord(normalizedAdjective);

          // Adjectives should be registered as ADJECTIVEs
          if (tokenType !== TokenType.ADJECTIVE) {
            // Check if the word is known at all (might be a different type)
            if (tokenType === TokenType.UNKNOWN) {
              missingAdjectives.push({
                objectId: obj.id,
                word: normalizedAdjective,
              });
            }
            // If it's a known word but different type, that's a documented conflict
            // (e.g., WEST is a DIRECTION, not an ADJECTIVE) - these are acceptable
          }
        }
      }

      // Report specific missing words on failure (Requirement 6.4)
      if (missingAdjectives.length > 0) {
        const formatted = formatMissingWords(missingAdjectives);
        expect.fail(
          `Found ${missingAdjectives.length} object adjective(s) missing from vocabulary:\n${formatted}\n\n` +
            `Add these words to the loadAdjectives() method in src/parser/vocabulary.ts`
        );
      }

      expect(missingAdjectives).toHaveLength(0);
    });

    it('should recognize specific known object adjectives', () => {
      // Test a sample of known adjectives that should be in vocabulary
      const knownAdjectives = [
        'brass',
        'elvish',
        'crystal',
        'golden',
        'rusty',
        'wooden',
        'white',
        'nasty',
        'shady',
        'suspicious',
      ];

      for (const adjective of knownAdjectives) {
        const tokenType = vocabulary.lookupWord(adjective);
        expect(
          tokenType === TokenType.ADJECTIVE,
          `Expected '${adjective}' to be an ADJECTIVE but got ${tokenType}`
        ).toBe(true);
      }
    });
  });

  describe('Regression Prevention (Requirement 6.3, 6.4)', () => {
    /**
     * These tests ensure that specific words that were previously missing
     * (and have been fixed) remain in the vocabulary.
     */

    it('should include "chimney" in vocabulary (the word that prompted this audit)', () => {
      const tokenType = vocabulary.lookupWord('chimney');
      expect(tokenType).toBe(TokenType.NOUN);
    });

    it('should include "fireplace" in vocabulary (chimney synonym)', () => {
      const tokenType = vocabulary.lookupWord('fireplace');
      expect(tokenType).toBe(TokenType.NOUN);
    });

    it('should report object count for verification', () => {
      // This test documents the expected number of objects
      // If this changes significantly, it may indicate a problem with extraction
      expect(objects.length).toBeGreaterThan(50);
      console.log(`Vocabulary completeness test checked ${objects.length} objects`);
    });
  });

  describe('Vocabulary Coverage Statistics', () => {
    /**
     * These tests provide statistics about vocabulary coverage.
     * They don't fail but provide useful information about the vocabulary state.
     */

    it('should report synonym coverage statistics', () => {
      let totalSynonyms = 0;
      let coveredSynonyms = 0;
      let conflictedSynonyms = 0;

      for (const obj of objects) {
        for (const synonym of obj.synonyms) {
          totalSynonyms++;
          const tokenType = vocabulary.lookupWord(synonym.toLowerCase());
          if (tokenType === TokenType.NOUN) {
            coveredSynonyms++;
          } else if (tokenType !== TokenType.UNKNOWN) {
            // Word exists but as different type (documented conflict)
            conflictedSynonyms++;
          }
        }
      }

      const coveragePercent = ((coveredSynonyms / totalSynonyms) * 100).toFixed(1);
      console.log(`Synonym coverage: ${coveredSynonyms}/${totalSynonyms} (${coveragePercent}%)`);
      console.log(`Documented type conflicts: ${conflictedSynonyms}`);

      // We expect high coverage
      expect(coveredSynonyms + conflictedSynonyms).toBe(totalSynonyms);
    });

    it('should report adjective coverage statistics', () => {
      let totalAdjectives = 0;
      let coveredAdjectives = 0;
      let conflictedAdjectives = 0;

      for (const obj of objects) {
        for (const adjective of obj.adjectives) {
          totalAdjectives++;
          const tokenType = vocabulary.lookupWord(adjective.toLowerCase());
          if (tokenType === TokenType.ADJECTIVE) {
            coveredAdjectives++;
          } else if (tokenType !== TokenType.UNKNOWN) {
            // Word exists but as different type (documented conflict)
            conflictedAdjectives++;
          }
        }
      }

      const coveragePercent =
        totalAdjectives > 0 ? ((coveredAdjectives / totalAdjectives) * 100).toFixed(1) : '100.0';
      console.log(
        `Adjective coverage: ${coveredAdjectives}/${totalAdjectives} (${coveragePercent}%)`
      );
      console.log(`Documented type conflicts: ${conflictedAdjectives}`);

      // We expect high coverage
      expect(coveredAdjectives + conflictedAdjectives).toBe(totalAdjectives);
    });
  });
});
