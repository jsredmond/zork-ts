/**
 * ErrorMessageStandardizer - Centralized Z-Machine error message formats
 * 
 * This module provides a single source of truth for all Z-Machine error messages,
 * ensuring consistent formatting across the TypeScript implementation.
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 7.1, 10.5
 */

/**
 * Error context for generating appropriate messages
 */
export interface ErrorContext {
  verb?: string;
  object?: string;
  container?: string;
  word?: string;
  location?: string;
}

/**
 * Error types supported by the standardizer
 */
export enum ErrorType {
  // Parser errors (Requirement 1.1, 1.2, 1.3)
  UNKNOWN_WORD = 'UNKNOWN_WORD',
  OBJECT_NOT_VISIBLE = 'OBJECT_NOT_VISIBLE',
  VERB_NEEDS_OBJECT = 'VERB_NEEDS_OBJECT',
  DONT_HAVE = 'DONT_HAVE',
  EMPTY_INPUT = 'EMPTY_INPUT',
  MALFORMED_INPUT = 'MALFORMED_INPUT',
  
  // Container errors (Requirement 7.1)
  CONTAINER_CLOSED = 'CONTAINER_CLOSED',
  
  // Scenery errors (Requirement 2.1, 2.2, 2.3, 2.4, 2.5, 10.2, 10.3, 10.4)
  TAKE_CONCEPT = 'TAKE_CONCEPT',
  TAKE_INTERESTING = 'TAKE_INTERESTING',
  TURN_BARE_HANDS = 'TURN_BARE_HANDS',
  PUSH_NOT_HELPFUL = 'PUSH_NOT_HELPFUL',
  PULL_CANT_MOVE = 'PULL_CANT_MOVE',
  OPEN_CANT_GET_IN = 'OPEN_CANT_GET_IN',
  
  // General errors
  CANT_DO_THAT = 'CANT_DO_THAT',
  NOTHING_HAPPENS = 'NOTHING_HAPPENS'
}

/**
 * Verb-specific "What do you want to [verb]?" messages
 * Maps verbs to their exact Z-Machine phrasing
 */
const VERB_OBJECT_MESSAGES: Record<string, string> = {
  'drop': 'What do you want to drop?',
  'take': 'What do you want to take?',
  'get': 'What do you want to take?',
  'pick': 'What do you want to take?',
  'put': 'What do you want to put?',
  'place': 'What do you want to put?',
  'insert': 'What do you want to put?',
  'examine': 'What do you want to examine?',
  'look': 'What do you want to look at?',
  'open': 'What do you want to open?',
  'close': 'What do you want to close?',
  'read': 'What do you want to read?',
  'attack': 'What do you want to attack?',
  'kill': 'What do you want to attack?',
  'hit': 'What do you want to attack?',
  'fight': 'What do you want to attack?',
  'give': 'What do you want to give?',
  'throw': 'What do you want to throw?',
  'move': 'What do you want to move?',
  'push': 'What do you want to push?',
  'pull': 'What do you want to pull?',
  'turn': 'What do you want to turn?',
  'eat': 'What do you want to eat?',
  'drink': 'What do you want to drink?',
  'search': 'What do you want to search?',
  'climb': 'What do you want to climb?',
  'enter': 'What do you want to enter?',
  'light': 'What do you want to light?',
  'extinguish': 'What do you want to extinguish?',
  'blow': 'What do you want to blow out?',
  'tie': 'What do you want to tie?',
  'untie': 'What do you want to untie?',
  'unlock': 'What do you want to unlock?',
  'lock': 'What do you want to lock?',
  'fill': 'What do you want to fill?',
  'empty': 'What do you want to empty?',
  'pour': 'What do you want to pour?',
  'wave': 'What do you want to wave?',
  'rub': 'What do you want to rub?',
  'touch': 'What do you want to touch?',
  'smell': 'What do you want to smell?',
  'listen': 'What do you want to listen to?',
  'taste': 'What do you want to taste?',
  'burn': 'What do you want to burn?',
  'cut': 'What do you want to cut?',
  'dig': 'What do you want to dig in?',
  'wear': 'What do you want to wear?',
  'remove': 'What do you want to remove?'
};


