/**
 * ZIL Vocabulary Extractor
 *
 * Parses ZIL source files to extract vocabulary definitions including:
 * - SYNONYM definitions (both object and verb/preposition forms)
 * - ADJECTIVE definitions from object definitions
 * - BUZZ word definitions (parser-ignored words)
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Represents the vocabulary extracted from ZIL source files
 */
export interface ZilVocabulary {
  nouns: Set<string>; // From SYNONYM definitions in objects
  adjectives: Set<string>; // From ADJECTIVE definitions
  verbs: Set<string>; // From verb SYNONYM definitions (gsyntax.zil)
  prepositions: Set<string>; // From preposition SYNONYM definitions
  buzzWords: Set<string>; // From BUZZ definitions
  directions: Set<string>; // Direction words (NORTH, SOUTH, etc.)
}

/**
 * Represents an object definition extracted from ZIL
 */
export interface ZilObjectDef {
  id: string;
  synonyms: string[];
  adjectives: string[];
}

/**
 * Normalizes a ZIL word to lowercase, handling special characters.
 * ZIL uses backslash escapes for special characters like \# and \-
 *
 * @param word - The raw word from ZIL source
 * @returns Normalized lowercase word
 */
export function normalizeZilWord(word: string): string {
  // Remove ZIL escape characters (backslashes before special chars)
  // e.g., FCD\#3 becomes FCD#3, TRAP\-DOOR becomes TRAP-DOOR
  const normalized = word.replace(/\\(.)/g, '$1');
  return normalized.toLowerCase();
}

/**
 * Parses a ZIL SYNONYM definition and extracts all words.
 * Handles both parentheses syntax (SYNONYM WORD1 WORD2) for objects
 * and angle bracket syntax <SYNONYM WORD1 WORD2> for verbs/prepositions.
 *
 * @param line - A line containing a SYNONYM definition
 * @returns Array of extracted words (lowercase)
 *
 * Requirements: 1.1
 *
 * Examples:
 *   "(SYNONYM LAMP LANTERN LIGHT)" => ["lamp", "lantern", "light"]
 *   "<SYNONYM ATTACK FIGHT HURT>" => ["attack", "fight", "hurt"]
 */
export function parseZilSynonym(line: string): string[] {
  const words: string[] = [];

  // Match parentheses syntax: (SYNONYM WORD1 WORD2 ...)
  // This is used in object definitions
  const parenMatch = line.match(/\(SYNONYM\s+([^)]+)\)/i);
  if (parenMatch) {
    const wordList = parenMatch[1].trim();
    const extracted = extractWords(wordList);
    words.push(...extracted);
  }

  // Match angle bracket syntax: <SYNONYM WORD1 WORD2 ...>
  // This is used for verb and preposition synonyms
  const angleMatch = line.match(/<SYNONYM\s+([^>]+)>/i);
  if (angleMatch) {
    const wordList = angleMatch[1].trim();
    const extracted = extractWords(wordList);
    words.push(...extracted);
  }

  return words.map(normalizeZilWord);
}

/**
 * Parses a ZIL ADJECTIVE definition and extracts all adjectives.
 * Format: (ADJECTIVE ADJ1 ADJ2 ...)
 *
 * @param line - A line containing an ADJECTIVE definition
 * @returns Array of extracted adjectives (lowercase)
 *
 * Requirements: 1.2
 *
 * Examples:
 *   "(ADJECTIVE BRASS SMALL)" => ["brass", "small"]
 *   "(ADJECTIVE WHITE BEAUTI COLONI)" => ["white", "beauti", "coloni"]
 */
export function parseZilAdjective(line: string): string[] {
  const adjectives: string[] = [];

  // Match: (ADJECTIVE ADJ1 ADJ2 ...)
  const match = line.match(/\(ADJECTIVE\s+([^)]+)\)/i);
  if (match) {
    const wordList = match[1].trim();
    const extracted = extractWords(wordList);
    adjectives.push(...extracted);
  }

  return adjectives.map(normalizeZilWord);
}

