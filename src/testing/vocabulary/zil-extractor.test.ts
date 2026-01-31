/**
 * Unit tests for ZIL Vocabulary Extractor
 *
 * Tests the parsing functions for SYNONYM, ADJECTIVE, and BUZZ definitions.
 */

import { describe, it, expect } from 'vitest';
import {
  parseZilSynonym,
  parseZilAdjective,
  parseZilBuzz,
  parseZilDirections,
  parseZilObject,
  normalizeZilWord,
  isZilComment,
} from './zil-extractor';

describe('ZIL Vocabulary Extractor', () => {
  describe('parseZilSynonym', () => {
    it('should parse parentheses syntax SYNONYM definitions', () => {
      const line = '(SYNONYM LAMP LANTERN LIGHT)';
      const result = parseZilSynonym(line);
      expect(result).toEqual(['lamp', 'lantern', 'light']);
    });

    it('should parse angle bracket syntax SYNONYM definitions', () => {
      const line = '<SYNONYM ATTACK FIGHT HURT INJURE HIT>';
      const result = parseZilSynonym(line);
      expect(result).toEqual(['attack', 'fight', 'hurt', 'injure', 'hit']);
    });

    it('should parse single-word SYNONYM definitions', () => {
      const line = '(SYNONYM CHIMNEY)';
      const result = parseZilSynonym(line);
      expect(result).toEqual(['chimney']);
    });

    it('should handle SYNONYM with tabs and extra whitespace', () => {
      const line = '\t(SYNONYM BOARDS BOARD)';
      const result = parseZilSynonym(line);
      expect(result).toEqual(['boards', 'board']);
    });

    it('should return empty array for lines without SYNONYM', () => {
      const line = '(DESC "brass lantern")';
      const result = parseZilSynonym(line);
      expect(result).toEqual([]);
    });

    it('should handle direction synonyms', () => {
      const line = '<SYNONYM NORTH N>';
      const result = parseZilSynonym(line);
      expect(result).toEqual(['north', 'n']);
    });

    it('should handle preposition synonyms', () => {
      const line = '<SYNONYM WITH USING THROUGH THRU>';
      const result = parseZilSynonym(line);
      expect(result).toEqual(['with', 'using', 'through', 'thru']);
    });

    it('should handle SYNONYM with inline comments', () => {
      // ZIL uses ; for comments
      const line = '(SYNONYM TREE BRANCH) ;large tree';
      const result = parseZilSynonym(line);
      expect(result).toEqual(['tree', 'branch']);
    });

    it('should handle SYNONYM with string comments', () => {
      // ZIL uses ;"..." for string comments inside definitions
      const line = '(ADJECTIVE LARGE STORM ;"-TOSSED")';
      // This is actually an ADJECTIVE, not SYNONYM
      const result = parseZilSynonym(line);
      expect(result).toEqual([]);
    });
  });

  describe('parseZilAdjective', () => {
    it('should parse ADJECTIVE definitions', () => {
      const line = '(ADJECTIVE BRASS SMALL)';
      const result = parseZilAdjective(line);
      expect(result).toEqual(['brass', 'small']);
    });

    it('should parse single adjective', () => {
      const line = '(ADJECTIVE GRANITE)';
      const result = parseZilAdjective(line);
      expect(result).toEqual(['granite']);
    });

    it('should parse multiple adjectives', () => {
      const line = '(ADJECTIVE WHITE BEAUTI COLONI)';
      const result = parseZilAdjective(line);
      expect(result).toEqual(['white', 'beauti', 'coloni']);
    });

    it('should handle ADJECTIVE with inline comments', () => {
      const line = '(ADJECTIVE LARGE STORM ;"-TOSSED")';
      const result = parseZilAdjective(line);
      expect(result).toEqual(['large', 'storm']);
    });

    it('should return empty array for lines without ADJECTIVE', () => {
      const line = '(SYNONYM LAMP LANTERN)';
      const result = parseZilAdjective(line);
      expect(result).toEqual([]);
    });

    it('should handle many adjectives', () => {
      const line = '(ADJECTIVE SHARP EGYPTIAN ANCIENT ENAMELED)';
      const result = parseZilAdjective(line);
      expect(result).toEqual(['sharp', 'egyptian', 'ancient', 'enameled']);
    });
  });

  describe('parseZilBuzz', () => {
    it('should parse BUZZ definitions', () => {
      const line = '<BUZZ A AN THE IS>';
      const result = parseZilBuzz(line);
      expect(result).toEqual(['a', 'an', 'the', 'is']);
    });

    it('should parse BUZZ with many words', () => {
      const line =
        '<BUZZ A AN THE IS AND OF THEN ALL ONE BUT EXCEPT \\. \\, \\" YES NO Y HERE>';
      const result = parseZilBuzz(line);
      // Should filter out escaped punctuation
      expect(result).toContain('a');
      expect(result).toContain('an');
      expect(result).toContain('the');
      expect(result).toContain('yes');
      expect(result).toContain('no');
      expect(result).toContain('here');
      // Should not contain escaped punctuation
      expect(result).not.toContain('\\.');
      expect(result).not.toContain('.');
    });

    it('should parse BUZZ with game commands', () => {
      const line = '<BUZZ AGAIN G OOPS>';
      const result = parseZilBuzz(line);
      expect(result).toEqual(['again', 'g', 'oops']);
    });

    it('should return empty array for lines without BUZZ', () => {
      const line = '<SYNONYM NORTH N>';
      const result = parseZilBuzz(line);
      expect(result).toEqual([]);
    });
  });

  describe('parseZilDirections', () => {
    it('should parse DIRECTIONS definitions', () => {
      const line =
        '<DIRECTIONS NORTH EAST WEST SOUTH NE NW SE SW UP DOWN IN OUT LAND>';
      const result = parseZilDirections(line);
      expect(result).toContain('north');
      expect(result).toContain('east');
      expect(result).toContain('west');
      expect(result).toContain('south');
      expect(result).toContain('up');
      expect(result).toContain('down');
    });

    it('should return empty array for lines without DIRECTIONS', () => {
      const line = '<BUZZ A AN THE>';
      const result = parseZilDirections(line);
      expect(result).toEqual([]);
    });
  });

  describe('normalizeZilWord', () => {
    it('should convert to lowercase', () => {
      expect(normalizeZilWord('LAMP')).toBe('lamp');
      expect(normalizeZilWord('Lantern')).toBe('lantern');
    });

    it('should handle escaped special characters', () => {
      // FCD\#3 should become fcd#3
      expect(normalizeZilWord('FCD\\#3')).toBe('fcd#3');
      // TRAP\-DOOR should become trap-door
      expect(normalizeZilWord('TRAP\\-DOOR')).toBe('trap-door');
    });

    it('should preserve hyphens', () => {
      expect(normalizeZilWord('TRAP-DOOR')).toBe('trap-door');
    });
  });

  describe('parseZilObject', () => {
    it('should parse a complete object definition', () => {
      const objectBlock = `<OBJECT LAMP
        (IN LIVING-ROOM)
        (SYNONYM LAMP LANTERN LIGHT)
        (ADJECTIVE BRASS)
        (DESC "brass lantern")
        (FLAGS TAKEBIT LIGHTBIT)>`;

      const result = parseZilObject(objectBlock);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('LAMP');
      expect(result!.synonyms).toEqual(['lamp', 'lantern', 'light']);
      expect(result!.adjectives).toEqual(['brass']);
    });

    it('should parse object with multiple adjectives', () => {
      const objectBlock = `<OBJECT WHITE-HOUSE
        (IN LOCAL-GLOBALS)
        (SYNONYM HOUSE)
        (ADJECTIVE WHITE BEAUTI COLONI)
        (DESC "white house")>`;

      const result = parseZilObject(objectBlock);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('WHITE-HOUSE');
      expect(result!.synonyms).toEqual(['house']);
      expect(result!.adjectives).toEqual(['white', 'beauti', 'coloni']);
    });

    it('should parse object without adjectives', () => {
      const objectBlock = `<OBJECT FOREST
        (IN LOCAL-GLOBALS)
        (SYNONYM FOREST TREES PINES HEMLOCKS)
        (DESC "forest")>`;

      const result = parseZilObject(objectBlock);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('FOREST');
      expect(result!.synonyms).toEqual(['forest', 'trees', 'pines', 'hemlocks']);
      expect(result!.adjectives).toEqual([]);
    });

    it('should return null for non-object content', () => {
      const content = '<ROOM WEST-OF-HOUSE (IN ROOMS)>';
      const result = parseZilObject(content);
      expect(result).toBeNull();
    });

    it('should handle object with special characters in synonyms', () => {
      const objectBlock = `<OBJECT DAM
        (IN DAM-ROOM)
        (SYNONYM DAM GATE GATES FCD\\#3)
        (DESC "dam")>`;

      const result = parseZilObject(objectBlock);
      expect(result).not.toBeNull();
      expect(result!.synonyms).toContain('fcd#3');
    });
  });

  describe('isZilComment', () => {
    it('should identify comment lines', () => {
      expect(isZilComment(';This is a comment')).toBe(true);
      expect(isZilComment('  ; indented comment')).toBe(true);
    });

    it('should identify string header lines', () => {
      expect(isZilComment('"SUBTITLE OBJECTS"')).toBe(true);
    });

    it('should not identify code lines as comments', () => {
      expect(isZilComment('<OBJECT LAMP')).toBe(false);
      expect(isZilComment('(SYNONYM LAMP LANTERN)')).toBe(false);
    });
  });
});