/**
 * Scenery-specific error messages for objects that can't be manipulated
 * Maps object/verb combinations to exact Z-Machine messages
 */
export interface SceneryErrorMapping {
  objectPattern: RegExp | string;
  verb: string;
  message: string;
}

const SCENERY_ERROR_MAPPINGS: SceneryErrorMapping[] = [
  // TAKE scenery - "What a concept!" (Requirement 10.3)
  { objectPattern: /^(forest|trees?)$/i, verb: 'take', message: 'What a concept!' },
  { objectPattern: /^(white[\s-]?house|house)$/i, verb: 'take', message: 'What a concept!' },
  { objectPattern: /^(sky|sun|moon|stars?)$/i, verb: 'take', message: 'What a concept!' },
  { objectPattern: /^(ground|floor|earth)$/i, verb: 'take', message: 'What a concept!' },
  { objectPattern: /^(wall|walls|ceiling)$/i, verb: 'take', message: 'What a concept!' },
  { objectPattern: /^(air|wind|breeze)$/i, verb: 'take', message: 'What a concept!' },
  
  // TAKE large/impossible objects - "An interesting idea..." (Requirement 10.4)
  { objectPattern: /^(dam|reservoir|river|water)$/i, verb: 'take', message: 'An interesting idea...' },
  { objectPattern: /^(mountain|cliff|canyon)$/i, verb: 'take', message: 'An interesting idea...' },
  { objectPattern: /^(machine|control[\s-]?panel)$/i, verb: 'take', message: 'An interesting idea...' },
  
  // TURN without tools - "Your bare hands don't appear to be enough." (Requirement 2.2)
  { objectPattern: /^(bolt|screw|wheel|dial|knob)$/i, verb: 'turn', message: "Your bare hands don't appear to be enough." },
  
  // PUSH immovable - "Pushing the X isn't notably helpful." (Requirement 2.3)
  { objectPattern: /^(wall|tree|house|dam|machine)$/i, verb: 'push', message: "Pushing the {object} isn't notably helpful." },
  
  // PULL board - "You can't move the board." (Requirement 2.4)
  { objectPattern: /^board$/i, verb: 'pull', message: "You can't move the board." },
  
  // OPEN white house - "I can't see how to get in from here." (Requirement 2.5)
  { objectPattern: /^(white[\s-]?house|house)$/i, verb: 'open', message: "I can't see how to get in from here." }
];

/**
 * ErrorMessageStandardizer provides centralized Z-Machine error message generation
 */
export class ErrorMessageStandardizer {
  /**
   * Generate an error message for the given error type and context
   */
  static getError(errorType: ErrorType, context: ErrorContext = {}): string {
    switch (errorType) {
      // Parser errors
      case ErrorType.UNKNOWN_WORD:
        return this.unknownWord(context.word || 'that');
      
      case ErrorType.OBJECT_NOT_VISIBLE:
        return this.objectNotVisible(context.object || 'that');
      
      case ErrorType.VERB_NEEDS_OBJECT:
        return this.verbNeedsObject(context.verb || '');
      
      case ErrorType.DONT_HAVE:
        return this.dontHave();
      
      case ErrorType.EMPTY_INPUT:
        return this.emptyInput();
      
      case ErrorType.MALFORMED_INPUT:
        return this.malformedInput();
      
      // Container errors
      case ErrorType.CONTAINER_CLOSED:
        return this.containerClosed(context.container || 'container');
      
      // Scenery errors
      case ErrorType.TAKE_CONCEPT:
        return this.takeConcept();
      
      case ErrorType.TAKE_INTERESTING:
        return this.takeInteresting();
      
      case ErrorType.TURN_BARE_HANDS:
        return this.turnBareHands();
      
      case ErrorType.PUSH_NOT_HELPFUL:
        return this.pushNotHelpful(context.object || 'that');
      
      case ErrorType.PULL_CANT_MOVE:
        return this.pullCantMove(context.object || 'that');
      
      case ErrorType.OPEN_CANT_GET_IN:
        return this.openCantGetIn();
      
      // General errors
      case ErrorType.CANT_DO_THAT:
        return this.cantDoThat();
      
      case ErrorType.NOTHING_HAPPENS:
        return this.nothingHappens();
      
      default:
        return this.cantDoThat();
    }
  }

