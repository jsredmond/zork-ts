/**
 * TypeScript Vocabulary Extractor
 *
 * Extracts vocabulary words from the TypeScript implementation by parsing
 * the vocabulary.ts file and extracting words from the load* methods.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import * as fs from 'fs';

/**
 * Represents the vocabulary extracted from TypeScript source files
 */
export interface TsVocabulary {
  nouns: Set<string>;
  adjectives: Set<string>;
  verbs: Set<string>;
  prepositions: Set<string>;
  directions: Set<string>;
  articles: Set<string>;
  pronouns: Set<string>;
  conjunctions: Set<string>;
}

/**
 * Represents an object definition extracted from TypeScript
 */
export interface TsObjectDef {
  id: string;
  synonyms: string[];
  adjectives: string[];
}

/**
 * Default path to the vocabulary.ts file
 */
export const DEFAULT_VOCABULARY_PATH = 'src/parser/vocabulary.ts';

/**
 * Default path to the objects-complete.ts file
 */
export const DEFAULT_OBJECTS_PATH = 'src/game/data/objects-complete.ts';

/**
 * Creates an empty TsVocabulary structure.
 */
export function createEmptyTsVocabulary(): TsVocabulary {
  return {
    nouns: new Set<string>(),
    adjectives: new Set<string>(),
    verbs: new Set<string>(),
    prepositions: new Set<string>(),
    directions: new Set<string>(),
    articles: new Set<string>(),
    pronouns: new Set<string>(),
    conjunctions: new Set<string>(),
  };
}

/**
 * Extracts words from a TypeScript array literal.
 *
 * Parses array content like:
 *   ['WORD1', 'WORD2', 'WORD3']
 *   ["WORD1", "WORD2"]
 *
 * @param arrayContent - The content inside the array brackets
 * @returns Array of extracted words (lowercase)
 */
export function extractWordsFromArray(arrayContent: string): string[] {
  const words: string[] = [];

  // Match both single and double quoted strings
  // Handles: 'WORD', "WORD", 'WORD-WITH-HYPHEN', etc.
  const stringPattern = /['"]([^'"]+)['"]/g;
  let match;

  while ((match = stringPattern.exec(arrayContent)) !== null) {
    const word = match[1].trim();
    if (word.length > 0) {
      words.push(word.toLowerCase());
    }
  }

  return words;
}

/**
 * Extracts the content of a specific method from TypeScript source.
 *
 * Finds the method by name and extracts everything between the opening
 * and closing braces, handling nested braces correctly.
 *
 * @param source - The TypeScript source code
 * @param methodName - The name of the method to extract
 * @returns The method body content, or null if not found
 */
export function extractMethodBody(source: string, methodName: string): string | null {
  // Match method declaration: private methodName(): void { or methodName() {
  // Handle various method signatures
  const methodPattern = new RegExp(
    `(?:private\\s+)?${methodName}\\s*\\([^)]*\\)\\s*(?::\\s*\\w+)?\\s*\\{`,
    'i'
  );

  const methodMatch = source.match(methodPattern);
  if (!methodMatch || methodMatch.index === undefined) {
    return null;
  }

  const startIndex = methodMatch.index + methodMatch[0].length;
  let depth = 1;
  let endIndex = startIndex;

  // Find the matching closing brace
  for (let i = startIndex; i < source.length && depth > 0; i++) {
    const char = source[i];
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
    }
    endIndex = i;
  }

  return source.substring(startIndex, endIndex);
}

/**
 * Extracts words from a load* method in vocabulary.ts.
 *
 * These methods typically have a pattern like:
 *   const words = ['WORD1', 'WORD2', ...];
 *   words.forEach(word => this.addWord(word, TokenType.TYPE));
 *
 * @param source - The TypeScript source code
 * @param methodName - The name of the load method (e.g., 'loadNouns')
 * @returns Set of extracted words (lowercase)
 */
export function extractWordsFromLoadMethod(source: string, methodName: string): Set<string> {
  const words = new Set<string>();

  const methodBody = extractMethodBody(source, methodName);
  if (!methodBody) {
    return words;
  }

  // Find array declarations in the method body
  // Pattern: const varName = [...] or let varName = [...]
  const arrayPattern = /(?:const|let)\s+\w+\s*=\s*\[([\s\S]*?)\];/g;
  let match;

  while ((match = arrayPattern.exec(methodBody)) !== null) {
    const arrayContent = match[1];
    const extractedWords = extractWordsFromArray(arrayContent);
    for (const word of extractedWords) {
      words.add(word);
    }
  }

  return words;
}

