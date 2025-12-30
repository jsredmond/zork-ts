/**
 * Unit tests for ErrorMessageStandardizer
 * 
 * Tests that each message template produces correct Z-Machine format
 * and that message substitution works correctly.
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 7.1
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorMessageStandardizer,
  ErrorType,
  unknownWord,
  objectNotVisible,
  verbNeedsObject,
  dontHave,
  emptyInput,
  malformedInput,
  containerClosed,
  takeConcept,
  takeInteresting,
  turnBareHands,
  pushNotHelpful,
  pullCantMove,
  openCantGetIn,
  cantDoThat,
  nothingHappens,
  getSceneryError
} from './ErrorMessageStandardizer';

describe('ErrorMessageStandardizer', () => {
  describe('Core Parser Error Messages (Requirement 1.1, 1.2, 1.3)', () => {
    it('should format unknown word error correctly', () => {
      expect(unknownWord('room')).toBe('I don\'t know the word "room".');
      expect(unknownWord('area')).toBe('I don\'t know the word "area".');
      expect(unknownWord('xyz')).toBe('I don\'t know the word "xyz".');
    });

    it('should format object not visible error correctly', () => {
      expect(objectNotVisible('sword')).toBe("You can't see any sword here!");
      expect(objectNotVisible('lamp')).toBe("You can't see any lamp here!");
      expect(objectNotVisible('the lamp')).toBe("You can't see any lamp here!");
    });

    it('should format verb needs object error correctly', () => {
      expect(verbNeedsObject('drop')).toBe('What do you want to drop?');
      expect(verbNeedsObject('take')).toBe('What do you want to take?');
      expect(verbNeedsObject('get')).toBe('What do you want to take?');
      expect(verbNeedsObject('put')).toBe('What do you want to put?');
      expect(verbNeedsObject('examine')).toBe('What do you want to examine?');
      expect(verbNeedsObject('open')).toBe('What do you want to open?');
      expect(verbNeedsObject('close')).toBe('What do you want to close?');
      expect(verbNeedsObject('read')).toBe('What do you want to read?');
      expect(verbNeedsObject('attack')).toBe('What do you want to attack?');
      expect(verbNeedsObject('kill')).toBe('What do you want to attack?');
    });

    it('should format dont have error correctly', () => {
      expect(dontHave()).toBe("You don't have that!");
    });

    it('should format empty input error correctly', () => {
      expect(emptyInput()).toBe('I beg your pardon?');
    });

    it('should format malformed input error correctly', () => {
      expect(malformedInput()).toBe("I don't understand that sentence.");
    });
  });

  describe('Container Error Messages (Requirement 7.1)', () => {
    it('should format container closed error correctly', () => {
      expect(containerClosed('trophy case')).toBe('The trophy case is closed.');
      expect(containerClosed('bag')).toBe('The bag is closed.');
      expect(containerClosed('the coffin')).toBe('The coffin is closed.');
    });
  });

  describe('Scenery Error Messages (Requirement 2.1, 2.2, 2.3, 2.4, 2.5)', () => {
    it('should return "What a concept!" for taking abstract objects', () => {
      expect(takeConcept()).toBe('What a concept!');
    });

    it('should return "An interesting idea..." for taking impossible objects', () => {
      expect(takeInteresting()).toBe('An interesting idea...');
    });

    it('should return bare hands message for TURN without tools', () => {
      expect(turnBareHands()).toBe("Your bare hands don't appear to be enough.");
    });

    it('should format push not helpful message correctly', () => {
      expect(pushNotHelpful('wall')).toBe("Pushing the wall isn't notably helpful.");
      expect(pushNotHelpful('tree')).toBe("Pushing the tree isn't notably helpful.");
    });

    it('should format pull cant move message correctly', () => {
      expect(pullCantMove('board')).toBe("You can't move the board.");
    });

    it('should return cant get in message for OPEN white house', () => {
      expect(openCantGetIn()).toBe("I can't see how to get in from here.");
    });
  });

  describe('General Error Messages', () => {
    it('should return generic cant do that message', () => {
      expect(cantDoThat()).toBe("You can't do that.");
    });

    it('should return nothing happens message', () => {
      expect(nothingHappens()).toBe('Nothing happens.');
    });
  });

  describe('getError() method', () => {
    it('should return correct message for each error type', () => {
      expect(ErrorMessageStandardizer.getError(ErrorType.UNKNOWN_WORD, { word: 'test' }))
        .toBe('I don\'t know the word "test".');
      
      expect(ErrorMessageStandardizer.getError(ErrorType.OBJECT_NOT_VISIBLE, { object: 'lamp' }))
        .toBe("You can't see any lamp here!");
      
      expect(ErrorMessageStandardizer.getError(ErrorType.VERB_NEEDS_OBJECT, { verb: 'drop' }))
        .toBe('What do you want to drop?');
      
      expect(ErrorMessageStandardizer.getError(ErrorType.DONT_HAVE))
        .toBe("You don't have that!");
      
      expect(ErrorMessageStandardizer.getError(ErrorType.EMPTY_INPUT))
        .toBe('I beg your pardon?');
      
      expect(ErrorMessageStandardizer.getError(ErrorType.MALFORMED_INPUT))
        .toBe("I don't understand that sentence.");
      
      expect(ErrorMessageStandardizer.getError(ErrorType.CONTAINER_CLOSED, { container: 'box' }))
        .toBe('The box is closed.');
      
      expect(ErrorMessageStandardizer.getError(ErrorType.TAKE_CONCEPT))
        .toBe('What a concept!');
      
      expect(ErrorMessageStandardizer.getError(ErrorType.TAKE_INTERESTING))
        .toBe('An interesting idea...');
      
      expect(ErrorMessageStandardizer.getError(ErrorType.TURN_BARE_HANDS))
        .toBe("Your bare hands don't appear to be enough.");
      
      expect(ErrorMessageStandardizer.getError(ErrorType.PUSH_NOT_HELPFUL, { object: 'wall' }))
        .toBe("Pushing the wall isn't notably helpful.");
      
      expect(ErrorMessageStandardizer.getError(ErrorType.PULL_CANT_MOVE, { object: 'board' }))
        .toBe("You can't move the board.");
      
      expect(ErrorMessageStandardizer.getError(ErrorType.OPEN_CANT_GET_IN))
        .toBe("I can't see how to get in from here.");
    });

    it('should use default values when context is missing', () => {
      expect(ErrorMessageStandardizer.getError(ErrorType.UNKNOWN_WORD))
        .toBe('I don\'t know the word "that".');
      
      expect(ErrorMessageStandardizer.getError(ErrorType.OBJECT_NOT_VISIBLE))
        .toBe("You can't see any that here!");
    });
  });

  describe('getSceneryError() method', () => {
    it('should return correct message for TAKE forest', () => {
      expect(getSceneryError('forest', 'take')).toBe('What a concept!');
      expect(getSceneryError('trees', 'take')).toBe('What a concept!');
    });

    it('should return correct message for TAKE house', () => {
      expect(getSceneryError('white house', 'take')).toBe('What a concept!');
      expect(getSceneryError('house', 'take')).toBe('What a concept!');
    });

    it('should return correct message for TAKE dam/reservoir', () => {
      expect(getSceneryError('dam', 'take')).toBe('An interesting idea...');
      expect(getSceneryError('reservoir', 'take')).toBe('An interesting idea...');
    });

    it('should return correct message for TURN bolt', () => {
      expect(getSceneryError('bolt', 'turn')).toBe("Your bare hands don't appear to be enough.");
    });

    it('should return correct message for PUSH wall', () => {
      expect(getSceneryError('wall', 'push')).toBe("Pushing the wall isn't notably helpful.");
    });

    it('should return correct message for PULL board', () => {
      expect(getSceneryError('board', 'pull')).toBe("You can't move the board.");
    });

    it('should return correct message for OPEN white house', () => {
      expect(getSceneryError('white house', 'open')).toBe("I can't see how to get in from here.");
      expect(getSceneryError('house', 'open')).toBe("I can't see how to get in from here.");
    });

    it('should return null for non-scenery objects', () => {
      expect(getSceneryError('sword', 'take')).toBeNull();
      expect(getSceneryError('lamp', 'take')).toBeNull();
    });

    it('should return null for non-matching verb/object combinations', () => {
      expect(getSceneryError('forest', 'open')).toBeNull();
      expect(getSceneryError('board', 'take')).toBeNull();
    });
  });

  describe('isSceneryObject() method', () => {
    it('should identify scenery objects', () => {
      expect(ErrorMessageStandardizer.isSceneryObject('forest')).toBe(true);
      expect(ErrorMessageStandardizer.isSceneryObject('white house')).toBe(true);
      expect(ErrorMessageStandardizer.isSceneryObject('dam')).toBe(true);
      expect(ErrorMessageStandardizer.isSceneryObject('board')).toBe(true);
    });

    it('should not identify regular objects as scenery', () => {
      expect(ErrorMessageStandardizer.isSceneryObject('sword')).toBe(false);
      expect(ErrorMessageStandardizer.isSceneryObject('lamp')).toBe(false);
      expect(ErrorMessageStandardizer.isSceneryObject('rope')).toBe(false);
    });
  });

  describe('verbRequiresObject() method', () => {
    it('should return true for verbs that require objects', () => {
      expect(ErrorMessageStandardizer.verbRequiresObject('take')).toBe(true);
      expect(ErrorMessageStandardizer.verbRequiresObject('drop')).toBe(true);
      expect(ErrorMessageStandardizer.verbRequiresObject('put')).toBe(true);
      expect(ErrorMessageStandardizer.verbRequiresObject('examine')).toBe(true);
    });

    it('should return false for unknown verbs', () => {
      expect(ErrorMessageStandardizer.verbRequiresObject('xyzzy')).toBe(false);
      expect(ErrorMessageStandardizer.verbRequiresObject('plugh')).toBe(false);
    });
  });

  describe('Message substitution', () => {
    it('should clean object names by removing articles', () => {
      expect(objectNotVisible('the sword')).toBe("You can't see any sword here!");
      expect(objectNotVisible('a lamp')).toBe("You can't see any lamp here!");
      expect(objectNotVisible('an egg')).toBe("You can't see any egg here!");
    });

    it('should handle empty object names', () => {
      expect(objectNotVisible('')).toBe("You can't see any that here!");
    });

    it('should normalize case in object names', () => {
      expect(objectNotVisible('SWORD')).toBe("You can't see any sword here!");
      expect(objectNotVisible('Lamp')).toBe("You can't see any lamp here!");
    });
  });
});
