/**
 * Unit tests for TypeScript Vocabulary Extractor
 *
 * Tests the extraction of vocabulary words from vocabulary.ts
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect } from 'vitest';
import {
  extractWordsFromArray,
  extractMethodBody,
  extractWordsFromLoadMethod,
  extractTsVocabulary,
  createEmptyTsVocabulary,
  getTotalWordCount,
  vocabularyToObject,
  parseObjectDefinition,
  extractObjectDefinitions,
  getAllObjectSynonyms,
  getAllObjectAdjectives,
  DEFAULT_VOCABULARY_PATH,
  DEFAULT_OBJECTS_PATH,
} from './ts-extractor';

describe('TypeScript Vocabulary Extractor', () => {
  describe('extractWordsFromArray', () => {
    it('should extract words from single-quoted array', () => {
      const arrayContent = "'LAMP', 'LANTERN', 'LIGHT'";
      const result = extractWordsFromArray(arrayContent);
      expect(result).toEqual(['lamp', 'lantern', 'light']);
    });

    it('should extract words from double-quoted array', () => {
      const arrayContent = '"LAMP", "LANTERN", "LIGHT"';
      const result = extractWordsFromArray(arrayContent);
      expect(result).toEqual(['lamp', 'lantern', 'light']);
    });

    it('should handle mixed quotes', () => {
      const arrayContent = "'LAMP', \"LANTERN\", 'LIGHT'";
      const result = extractWordsFromArray(arrayContent);
      expect(result).toEqual(['lamp', 'lantern', 'light']);
    });

    it('should handle multiline arrays', () => {
      const arrayContent = `
        'TAKE', 'GET', 'HOLD',
        'DROP', 'PUT', 'PLACE',
      `;
      const result = extractWordsFromArray(arrayContent);
      expect(result).toEqual(['take', 'get', 'hold', 'drop', 'put', 'place']);
    });

    it('should handle words with hyphens', () => {
      const arrayContent = "'TRAP-DOOR', 'LIVING-ROOM'";
      const result = extractWordsFromArray(arrayContent);
      expect(result).toEqual(['trap-door', 'living-room']);
    });

    it('should handle single word', () => {
      const arrayContent = "'LAMP'";
      const result = extractWordsFromArray(arrayContent);
      expect(result).toEqual(['lamp']);
    });

    it('should return empty array for empty content', () => {
      const result = extractWordsFromArray('');
      expect(result).toEqual([]);
    });

    it('should handle words with numbers', () => {
      const arrayContent = "'FCD#3', 'ROOM1'";
      const result = extractWordsFromArray(arrayContent);
      expect(result).toEqual(['fcd#3', 'room1']);
    });
  });

  describe('extractMethodBody', () => {
    it('should extract private method body', () => {
      const source = `
        class Test {
          private loadNouns(): void {
            const nouns = ['LAMP', 'LANTERN'];
            nouns.forEach(n => this.addWord(n));
          }
        }
      `;
      const result = extractMethodBody(source, 'loadNouns');
      expect(result).not.toBeNull();
      expect(result).toContain("const nouns = ['LAMP', 'LANTERN']");
    });

    it('should extract public method body', () => {
      const source = `
        class Test {
          loadNouns(): void {
            const nouns = ['LAMP'];
          }
        }
      `;
      const result = extractMethodBody(source, 'loadNouns');
      expect(result).not.toBeNull();
      expect(result).toContain("const nouns = ['LAMP']");
    });

    it('should handle nested braces', () => {
      const source = `
        class Test {
          private loadNouns(): void {
            const nouns = ['LAMP'];
            if (true) {
              console.log('nested');
            }
          }
          private otherMethod(): void {
            // should not be included
          }
        }
      `;
      const result = extractMethodBody(source, 'loadNouns');
      expect(result).not.toBeNull();
      expect(result).toContain("const nouns = ['LAMP']");
      expect(result).toContain('nested');
      expect(result).not.toContain('otherMethod');
    });

    it('should return null for non-existent method', () => {
      const source = `
        class Test {
          private loadNouns(): void {
            const nouns = ['LAMP'];
          }
        }
      `;
      const result = extractMethodBody(source, 'nonExistentMethod');
      expect(result).toBeNull();
    });

    it('should handle method without return type', () => {
      const source = `
        class Test {
          private loadNouns() {
            const nouns = ['LAMP'];
          }
        }
      `;
      const result = extractMethodBody(source, 'loadNouns');
      expect(result).not.toBeNull();
      expect(result).toContain("const nouns = ['LAMP']");
    });
  });

  describe('extractWordsFromLoadMethod', () => {
    it('should extract words from a typical load method', () => {
      const source = `
        class Vocabulary {
          private loadNouns(): void {
            const nouns = [
              'LAMP', 'LANTERN', 'LIGHT',
              'SWORD', 'BLADE',
            ];
            nouns.forEach(noun => this.addWord(noun, TokenType.NOUN));
          }
        }
      `;
      const result = extractWordsFromLoadMethod(source, 'loadNouns');
      expect(result.has('lamp')).toBe(true);
      expect(result.has('lantern')).toBe(true);
      expect(result.has('light')).toBe(true);
      expect(result.has('sword')).toBe(true);
      expect(result.has('blade')).toBe(true);
    });

    it('should handle multiple arrays in one method', () => {
      const source = `
        class Vocabulary {
          private loadNouns(): void {
            const common = ['LAMP', 'SWORD'];
            const rare = ['SCEPTRE', 'CHALICE'];
            common.forEach(n => this.addWord(n));
            rare.forEach(n => this.addWord(n));
          }
        }
      `;
      const result = extractWordsFromLoadMethod(source, 'loadNouns');
      expect(result.has('lamp')).toBe(true);
      expect(result.has('sword')).toBe(true);
      expect(result.has('sceptre')).toBe(true);
      expect(result.has('chalice')).toBe(true);
    });

    it('should return empty set for non-existent method', () => {
      const source = `
        class Vocabulary {
          private loadNouns(): void {
            const nouns = ['LAMP'];
          }
        }
      `;
      const result = extractWordsFromLoadMethod(source, 'loadVerbs');
      expect(result.size).toBe(0);
    });

    it('should handle inline comments after words', () => {
      // Note: The extractor extracts all quoted strings in the array.
      // Inline comments after words don't affect extraction.
      const source = `
        class Vocabulary {
          private loadNouns(): void {
            const nouns = [
              'LAMP', // brass lantern
              'SWORD', // elvish sword
            ];
          }
        }
      `;
      const result = extractWordsFromLoadMethod(source, 'loadNouns');
      expect(result.has('lamp')).toBe(true);
      expect(result.has('sword')).toBe(true);
      expect(result.size).toBe(2);
    });
  });

  describe('extractTsVocabulary', () => {
    it('should extract vocabulary from actual vocabulary.ts file', () => {
      const vocabulary = extractTsVocabulary();

      // Verify nouns were extracted
      expect(vocabulary.nouns.size).toBeGreaterThan(0);
      expect(vocabulary.nouns.has('lamp')).toBe(true);
      expect(vocabulary.nouns.has('lantern')).toBe(true);
      expect(vocabulary.nouns.has('sword')).toBe(true);
      expect(vocabulary.nouns.has('chimney')).toBe(true);

      // Verify adjectives were extracted
      expect(vocabulary.adjectives.size).toBeGreaterThan(0);
      expect(vocabulary.adjectives.has('brass')).toBe(true);
      expect(vocabulary.adjectives.has('white')).toBe(true);
      expect(vocabulary.adjectives.has('golden')).toBe(true);

      // Verify verbs were extracted
      expect(vocabulary.verbs.size).toBeGreaterThan(0);
      expect(vocabulary.verbs.has('take')).toBe(true);
      expect(vocabulary.verbs.has('drop')).toBe(true);
      expect(vocabulary.verbs.has('look')).toBe(true);
      expect(vocabulary.verbs.has('examine')).toBe(true);

      // Verify prepositions were extracted
      expect(vocabulary.prepositions.size).toBeGreaterThan(0);
      expect(vocabulary.prepositions.has('with')).toBe(true);
      expect(vocabulary.prepositions.has('in')).toBe(true);
      expect(vocabulary.prepositions.has('on')).toBe(true);

      // Verify directions were extracted
      expect(vocabulary.directions.size).toBeGreaterThan(0);
      expect(vocabulary.directions.has('north')).toBe(true);
      expect(vocabulary.directions.has('south')).toBe(true);
      expect(vocabulary.directions.has('up')).toBe(true);
      expect(vocabulary.directions.has('down')).toBe(true);

      // Verify articles were extracted
      expect(vocabulary.articles.size).toBeGreaterThan(0);
      expect(vocabulary.articles.has('the')).toBe(true);
      expect(vocabulary.articles.has('a')).toBe(true);
      expect(vocabulary.articles.has('an')).toBe(true);

      // Verify pronouns were extracted
      expect(vocabulary.pronouns.size).toBeGreaterThan(0);
      expect(vocabulary.pronouns.has('it')).toBe(true);
      expect(vocabulary.pronouns.has('them')).toBe(true);

      // Verify conjunctions were extracted
      expect(vocabulary.conjunctions.size).toBeGreaterThan(0);
      expect(vocabulary.conjunctions.has('and')).toBe(true);
      expect(vocabulary.conjunctions.has('then')).toBe(true);
    });

    it('should handle missing file gracefully', () => {
      const vocabulary = extractTsVocabulary('nonexistent/path/vocabulary.ts');

      // Should return empty vocabulary
      expect(vocabulary.nouns.size).toBe(0);
      expect(vocabulary.adjectives.size).toBe(0);
      expect(vocabulary.verbs.size).toBe(0);
      expect(vocabulary.prepositions.size).toBe(0);
    });

    it('should extract specific known words from vocabulary.ts', () => {
      const vocabulary = extractTsVocabulary();

      // Known nouns from vocabulary.ts
      expect(vocabulary.nouns.has('mailbox')).toBe(true);
      expect(vocabulary.nouns.has('leaflet')).toBe(true);
      expect(vocabulary.nouns.has('trapdoor')).toBe(true);
      expect(vocabulary.nouns.has('troll')).toBe(true);
      expect(vocabulary.nouns.has('thief')).toBe(true);
      expect(vocabulary.nouns.has('cyclops')).toBe(true);

      // Known verbs from vocabulary.ts
      expect(vocabulary.verbs.has('attack')).toBe(true);
      expect(vocabulary.verbs.has('kill')).toBe(true);
      expect(vocabulary.verbs.has('open')).toBe(true);
      expect(vocabulary.verbs.has('close')).toBe(true);
      expect(vocabulary.verbs.has('unlock')).toBe(true);

      // Known adjectives from vocabulary.ts
      expect(vocabulary.adjectives.has('rusty')).toBe(true);
      expect(vocabulary.adjectives.has('wooden')).toBe(true);
      expect(vocabulary.adjectives.has('crystal')).toBe(true);
    });
  });

  describe('createEmptyTsVocabulary', () => {
    it('should create an empty vocabulary with all sets', () => {
      const vocabulary = createEmptyTsVocabulary();

      expect(vocabulary.nouns).toBeInstanceOf(Set);
      expect(vocabulary.adjectives).toBeInstanceOf(Set);
      expect(vocabulary.verbs).toBeInstanceOf(Set);
      expect(vocabulary.prepositions).toBeInstanceOf(Set);
      expect(vocabulary.directions).toBeInstanceOf(Set);
      expect(vocabulary.articles).toBeInstanceOf(Set);
      expect(vocabulary.pronouns).toBeInstanceOf(Set);
      expect(vocabulary.conjunctions).toBeInstanceOf(Set);

      expect(vocabulary.nouns.size).toBe(0);
      expect(vocabulary.adjectives.size).toBe(0);
      expect(vocabulary.verbs.size).toBe(0);
      expect(vocabulary.prepositions.size).toBe(0);
      expect(vocabulary.directions.size).toBe(0);
      expect(vocabulary.articles.size).toBe(0);
      expect(vocabulary.pronouns.size).toBe(0);
      expect(vocabulary.conjunctions.size).toBe(0);
    });
  });

  describe('getTotalWordCount', () => {
    it('should count all unique words', () => {
      const vocabulary = createEmptyTsVocabulary();
      vocabulary.nouns.add('lamp');
      vocabulary.nouns.add('sword');
      vocabulary.verbs.add('take');
      vocabulary.verbs.add('drop');
      vocabulary.adjectives.add('brass');

      const count = getTotalWordCount(vocabulary);
      expect(count).toBe(5);
    });

    it('should not double-count duplicates across categories', () => {
      const vocabulary = createEmptyTsVocabulary();
      vocabulary.nouns.add('light');
      vocabulary.verbs.add('light'); // Same word, different category

      const count = getTotalWordCount(vocabulary);
      expect(count).toBe(1); // Should only count once
    });

    it('should return 0 for empty vocabulary', () => {
      const vocabulary = createEmptyTsVocabulary();
      const count = getTotalWordCount(vocabulary);
      expect(count).toBe(0);
    });
  });

  describe('vocabularyToObject', () => {
    it('should convert vocabulary to sorted arrays', () => {
      const vocabulary = createEmptyTsVocabulary();
      vocabulary.nouns.add('sword');
      vocabulary.nouns.add('lamp');
      vocabulary.nouns.add('axe');
      vocabulary.verbs.add('take');
      vocabulary.verbs.add('drop');

      const result = vocabularyToObject(vocabulary);

      expect(result.nouns).toEqual(['axe', 'lamp', 'sword']);
      expect(result.verbs).toEqual(['drop', 'take']);
      expect(result.adjectives).toEqual([]);
    });

    it('should handle empty vocabulary', () => {
      const vocabulary = createEmptyTsVocabulary();
      const result = vocabularyToObject(vocabulary);

      expect(result.nouns).toEqual([]);
      expect(result.adjectives).toEqual([]);
      expect(result.verbs).toEqual([]);
      expect(result.prepositions).toEqual([]);
      expect(result.directions).toEqual([]);
      expect(result.articles).toEqual([]);
      expect(result.pronouns).toEqual([]);
      expect(result.conjunctions).toEqual([]);
    });
  });

  describe('DEFAULT_VOCABULARY_PATH', () => {
    it('should point to the correct file', () => {
      expect(DEFAULT_VOCABULARY_PATH).toBe('src/parser/vocabulary.ts');
    });
  });

  describe('parseObjectDefinition', () => {
    it('should extract synonyms and adjectives from object content', () => {
      const objectContent = `
        id: 'LAMP',
        name: 'brass lantern',
        synonyms: ['LAMP', 'LANTERN', 'LIGHT'],
        adjectives: ['BRASS'],
        description: 'brass lantern',
      `;
      const result = parseObjectDefinition('LAMP', objectContent);
      expect(result.id).toBe('LAMP');
      expect(result.synonyms).toEqual(['lamp', 'lantern', 'light']);
      expect(result.adjectives).toEqual(['brass']);
    });

    it('should handle empty synonyms array', () => {
      const objectContent = `
        id: 'GROUND',
        synonyms: [],
        adjectives: [],
      `;
      const result = parseObjectDefinition('GROUND', objectContent);
      expect(result.id).toBe('GROUND');
      expect(result.synonyms).toEqual([]);
      expect(result.adjectives).toEqual([]);
    });

    it('should handle empty adjectives array', () => {
      const objectContent = `
        id: 'TROLL',
        synonyms: ['TROLL'],
        adjectives: [],
      `;
      const result = parseObjectDefinition('TROLL', objectContent);
      expect(result.id).toBe('TROLL');
      expect(result.synonyms).toEqual(['troll']);
      expect(result.adjectives).toEqual([]);
    });

    it('should handle multiple adjectives', () => {
      const objectContent = `
        id: 'SCEPTRE',
        synonyms: ['SCEPTRE', 'SCEPTER', 'TREASURE'],
        adjectives: ['SHARP', 'EGYPTIAN', 'ANCIENT', 'ENAMELED'],
      `;
      const result = parseObjectDefinition('SCEPTRE', objectContent);
      expect(result.id).toBe('SCEPTRE');
      expect(result.synonyms).toEqual(['sceptre', 'scepter', 'treasure']);
      expect(result.adjectives).toEqual(['sharp', 'egyptian', 'ancient', 'enameled']);
    });

    it('should handle multiline arrays', () => {
      const objectContent = `
        id: 'SWORD',
        synonyms: [
          'SWORD',
          'ORCRIST',
          'GLAMDRING',
          'BLADE'
        ],
        adjectives: [
          'ELVISH',
          'OLD',
          'ANTIQUE'
        ],
      `;
      const result = parseObjectDefinition('SWORD', objectContent);
      expect(result.synonyms).toEqual(['sword', 'orcrist', 'glamdring', 'blade']);
      expect(result.adjectives).toEqual(['elvish', 'old', 'antique']);
    });

    it('should handle missing synonyms property', () => {
      const objectContent = `
        id: 'TEST',
        adjectives: ['RED'],
      `;
      const result = parseObjectDefinition('TEST', objectContent);
      expect(result.synonyms).toEqual([]);
      expect(result.adjectives).toEqual(['red']);
    });

    it('should handle missing adjectives property', () => {
      const objectContent = `
        id: 'TEST',
        synonyms: ['TEST'],
      `;
      const result = parseObjectDefinition('TEST', objectContent);
      expect(result.synonyms).toEqual(['test']);
      expect(result.adjectives).toEqual([]);
    });
  });

  describe('extractObjectDefinitions', () => {
    it('should extract object definitions from actual objects-complete.ts file', () => {
      const objects = extractObjectDefinitions();

      // Verify we got a reasonable number of objects
      expect(objects.length).toBeGreaterThan(50);

      // Find specific known objects
      const lamp = objects.find((obj) => obj.id === 'LAMP');
      expect(lamp).toBeDefined();
      expect(lamp?.synonyms).toContain('lamp');
      expect(lamp?.synonyms).toContain('lantern');
      expect(lamp?.synonyms).toContain('light');
      expect(lamp?.adjectives).toContain('brass');

      const sword = objects.find((obj) => obj.id === 'SWORD');
      expect(sword).toBeDefined();
      expect(sword?.synonyms).toContain('sword');
      expect(sword?.synonyms).toContain('blade');
      expect(sword?.adjectives).toContain('elvish');

      const troll = objects.find((obj) => obj.id === 'TROLL');
      expect(troll).toBeDefined();
      expect(troll?.synonyms).toContain('troll');
      expect(troll?.adjectives).toContain('nasty');

      const chimney = objects.find((obj) => obj.id === 'CHIMNEY');
      expect(chimney).toBeDefined();
      expect(chimney?.synonyms).toContain('chimney');
    });

    it('should extract treasures with their synonyms', () => {
      const objects = extractObjectDefinitions();

      const skull = objects.find((obj) => obj.id === 'SKULL');
      expect(skull).toBeDefined();
      expect(skull?.synonyms).toContain('skull');
      expect(skull?.synonyms).toContain('head');
      expect(skull?.synonyms).toContain('treasure');
      expect(skull?.adjectives).toContain('crystal');

      const chalice = objects.find((obj) => obj.id === 'CHALICE');
      expect(chalice).toBeDefined();
      expect(chalice?.synonyms).toContain('chalice');
      expect(chalice?.synonyms).toContain('cup');
    });

    it('should extract NPCs with their synonyms', () => {
      const objects = extractObjectDefinitions();

      const thief = objects.find((obj) => obj.id === 'THIEF');
      expect(thief).toBeDefined();
      expect(thief?.synonyms).toContain('thief');
      expect(thief?.synonyms).toContain('robber');
      expect(thief?.synonyms).toContain('man');
      expect(thief?.adjectives).toContain('shady');
      expect(thief?.adjectives).toContain('suspicious');

      const cyclops = objects.find((obj) => obj.id === 'CYCLOPS');
      expect(cyclops).toBeDefined();
      expect(cyclops?.synonyms).toContain('cyclops');
      expect(cyclops?.synonyms).toContain('monster');
    });

    it('should handle missing file gracefully', () => {
      const objects = extractObjectDefinitions('nonexistent/path/objects.ts');
      expect(objects).toEqual([]);
    });

    it('should extract objects with hyphenated IDs', () => {
      const objects = extractObjectDefinitions();

      const trapDoor = objects.find((obj) => obj.id === 'TRAP-DOOR');
      expect(trapDoor).toBeDefined();
      expect(trapDoor?.synonyms).toContain('door');
      expect(trapDoor?.synonyms).toContain('trapdoor');
      expect(trapDoor?.synonyms).toContain('trap-door');

      const bagOfCoins = objects.find((obj) => obj.id === 'BAG-OF-COINS');
      expect(bagOfCoins).toBeDefined();
      expect(bagOfCoins?.synonyms).toContain('bag');
      expect(bagOfCoins?.synonyms).toContain('coins');
    });
  });

  describe('getAllObjectSynonyms', () => {
    it('should collect all unique synonyms from objects', () => {
      const objects = [
        { id: 'LAMP', synonyms: ['lamp', 'lantern'], adjectives: [] },
        { id: 'SWORD', synonyms: ['sword', 'blade'], adjectives: [] },
        { id: 'KNIFE', synonyms: ['knife', 'blade'], adjectives: [] }, // 'blade' is duplicate
      ];

      const synonyms = getAllObjectSynonyms(objects);
      expect(synonyms.has('lamp')).toBe(true);
      expect(synonyms.has('lantern')).toBe(true);
      expect(synonyms.has('sword')).toBe(true);
      expect(synonyms.has('blade')).toBe(true);
      expect(synonyms.has('knife')).toBe(true);
      expect(synonyms.size).toBe(5); // 'blade' counted once
    });

    it('should return empty set for empty objects array', () => {
      const synonyms = getAllObjectSynonyms([]);
      expect(synonyms.size).toBe(0);
    });

    it('should handle objects with empty synonyms', () => {
      const objects = [
        { id: 'TEST1', synonyms: [], adjectives: [] },
        { id: 'TEST2', synonyms: ['word'], adjectives: [] },
      ];

      const synonyms = getAllObjectSynonyms(objects);
      expect(synonyms.size).toBe(1);
      expect(synonyms.has('word')).toBe(true);
    });

    it('should convert synonyms to lowercase', () => {
      const objects = [{ id: 'TEST', synonyms: ['LAMP', 'Lantern', 'light'], adjectives: [] }];

      const synonyms = getAllObjectSynonyms(objects);
      expect(synonyms.has('lamp')).toBe(true);
      expect(synonyms.has('lantern')).toBe(true);
      expect(synonyms.has('light')).toBe(true);
      expect(synonyms.has('LAMP')).toBe(false);
    });
  });

  describe('getAllObjectAdjectives', () => {
    it('should collect all unique adjectives from objects', () => {
      const objects = [
        { id: 'LAMP', synonyms: [], adjectives: ['brass', 'small'] },
        { id: 'SWORD', synonyms: [], adjectives: ['elvish', 'old'] },
        { id: 'KNIFE', synonyms: [], adjectives: ['rusty', 'old'] }, // 'old' is duplicate
      ];

      const adjectives = getAllObjectAdjectives(objects);
      expect(adjectives.has('brass')).toBe(true);
      expect(adjectives.has('small')).toBe(true);
      expect(adjectives.has('elvish')).toBe(true);
      expect(adjectives.has('old')).toBe(true);
      expect(adjectives.has('rusty')).toBe(true);
      expect(adjectives.size).toBe(5); // 'old' counted once
    });

    it('should return empty set for empty objects array', () => {
      const adjectives = getAllObjectAdjectives([]);
      expect(adjectives.size).toBe(0);
    });

    it('should handle objects with empty adjectives', () => {
      const objects = [
        { id: 'TEST1', synonyms: [], adjectives: [] },
        { id: 'TEST2', synonyms: [], adjectives: ['red'] },
      ];

      const adjectives = getAllObjectAdjectives(objects);
      expect(adjectives.size).toBe(1);
      expect(adjectives.has('red')).toBe(true);
    });

    it('should convert adjectives to lowercase', () => {
      const objects = [{ id: 'TEST', synonyms: [], adjectives: ['BRASS', 'Small', 'old'] }];

      const adjectives = getAllObjectAdjectives(objects);
      expect(adjectives.has('brass')).toBe(true);
      expect(adjectives.has('small')).toBe(true);
      expect(adjectives.has('old')).toBe(true);
      expect(adjectives.has('BRASS')).toBe(false);
    });
  });

  describe('DEFAULT_OBJECTS_PATH', () => {
    it('should point to the correct file', () => {
      expect(DEFAULT_OBJECTS_PATH).toBe('src/game/data/objects-complete.ts');
    });
  });

  describe('Integration: extractObjectDefinitions with actual file', () => {
    it('should extract all synonyms from actual objects-complete.ts', () => {
      const objects = extractObjectDefinitions();
      const allSynonyms = getAllObjectSynonyms(objects);

      // Should have a substantial number of synonyms
      expect(allSynonyms.size).toBeGreaterThan(100);

      // Check for known synonyms
      expect(allSynonyms.has('lamp')).toBe(true);
      expect(allSynonyms.has('lantern')).toBe(true);
      expect(allSynonyms.has('sword')).toBe(true);
      expect(allSynonyms.has('troll')).toBe(true);
      expect(allSynonyms.has('mailbox')).toBe(true);
      expect(allSynonyms.has('chimney')).toBe(true);
    });

    it('should extract all adjectives from actual objects-complete.ts', () => {
      const objects = extractObjectDefinitions();
      const allAdjectives = getAllObjectAdjectives(objects);

      // Should have a reasonable number of adjectives
      expect(allAdjectives.size).toBeGreaterThan(20);

      // Check for known adjectives
      expect(allAdjectives.has('brass')).toBe(true);
      expect(allAdjectives.has('elvish')).toBe(true);
      expect(allAdjectives.has('crystal')).toBe(true);
      expect(allAdjectives.has('nasty')).toBe(true);
    });
  });
});