/**
 * Parses a ZIL BUZZ definition and extracts all buzz words.
 * Format: <BUZZ WORD1 WORD2 ...>
 * Buzz words are ignored by the parser (articles, conjunctions, etc.)
 *
 * @param line - A line containing a BUZZ definition
 * @returns Array of extracted buzz words (lowercase)
 *
 * Requirements: 1.3
 *
 * Examples:
 *   "<BUZZ A AN THE IS>" => ["a", "an", "the", "is"]
 *   "<BUZZ AGAIN G OOPS>" => ["again", "g", "oops"]
 */
export function parseZilBuzz(line: string): string[] {
  const buzzWords: string[] = [];

  // Match: <BUZZ WORD1 WORD2 ...>
  const match = line.match(/<BUZZ\s+([^>]+)>/i);
  if (match) {
    const wordList = match[1].trim();
    const extracted = extractWords(wordList);
    buzzWords.push(...extracted);
  }

  return buzzWords.map(normalizeZilWord);
}

/**
 * Parses a ZIL DIRECTIONS definition.
 * Format: <DIRECTIONS DIR1 DIR2 ...>
 *
 * @param line - A line containing a DIRECTIONS definition
 * @returns Array of extracted direction words (lowercase)
 */
export function parseZilDirections(line: string): string[] {
  const directions: string[] = [];

  // Match: <DIRECTIONS DIR1 DIR2 ...>
  const match = line.match(/<DIRECTIONS\s+([^>]+)>/i);
  if (match) {
    const wordList = match[1].trim();
    const extracted = extractWords(wordList);
    directions.push(...extracted);
  }

  return directions.map(normalizeZilWord);
}

/**
 * Extracts individual words from a space-separated word list.
 * Handles ZIL comments (text after semicolon) and special characters.
 *
 * @param wordList - Space-separated list of words
 * @returns Array of individual words
 */
function extractWords(wordList: string): string[] {
  // Remove inline comments: anything after ; until end or closing delimiter
  // ZIL uses ; for comments, and ;"..." for string comments
  let cleaned = wordList;

  // Remove string comments like ;"comment"
  cleaned = cleaned.replace(/;"[^"]*"/g, '');

  // Remove line comments (everything after ; that's not in a string)
  // But be careful not to remove escaped semicolons
  const semicolonIndex = cleaned.indexOf(';');
  if (semicolonIndex !== -1) {
    cleaned = cleaned.substring(0, semicolonIndex);
  }

  // Split on whitespace and filter out empty strings
  const words = cleaned
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0)
    // Filter out ZIL special tokens that aren't words
    .filter((w) => !w.startsWith('<') && !w.startsWith('('))
    // Filter out escaped punctuation-only tokens like \. \, \"
    .filter((w) => !/^\\[.,"]$/.test(w));

  return words;
}

/**
 * Parses a ZIL OBJECT definition and extracts its ID, synonyms, and adjectives.
 *
 * @param objectBlock - The complete object definition block
 * @returns ZilObjectDef with extracted data, or null if not a valid object
 */
export function parseZilObject(objectBlock: string): ZilObjectDef | null {
  // Match object ID: <OBJECT NAME or <OBJECT NAME\n
  const idMatch = objectBlock.match(/<OBJECT\s+([A-Z0-9_-]+)/i);
  if (!idMatch) {
    return null;
  }

  const id = idMatch[1];
  const synonyms: string[] = [];
  const adjectives: string[] = [];

  // Extract all SYNONYM definitions
  const synonymMatches = objectBlock.matchAll(/\(SYNONYM\s+([^)]+)\)/gi);
  for (const match of synonymMatches) {
    const words = extractWords(match[1]);
    synonyms.push(...words.map(normalizeZilWord));
  }

  // Extract all ADJECTIVE definitions
  const adjMatches = objectBlock.matchAll(/\(ADJECTIVE\s+([^)]+)\)/gi);
  for (const match of adjMatches) {
    const words = extractWords(match[1]);
    adjectives.push(...words.map(normalizeZilWord));
  }

  return {
    id,
    synonyms,
    adjectives,
  };
}

/**
 * Checks if a line is a ZIL comment line.
 * ZIL comments start with ; or are enclosed in ;"..."
 *
 * @param line - The line to check
 * @returns true if the line is a comment
 */