/**
 * Extracts all vocabulary from the TypeScript vocabulary.ts file.
 *
 * Parses the vocabulary.ts file and extracts words from:
 * - loadNouns() method
 * - loadAdjectives() method
 * - loadVerbs() method
 * - loadPrepositions() method
 * - loadDirections() method
 * - loadArticles() method
 * - loadPronouns() method
 * - loadConjunctions() method
 *
 * @param vocabularyPath - Path to the vocabulary.ts file
 * @returns TsVocabulary with all categorized words
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export function extractTsVocabulary(
  vocabularyPath: string = DEFAULT_VOCABULARY_PATH
): TsVocabulary {
  const vocabulary = createEmptyTsVocabulary();

  let source: string;
  try {
    source = fs.readFileSync(vocabularyPath, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not read vocabulary file ${vocabularyPath}: ${errorMessage}`);
    return vocabulary;
  }

  // Extract words from each load method
  vocabulary.nouns = extractWordsFromLoadMethod(source, 'loadNouns');
  vocabulary.adjectives = extractWordsFromLoadMethod(source, 'loadAdjectives');
  vocabulary.verbs = extractWordsFromLoadMethod(source, 'loadVerbs');
  vocabulary.prepositions = extractWordsFromLoadMethod(source, 'loadPrepositions');
  vocabulary.directions = extractWordsFromLoadMethod(source, 'loadDirections');
  vocabulary.articles = extractWordsFromLoadMethod(source, 'loadArticles');
  vocabulary.pronouns = extractWordsFromLoadMethod(source, 'loadPronouns');
  vocabulary.conjunctions = extractWordsFromLoadMethod(source, 'loadConjunctions');

  return vocabulary;
}

/**
 * Gets the total word count across all vocabulary categories.
 *
 * @param vocabulary - The TsVocabulary to count
 * @returns Total number of unique words
 */
export function getTotalWordCount(vocabulary: TsVocabulary): number {
  // Create a combined set to handle any duplicates across categories
  const allWords = new Set<string>();

  for (const word of vocabulary.nouns) allWords.add(word);
  for (const word of vocabulary.adjectives) allWords.add(word);
  for (const word of vocabulary.verbs) allWords.add(word);
  for (const word of vocabulary.prepositions) allWords.add(word);
  for (const word of vocabulary.directions) allWords.add(word);
  for (const word of vocabulary.articles) allWords.add(word);
  for (const word of vocabulary.pronouns) allWords.add(word);
  for (const word of vocabulary.conjunctions) allWords.add(word);

  return allWords.size;
}

/**
 * Converts a TsVocabulary to a plain object with arrays instead of Sets.
 * Useful for JSON serialization and comparison.
 *
 * @param vocabulary - The TsVocabulary to convert
 * @returns Object with sorted arrays for each category
 */
export function vocabularyToObject(vocabulary: TsVocabulary): {
  nouns: string[];
  adjectives: string[];
  verbs: string[];
  prepositions: string[];
  directions: string[];
  articles: string[];
  pronouns: string[];
  conjunctions: string[];
} {
  return {
    nouns: Array.from(vocabulary.nouns).sort(),
    adjectives: Array.from(vocabulary.adjectives).sort(),
    verbs: Array.from(vocabulary.verbs).sort(),
    prepositions: Array.from(vocabulary.prepositions).sort(),
    directions: Array.from(vocabulary.directions).sort(),
    articles: Array.from(vocabulary.articles).sort(),
    pronouns: Array.from(vocabulary.pronouns).sort(),
    conjunctions: Array.from(vocabulary.conjunctions).sort(),
  };
}

/**
 * Extracts a single object definition from a TypeScript object literal.
 *
 * Parses object content like:
 *   'LAMP': {
 *     id: 'LAMP',
 *     synonyms: ['LAMP', 'LANTERN', 'LIGHT'],
 *     adjectives: ['BRASS'],
 *     ...
 *   }
 *
 * @param objectId - The object ID (key in ALL_OBJECTS)
 * @param objectContent - The content inside the object braces
 * @returns TsObjectDef with extracted synonyms and adjectives
 */