// Import the new function for testing
import {
  extractZilVocabulary,
  createEmptyZilVocabulary,
  DEFAULT_ZIL_FILES,
  DEFAULT_ZIL_PATH,
} from './zil-extractor';
import * as fs from 'fs';
import * as path from 'path';

describe('extractZilVocabulary', () => {
  it('should extract vocabulary from actual ZIL files', () => {
    // This test uses the actual ZIL files in reference/zil/
    const vocabulary = extractZilVocabulary();

    // Verify nouns were extracted (from object SYNONYM definitions)
    expect(vocabulary.nouns.size).toBeGreaterThan(0);
    expect(vocabulary.nouns.has('lamp')).toBe(true);
    expect(vocabulary.nouns.has('lantern')).toBe(true);
    expect(vocabulary.nouns.has('chimney')).toBe(true);
    expect(vocabulary.nouns.has('house')).toBe(true);
    expect(vocabulary.nouns.has('forest')).toBe(true);

    // Verify adjectives were extracted
    expect(vocabulary.adjectives.size).toBeGreaterThan(0);
    expect(vocabulary.adjectives.has('brass')).toBe(true);
    expect(vocabulary.adjectives.has('white')).toBe(true);

    // Verify verbs were extracted from gsyntax.zil
    expect(vocabulary.verbs.size).toBeGreaterThan(0);
    expect(vocabulary.verbs.has('take')).toBe(true);
    expect(vocabulary.verbs.has('drop')).toBe(true);
    expect(vocabulary.verbs.has('look')).toBe(true);
    expect(vocabulary.verbs.has('open')).toBe(true);

    // Verify buzz words were extracted
    expect(vocabulary.buzzWords.size).toBeGreaterThan(0);
    expect(vocabulary.buzzWords.has('a')).toBe(true);
    expect(vocabulary.buzzWords.has('an')).toBe(true);
    expect(vocabulary.buzzWords.has('the')).toBe(true);

    // Verify directions were extracted
    expect(vocabulary.directions.size).toBeGreaterThan(0);
    expect(vocabulary.directions.has('north')).toBe(true);
    expect(vocabulary.directions.has('south')).toBe(true);
    expect(vocabulary.directions.has('up')).toBe(true);
    expect(vocabulary.directions.has('down')).toBe(true);
  });

  it('should extract verb synonyms from gsyntax.zil', () => {
    const vocabulary = extractZilVocabulary();

    // Verb synonyms from gsyntax.zil
    // <SYNONYM ATTACK FIGHT HURT INJURE HIT>
    expect(vocabulary.verbs.has('attack')).toBe(true);
    expect(vocabulary.verbs.has('fight')).toBe(true);
    expect(vocabulary.verbs.has('hurt')).toBe(true);

    // <SYNONYM TAKE GET HOLD CARRY REMOVE GRAB CATCH>
    expect(vocabulary.verbs.has('get')).toBe(true);
    expect(vocabulary.verbs.has('hold')).toBe(true);
    expect(vocabulary.verbs.has('carry')).toBe(true);
  });

  it('should extract preposition synonyms from gsyntax.zil', () => {
    const vocabulary = extractZilVocabulary();

    // Preposition synonyms from gsyntax.zil
    // <SYNONYM WITH USING THROUGH THRU>
    expect(vocabulary.prepositions.has('with')).toBe(true);
    expect(vocabulary.prepositions.has('using')).toBe(true);
    expect(vocabulary.prepositions.has('through')).toBe(true);
    expect(vocabulary.prepositions.has('thru')).toBe(true);

    // <SYNONYM IN INSIDE INTO>
    expect(vocabulary.prepositions.has('in')).toBe(true);
    expect(vocabulary.prepositions.has('inside')).toBe(true);
    expect(vocabulary.prepositions.has('into')).toBe(true);

    // <SYNONYM UNDER UNDERNEATH BENEATH BELOW>
    expect(vocabulary.prepositions.has('under')).toBe(true);
    expect(vocabulary.prepositions.has('underneath')).toBe(true);
    expect(vocabulary.prepositions.has('beneath')).toBe(true);
    expect(vocabulary.prepositions.has('below')).toBe(true);
  });

  it('should extract direction synonyms from gsyntax.zil', () => {
    const vocabulary = extractZilVocabulary();

    // Direction synonyms from gsyntax.zil
    // <SYNONYM NORTH N>
    expect(vocabulary.directions.has('north')).toBe(true);
    expect(vocabulary.directions.has('n')).toBe(true);

    // <SYNONYM SOUTH S>
    expect(vocabulary.directions.has('south')).toBe(true);
    expect(vocabulary.directions.has('s')).toBe(true);

    // <SYNONYM DOWN D>
    expect(vocabulary.directions.has('down')).toBe(true);
    expect(vocabulary.directions.has('d')).toBe(true);
  });

  it('should handle missing files gracefully', () => {
    // Should not throw when a file doesn't exist
    const vocabulary = extractZilVocabulary(['nonexistent.zil'], DEFAULT_ZIL_PATH);

    // Should return empty vocabulary
    expect(vocabulary.nouns.size).toBe(0);
    expect(vocabulary.adjectives.size).toBe(0);
    expect(vocabulary.verbs.size).toBe(0);
  });

  it('should use default files when no arguments provided', () => {
    const vocabulary = extractZilVocabulary();

    // Should have extracted from all default files
    // Nouns from 1dungeon.zil and gglobals.zil
    expect(vocabulary.nouns.size).toBeGreaterThan(50);

    // Verbs from gsyntax.zil
    expect(vocabulary.verbs.size).toBeGreaterThan(30);
  });

  it('should extract specific known objects from 1dungeon.zil', () => {
    const vocabulary = extractZilVocabulary(['1dungeon.zil'], DEFAULT_ZIL_PATH);

    // Known objects from 1dungeon.zil
    expect(vocabulary.nouns.has('board')).toBe(true);
    expect(vocabulary.nouns.has('boards')).toBe(true);
    expect(vocabulary.nouns.has('wall')).toBe(true);
    expect(vocabulary.nouns.has('skull')).toBe(true);
    expect(vocabulary.nouns.has('bell')).toBe(true);
    expect(vocabulary.nouns.has('book')).toBe(true);
    expect(vocabulary.nouns.has('sceptre')).toBe(true);
    expect(vocabulary.nouns.has('scepter')).toBe(true);

    // Known adjectives from 1dungeon.zil
    expect(vocabulary.adjectives.has('crystal')).toBe(true);
    expect(vocabulary.adjectives.has('granite')).toBe(true);
    expect(vocabulary.adjectives.has('dark')).toBe(true);
    expect(vocabulary.adjectives.has('narrow')).toBe(true);
  });

  it('should extract global objects from gglobals.zil', () => {
    const vocabulary = extractZilVocabulary(['gglobals.zil'], DEFAULT_ZIL_PATH);

    // Known objects from gglobals.zil
    expect(vocabulary.nouns.has('stairs')).toBe(true);
    expect(vocabulary.nouns.has('steps')).toBe(true);
    expect(vocabulary.nouns.has('staircase')).toBe(true);
    expect(vocabulary.nouns.has('ground')).toBe(true);
    expect(vocabulary.nouns.has('floor')).toBe(true);
    expect(vocabulary.nouns.has('grue')).toBe(true);
    expect(vocabulary.nouns.has('sailor')).toBe(true);

    // Known adjectives from gglobals.zil
    expect(vocabulary.adjectives.has('stone')).toBe(true);
    expect(vocabulary.adjectives.has('lurking')).toBe(true);
    expect(vocabulary.adjectives.has('sinister')).toBe(true);
  });
});

describe('createEmptyZilVocabulary', () => {
  it('should create an empty vocabulary with all sets', () => {
    const vocabulary = createEmptyZilVocabulary();

    expect(vocabulary.nouns).toBeInstanceOf(Set);
    expect(vocabulary.adjectives).toBeInstanceOf(Set);
    expect(vocabulary.verbs).toBeInstanceOf(Set);
    expect(vocabulary.prepositions).toBeInstanceOf(Set);
    expect(vocabulary.buzzWords).toBeInstanceOf(Set);
    expect(vocabulary.directions).toBeInstanceOf(Set);

    expect(vocabulary.nouns.size).toBe(0);
    expect(vocabulary.adjectives.size).toBe(0);
    expect(vocabulary.verbs.size).toBe(0);
    expect(vocabulary.prepositions.size).toBe(0);
    expect(vocabulary.buzzWords.size).toBe(0);
    expect(vocabulary.directions.size).toBe(0);
  });
});