export function isZilComment(line: string): boolean {
  const trimmed = line.trim();
  // Full line comment starts with ;
  // But not if it's part of a definition (e.g., inside parentheses)
  return trimmed.startsWith(';') || trimmed.startsWith('"');
}

/**
 * Creates an empty ZilVocabulary structure.
 */
export function createEmptyZilVocabulary(): ZilVocabulary {
  return {
    nouns: new Set<string>(),
    adjectives: new Set<string>(),
    verbs: new Set<string>(),
    prepositions: new Set<string>(),
    buzzWords: new Set<string>(),
    directions: new Set<string>(),
  };
}


/**
 * Default ZIL files to parse for vocabulary extraction.
 * These are the primary files containing vocabulary definitions.
 */
export const DEFAULT_ZIL_FILES = ['1dungeon.zil', 'gglobals.zil', 'gsyntax.zil'];

/**
 * Default path to the ZIL source files directory.
 */
export const DEFAULT_ZIL_PATH = 'reference/zil';

/**
 * Extracts all vocabulary from ZIL source files.
 *
 * This function reads the specified ZIL files and aggregates all vocabulary
 * definitions into categorized sets:
 * - nouns: From SYNONYM definitions in object definitions
 * - adjectives: From ADJECTIVE definitions in object definitions
 * - verbs: From verb SYNONYM definitions (gsyntax.zil)
 * - prepositions: From preposition SYNONYM definitions
 * - buzzWords: From BUZZ definitions
 * - directions: From DIRECTIONS definitions
 *
 * @param zilFiles - Array of ZIL file paths to parse (relative to zilBasePath)
 * @param zilBasePath - Base path to the ZIL files directory (default: 'reference/zil')
 * @returns ZilVocabulary with all categorized words
 *
 * Requirements: 1.4, 1.5
 */
export function extractZilVocabulary(
  zilFiles: string[] = DEFAULT_ZIL_FILES,
  zilBasePath: string = DEFAULT_ZIL_PATH
): ZilVocabulary {
  const vocabulary = createEmptyZilVocabulary();

  for (const fileName of zilFiles) {
    const filePath = path.join(zilBasePath, fileName);

    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      // Handle file reading errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Could not read ZIL file ${filePath}: ${errorMessage}`);
      continue;
    }

    // Parse the file content based on file type
    if (fileName === 'gsyntax.zil') {
      parseGsyntaxFile(content, vocabulary);
    } else {
      // Parse object definitions from dungeon and globals files
      parseObjectFile(content, vocabulary);
    }
  }

  return vocabulary;
}

/**
 * Parses gsyntax.zil content for verbs, prepositions, buzz words, and directions.
 *
 * gsyntax.zil contains:
 * - BUZZ definitions for parser-ignored words
 * - SYNONYM definitions for prepositions and directions
 * - SYNTAX definitions with verb names
 * - Verb SYNONYM definitions
 *
 * @param content - The file content to parse
 * @param vocabulary - The vocabulary object to populate
 */
function parseGsyntaxFile(content: string, vocabulary: ZilVocabulary): void {
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip comment lines
    if (isZilComment(line)) {
      continue;
    }

    // Parse BUZZ definitions
    const buzzWords = parseZilBuzz(line);
    for (const word of buzzWords) {
      vocabulary.buzzWords.add(word);
    }

    // Parse DIRECTIONS definitions
    const directions = parseZilDirections(line);
    for (const dir of directions) {
      vocabulary.directions.add(dir);
    }

    // Parse SYNONYM definitions (for prepositions and direction aliases)
    // In gsyntax.zil, <SYNONYM ...> defines preposition/direction synonyms
    const synonyms = parseZilSynonym(line);
    if (synonyms.length > 0) {
      // Determine if this is a direction or preposition synonym line
      // by checking ALL words in the list, not just the first one
      const synonymType = classifySynonymLine(synonyms);

      if (synonymType === 'direction') {
        for (const word of synonyms) {
          vocabulary.directions.add(word);
        }
      } else if (synonymType === 'preposition') {
        for (const word of synonyms) {
          vocabulary.prepositions.add(word);
        }
      }
    }

    // Parse SYNTAX definitions to extract verbs
    // Format: <SYNTAX VERB ... = V-ACTION>
    const syntaxMatch = line.match(/<SYNTAX\s+([A-Z]+)/i);
    if (syntaxMatch) {
      const verb = normalizeZilWord(syntaxMatch[1]);
      // Skip special syntax commands that aren't real verbs
      if (!verb.startsWith('$') && !verb.startsWith('#')) {
        vocabulary.verbs.add(verb);
      }
    }

    // Parse verb SYNONYM definitions
    // Format: <SYNONYM VERB1 VERB2 VERB3> (after a SYNTAX definition)
    // These are verb synonyms when they follow SYNTAX definitions
    const verbSynonymMatch = line.match(/<SYNONYM\s+([^>]+)>/i);
    if (verbSynonymMatch && !isDirectionOrPrepositionSynonym(line)) {
      const words = extractWordsFromList(verbSynonymMatch[1]);
      for (const word of words) {
        vocabulary.verbs.add(normalizeZilWord(word));
      }
    }
  }
}