export function parseObjectDefinition(objectId: string, objectContent: string): TsObjectDef {
  const result: TsObjectDef = {
    id: objectId,
    synonyms: [],
    adjectives: [],
  };

  // Extract synonyms array
  const synonymsMatch = objectContent.match(/synonyms\s*:\s*\[([\s\S]*?)\]/i);
  if (synonymsMatch) {
    result.synonyms = extractWordsFromArray(synonymsMatch[1]);
  }

  // Extract adjectives array
  const adjectivesMatch = objectContent.match(/adjectives\s*:\s*\[([\s\S]*?)\]/i);
  if (adjectivesMatch) {
    result.adjectives = extractWordsFromArray(adjectivesMatch[1]);
  }

  return result;
}

/**
 * Extracts all object definitions from the objects-complete.ts file.
 *
 * Parses the ALL_OBJECTS export to get all object definitions and extracts
 * the synonyms and adjectives arrays from each object.
 *
 * @param objectsPath - Path to the objects-complete.ts file
 * @returns Array of TsObjectDef with all object definitions
 *
 * Requirements: 2.5, 2.6
 */
export function extractObjectDefinitions(
  objectsPath: string = DEFAULT_OBJECTS_PATH
): TsObjectDef[] {
  const objects: TsObjectDef[] = [];

  let source: string;
  try {
    source = fs.readFileSync(objectsPath, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not read objects file ${objectsPath}: ${errorMessage}`);
    return objects;
  }

  // Find the ALL_OBJECTS export
  const allObjectsMatch = source.match(
    /export\s+const\s+ALL_OBJECTS\s*:\s*Record<[^>]+>\s*=\s*\{/
  );
  if (!allObjectsMatch || allObjectsMatch.index === undefined) {
    console.warn('Warning: Could not find ALL_OBJECTS export in objects file');
    return objects;
  }

  // Find the content of ALL_OBJECTS (everything between the opening { and closing })
  const startIndex = allObjectsMatch.index + allObjectsMatch[0].length;
  let depth = 1;
  let endIndex = startIndex;

  for (let i = startIndex; i < source.length && depth > 0; i++) {
    const char = source[i];
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
    }
    endIndex = i;
  }

  const allObjectsContent = source.substring(startIndex, endIndex);

  // Parse individual object definitions
  // Pattern: 'OBJECT_ID': { ... }
  // We need to match each object key and its content
  const objectPattern = /['"]([A-Z][A-Z0-9_-]*)['"]:\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = objectPattern.exec(allObjectsContent)) !== null) {
    const objectId = match[1];
    const objectStartIndex = match.index + match[0].length;

    // Find the matching closing brace for this object
    let objectDepth = 1;
    let objectEndIndex = objectStartIndex;

    for (let i = objectStartIndex; i < allObjectsContent.length && objectDepth > 0; i++) {
      const char = allObjectsContent[i];
      if (char === '{') {
        objectDepth++;
      } else if (char === '}') {
        objectDepth--;
      }
      objectEndIndex = i;
    }

    const objectContent = allObjectsContent.substring(objectStartIndex, objectEndIndex);
    const objectDef = parseObjectDefinition(objectId, objectContent);
    objects.push(objectDef);
  }

  return objects;
}

/**
 * Gets all unique synonyms from all object definitions.
 *
 * @param objects - Array of TsObjectDef
 * @returns Set of all unique synonyms (lowercase)
 */
export function getAllObjectSynonyms(objects: TsObjectDef[]): Set<string> {
  const synonyms = new Set<string>();
  for (const obj of objects) {
    for (const synonym of obj.synonyms) {
      synonyms.add(synonym.toLowerCase());
    }
  }
  return synonyms;
}

/**
 * Gets all unique adjectives from all object definitions.
 *
 * @param objects - Array of TsObjectDef
 * @returns Set of all unique adjectives (lowercase)
 */
export function getAllObjectAdjectives(objects: TsObjectDef[]): Set<string> {
  const adjectives = new Set<string>();
  for (const obj of objects) {
    for (const adjective of obj.adjectives) {
      adjectives.add(adjective.toLowerCase());
    }
  }
  return adjectives;
}