  // ============================================
  // Core Parser Error Messages (Requirement 1.1, 1.2, 1.3)
  // ============================================

  /**
   * "I don't know the word 'X'." - Unknown word error
   * Requirement 1.1
   */
  static unknownWord(word: string): string {
    return `I don't know the word "${word}".`;
  }

  /**
   * "You can't see any X here!" - Object not visible error
   * Requirement 1.2
   */
  static objectNotVisible(object: string): string {
    const cleanObject = this.cleanObjectName(object);
    return `You can't see any ${cleanObject} here!`;
  }

  /**
   * "What do you want to [verb]?" - Verb needs object error
   * Requirement 1.3
   */
  static verbNeedsObject(verb: string): string {
    const normalizedVerb = verb.toLowerCase().trim();
    return VERB_OBJECT_MESSAGES[normalizedVerb] || 
           `What do you want to ${normalizedVerb}?`;
  }

  /**
   * "You don't have that!" - Don't have object error
   * Requirement 2.6
   */
  static dontHave(): string {
    return "You don't have that!";
  }

  /**
   * "I beg your pardon?" - Empty/whitespace input error
   * Requirement 1.5
   */
  static emptyInput(): string {
    return "I beg your pardon?";
  }

  /**
   * "I don't understand that sentence." - Malformed input error
   * Requirement 1.6
   */
  static malformedInput(): string {
    return "I don't understand that sentence.";
  }

  // ============================================
  // Container Error Messages (Requirement 7.1)
  // ============================================

  /**
   * "The X is closed." - Container closed error
   * Requirement 7.1
   */
  static containerClosed(container: string): string {
    const cleanContainer = this.cleanObjectName(container);
    return `The ${cleanContainer} is closed.`;
  }

  // ============================================
  // Scenery Error Messages (Requirement 2.1, 2.2, 2.3, 2.4, 2.5, 10.2, 10.3, 10.4)
  // ============================================

  /**
   * "What a concept!" - Taking abstract/large scenery objects
   * Requirement 10.3
   */
  static takeConcept(): string {
    return "What a concept!";
  }

  /**
   * "An interesting idea..." - Taking impossible objects
   * Requirement 10.4
   */
  static takeInteresting(): string {
    return "An interesting idea...";
  }

  /**
   * "Your bare hands don't appear to be enough." - TURN without tools
   * Requirement 2.2
   */
  static turnBareHands(): string {
    return "Your bare hands don't appear to be enough.";
  }

  /**
   * "Pushing the X isn't notably helpful." - PUSH immovable objects
   * Requirement 2.3
   */
  static pushNotHelpful(object: string): string {
    const cleanObject = this.cleanObjectName(object);
    return `Pushing the ${cleanObject} isn't notably helpful.`;
  }

  /**
   * "You can't move the X." - PULL immovable objects (like board)
   * Requirement 2.4
   */
  static pullCantMove(object: string): string {
    const cleanObject = this.cleanObjectName(object);
    return `You can't move the ${cleanObject}.`;
  }

  /**
   * "I can't see how to get in from here." - OPEN white house
   * Requirement 2.5
   */
  static openCantGetIn(): string {
    return "I can't see how to get in from here.";
  }

  // ============================================
  // General Error Messages
  // ============================================

  /**
   * "You can't do that." - Generic action not possible
   */
  static cantDoThat(): string {
    return "You can't do that.";
  }

  /**
   * "Nothing happens." - Action has no effect
   */
  static nothingHappens(): string {
    return "Nothing happens.";
  }