/**
 * Parses object definition files (1dungeon.zil, gglobals.zil) for nouns and adjectives.
 *
 * @param content - The file content to parse
 * @param vocabulary - The vocabulary object to populate
 */
function parseObjectFile(content: string, vocabulary: ZilVocabulary): void {
  // Extract DIRECTIONS if present (1dungeon.zil has this)
  const directionsMatch = content.match(/<DIRECTIONS\s+([^>]+)>/i);
  if (directionsMatch) {
    const directions = parseZilDirections(`<DIRECTIONS ${directionsMatch[1]}>`);
    for (const dir of directions) {
      vocabulary.directions.add(dir);
    }
  }

  // Find all OBJECT definitions and extract their synonyms and adjectives
  // Objects are defined as <OBJECT NAME ... > blocks
  const objectBlocks = extractObjectBlocks(content);

  for (const block of objectBlocks) {
    const objectDef = parseZilObject(block);
    if (objectDef) {
      // Add synonyms as nouns
      for (const synonym of objectDef.synonyms) {
        vocabulary.nouns.add(synonym);
      }

      // Add adjectives
      for (const adjective of objectDef.adjectives) {
        vocabulary.adjectives.add(adjective);
      }
    }
  }
}

/**
 * Extracts individual OBJECT definition blocks from ZIL content.
 *
 * @param content - The ZIL file content
 * @returns Array of object definition blocks
 */
function extractObjectBlocks(content: string): string[] {
  const blocks: string[] = [];

  // Match <OBJECT NAME followed by content until the closing >
  // ZIL objects can span multiple lines and contain nested parentheses
  const objectPattern = /<OBJECT\s+[A-Z0-9_-]+/gi;
  let match;

  while ((match = objectPattern.exec(content)) !== null) {
    const startIndex = match.index;
    let depth = 1;
    let endIndex = startIndex + match[0].length;

    // Find the matching closing bracket
    for (let i = endIndex; i < content.length && depth > 0; i++) {
      const char = content[i];
      if (char === '<') {
        depth++;
      } else if (char === '>') {
        depth--;
      }
      endIndex = i + 1;
    }

    blocks.push(content.substring(startIndex, endIndex));
  }

  return blocks;
}

/**
 * Extracts words from a space-separated list, handling ZIL comments.
 *
 * @param wordList - Space-separated list of words
 * @returns Array of individual words
 */
function extractWordsFromList(wordList: string): string[] {
  // Remove string comments like ;"comment"
  let cleaned = wordList.replace(/;"[^"]*"/g, '');

  // Remove line comments (everything after ;)
  const semicolonIndex = cleaned.indexOf(';');
  if (semicolonIndex !== -1) {
    cleaned = cleaned.substring(0, semicolonIndex);
  }

  // Split on whitespace and filter
  return cleaned
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0)
    .filter((w) => !w.startsWith('<') && !w.startsWith('('))
    .filter((w) => !/^\\[.,"]$/.test(w));
}

/**
 * Checks if a word is a direction word (excluding ambiguous words like IN, OUT).
 * These are unambiguous direction words.
 */
function isUnambiguousDirectionWord(word: string): boolean {
  const directions = new Set([
    'NORTH',
    'SOUTH',
    'EAST',
    'WEST',
    'UP',
    'DOWN',
    'NE',
    'NW',
    'SE',
    'SW',
    'NORTHEAST',
    'NORTHWEST',
    'SOUTHEAST',
    'SOUTHWEST',
    'N',
    'S',
    'E',
    'W',
    'U',
    'D',
    'LAND',
    'NORTHE',
    'SOUTHE',
  ]);
  return directions.has(word.toUpperCase());
}

/**
 * Checks if a word is a direction word (including ambiguous words).
 */
function isDirectionWord(word: string): boolean {
  const directions = new Set([
    'NORTH',
    'SOUTH',
    'EAST',
    'WEST',
    'UP',
    'DOWN',
    'NE',
    'NW',
    'SE',
    'SW',
    'NORTHEAST',
    'NORTHWEST',
    'SOUTHEAST',
    'SOUTHWEST',
    'N',
    'S',
    'E',
    'W',
    'U',
    'D',
    'IN',
    'OUT',
    'LAND',
    'NORTHE',
    'SOUTHE',
  ]);
  return directions.has(word.toUpperCase());
}

/**
 * Checks if a word is an unambiguous preposition word.
 * These words are clearly prepositions, not directions.
 */
function isUnambiguousPrepositionWord(word: string): boolean {
  const prepositions = new Set([
    'WITH',
    'USING',
    'THROUGH',
    'THRU',
    'INSIDE',
    'INTO',
    'ONTO',
    'UNDER',
    'UNDERNEATH',
    'BENEATH',
    'BELOW',
    'AT',
    'TO',
    'FROM',
    'FOR',
    'ABOUT',
    'OVER',
    'OFF',
    'BEHIND',
    'ACROSS',
    'AWAY',
  ]);
  return prepositions.has(word.toUpperCase());
}

/**
 * Checks if a word is a preposition word (including ambiguous words).
 */
function isPrepositionWord(word: string): boolean {
  const prepositions = new Set([
    'WITH',
    'USING',
    'THROUGH',
    'THRU',
    'IN',
    'INSIDE',
    'INTO',
    'ON',
    'ONTO',
    'UNDER',
    'UNDERNEATH',
    'BENEATH',
    'BELOW',
    'AT',
    'TO',
    'FROM',
    'FOR',
    'ABOUT',
    'OVER',
    'OFF',
    'BEHIND',
    'ACROSS',
    'AWAY',
    'OUT',
  ]);
  return prepositions.has(word.toUpperCase());
}

/**
 * Classifies a synonym line as 'direction', 'preposition', or 'verb'.
 *
 * Some words like IN and OUT are ambiguous - they can be both directions
 * and prepositions. We classify by looking at ALL words in the synonym list:
 * - If any word is an unambiguous preposition (INSIDE, INTO, etc.), it's a preposition line
 * - If any word is an unambiguous direction (NORTH, N, etc.), it's a direction line
 * - Otherwise, it's likely a verb synonym
 *
 * @param synonyms - Array of words from the synonym definition
 * @returns 'direction', 'preposition', or 'verb'
 */
function classifySynonymLine(synonyms: string[]): 'direction' | 'preposition' | 'verb' {
  // Check if any word is an unambiguous preposition
  for (const word of synonyms) {
    if (isUnambiguousPrepositionWord(word)) {
      return 'preposition';
    }
  }

  // Check if any word is an unambiguous direction
  for (const word of synonyms) {
    if (isUnambiguousDirectionWord(word)) {
      return 'direction';
    }
  }

  // If the first word is a direction/preposition but we couldn't classify,
  // default based on the first word
  const firstWord = synonyms[0].toUpperCase();
  if (isDirectionWord(firstWord)) {
    return 'direction';
  }
  if (isPrepositionWord(firstWord)) {
    return 'preposition';
  }

  return 'verb';
}

/**
 * Checks if a SYNONYM line is for directions or prepositions (not verbs).
 */
function isDirectionOrPrepositionSynonym(line: string): boolean {
  const match = line.match(/<SYNONYM\s+([A-Z]+)/i);
  if (!match) return false;

  const firstWord = match[1].toUpperCase();
  return isDirectionWord(firstWord) || isPrepositionWord(firstWord);
}