  // ============================================
  // Scenery Error Lookup
  // ============================================

  /**
   * Get scenery-specific error message for object/verb combination
   * Returns null if no specific message exists
   */
  static getSceneryError(object: string, verb: string): string | null {
    const normalizedVerb = verb.toLowerCase().trim();
    const normalizedObject = object.toLowerCase().trim();
    
    for (const mapping of SCENERY_ERROR_MAPPINGS) {
      // Check if verb matches
      if (mapping.verb !== normalizedVerb) {
        continue;
      }
      
      // Check if object matches pattern
      const pattern = mapping.objectPattern;
      const matches = typeof pattern === 'string' 
        ? pattern.toLowerCase() === normalizedObject
        : pattern.test(normalizedObject);
      
      if (matches) {
        // Handle message interpolation
        return mapping.message.replace('{object}', normalizedObject);
      }
    }
    
    return null;
  }

  /**
   * Check if an object is scenery (can't be taken/manipulated)
   */
  static isSceneryObject(object: string): boolean {
    const normalizedObject = object.toLowerCase().trim();
    
    // Check against all scenery patterns
    for (const mapping of SCENERY_ERROR_MAPPINGS) {
      const pattern = mapping.objectPattern;
      const matches = typeof pattern === 'string'
        ? pattern.toLowerCase() === normalizedObject
        : pattern.test(normalizedObject);
      
      if (matches) {
        return true;
      }
    }
    
    return false;
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Clean object name for use in error messages
   * Removes articles and normalizes case
   */
  private static cleanObjectName(object: string): string {
    if (!object) return 'that';
    
    // Remove leading articles
    let cleaned = object.replace(/^(the|a|an)\s+/i, '');
    
    // Normalize to lowercase
    cleaned = cleaned.toLowerCase().trim();
    
    return cleaned || 'that';
  }

  /**
   * Get all supported verb-object messages
   */
  static getVerbObjectMessages(): Record<string, string> {
    return { ...VERB_OBJECT_MESSAGES };
  }

  /**
   * Get all scenery error mappings
   */
  static getSceneryErrorMappings(): SceneryErrorMapping[] {
    return [...SCENERY_ERROR_MAPPINGS];
  }

  /**
   * Check if a verb requires an object
   */
  static verbRequiresObject(verb: string): boolean {
    const normalizedVerb = verb.toLowerCase().trim();
    return normalizedVerb in VERB_OBJECT_MESSAGES;
  }
}

// Export convenience functions for direct use
// These are bound to preserve the class context
export const unknownWord = (word: string): string => ErrorMessageStandardizer.unknownWord(word);
export const objectNotVisible = (object: string): string => ErrorMessageStandardizer.objectNotVisible(object);
export const verbNeedsObject = (verb: string): string => ErrorMessageStandardizer.verbNeedsObject(verb);
export const dontHave = (): string => ErrorMessageStandardizer.dontHave();
export const emptyInput = (): string => ErrorMessageStandardizer.emptyInput();
export const malformedInput = (): string => ErrorMessageStandardizer.malformedInput();
export const containerClosed = (container: string): string => ErrorMessageStandardizer.containerClosed(container);
export const takeConcept = (): string => ErrorMessageStandardizer.takeConcept();
export const takeInteresting = (): string => ErrorMessageStandardizer.takeInteresting();
export const turnBareHands = (): string => ErrorMessageStandardizer.turnBareHands();
export const pushNotHelpful = (object: string): string => ErrorMessageStandardizer.pushNotHelpful(object);
export const pullCantMove = (object: string): string => ErrorMessageStandardizer.pullCantMove(object);
export const openCantGetIn = (): string => ErrorMessageStandardizer.openCantGetIn();
export const cantDoThat = (): string => ErrorMessageStandardizer.cantDoThat();
export const nothingHappens = (): string => ErrorMessageStandardizer.nothingHappens();
export const getSceneryError = (object: string, verb: string): string | null => ErrorMessageStandardizer.getSceneryError(object, verb);
