/**
 * ObjectInteractionHarmonizer Tests
 * 
 * Property 7: Error Message Consistency
 * Tests that for any error condition, TypeScript produces identical messages to Z-Machine
 * 
 * Validates: Requirements 3.1, 3.2, 4.1, 4.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ObjectInteractionHarmonizer } from './ObjectInteractionHarmonizer.js';
import { GameState } from '../game/state.js';

describe('ObjectInteractionHarmonizer', () => {
  let harmonizer: ObjectInteractionHarmonizer;
  let state: GameState;

  beforeEach(() => {
    harmonizer = new ObjectInteractionHarmonizer();
    state = new GameState();
  });

  describe('Unit Tests - Drop Command', () => {
    it('should harmonize "drop" without object to Z-Machine format', () => {
      const tsMessage = "There seems to be a noun missing in that sentence!";
      const result = harmonizer.harmonizeDropCommand(tsMessage, false);
      
      expect(result).toBe("What do you want to drop?");
    });

    it('should not change "drop" message when object is provided', () => {
      const tsMessage = "Dropped.";
      const result = harmonizer.harmonizeDropCommand(tsMessage, true);
      
      expect(result).toBe("Dropped.");
    });
  });

  describe('Unit Tests - Object Visibility', () => {
    it('should harmonize "put" visibility error to possession error', () => {
      const tsMessage = "You can't see any box here!";
      const result = harmonizer.harmonizeObjectVisibility(tsMessage, 'box', false, 'put');
      
      expect(result).toBe("You don't have that!");
    });

    it('should not change visibility error for non-put commands', () => {
      const tsMessage = "You can't see any box here!";
      const result = harmonizer.harmonizeObjectVisibility(tsMessage, 'box', false, 'examine');
      
      expect(result).toBe("You can't see any box here!");
    });
  });

  describe('Unit Tests - Verb Without Object Errors', () => {
    it('should return correct error for "drop" without object', () => {
      const error = harmonizer.getVerbWithoutObjectError('drop');
      expect(error).toBe("What do you want to drop?");
    });

    it('should return correct error for "take" without object', () => {
      const error = harmonizer.getVerbWithoutObjectError('take');
      expect(error).toBe("What do you want to take?");
    });

    it('should return correct error for "get" without object', () => {
      const error = harmonizer.getVerbWithoutObjectError('get');
      expect(error).toBe("What do you want to take?");
    });

    it('should return correct error for "put" without object', () => {
      const error = harmonizer.getVerbWithoutObjectError('put');
      expect(error).toBe("What do you want to put?");
    });

    it('should return default error for unknown verb', () => {
      const error = harmonizer.getVerbWithoutObjectError('xyzzy');
      expect(error).toBe("There seems to be a noun missing in that sentence!");
    });
  });

  describe('Unit Tests - Error Detection', () => {
    it('should detect object visibility errors', () => {
      expect(harmonizer.isObjectVisibilityError("You can't see any lamp here!")).toBe(true);
      expect(harmonizer.isObjectVisibilityError("I don't see any lamp here.")).toBe(true);
      expect(harmonizer.isObjectVisibilityError("There is no lamp here.")).toBe(true);
      expect(harmonizer.isObjectVisibilityError("Taken.")).toBe(false);
    });

    it('should detect possession errors', () => {
      expect(harmonizer.isPossessionError("You don't have that!")).toBe(true);
      expect(harmonizer.isPossessionError("You aren't holding that.")).toBe(true);
      expect(harmonizer.isPossessionError("Taken.")).toBe(false);
    });
  });

  describe('Unit Tests - Error Format Normalization', () => {
    it('should capitalize first letter', () => {
      const result = harmonizer.normalizeErrorFormat("you can't do that");
      expect(result.charAt(0)).toBe('Y');
    });

    it('should add period if missing', () => {
      const result = harmonizer.normalizeErrorFormat("You can't do that");
      expect(result).toBe("You can't do that.");
    });

    it('should not add period if already present', () => {
      const result = harmonizer.normalizeErrorFormat("You can't do that.");
      expect(result).toBe("You can't do that.");
    });

    it('should not add period if ends with question mark', () => {
      const result = harmonizer.normalizeErrorFormat("What do you want to drop?");
      expect(result).toBe("What do you want to drop?");
    });
  });

  describe('Property 7: Error Message Consistency', () => {
    /**
     * Property: Drop without object produces consistent error
     * For any "drop" command without object, error should match Z-Machine
     */
    it('should produce consistent "drop" without object errors', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (hasObject) => {
            const tsMessage = hasObject 
              ? "Dropped." 
              : "There seems to be a noun missing in that sentence!";
            
            const result = harmonizer.harmonizeDropCommand(tsMessage, hasObject);
            
            if (!hasObject) {
              expect(result).toBe("What do you want to drop?");
            } else {
              expect(result).toBe("Dropped.");
            }
            
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Property: Verb without object errors are consistent
     * For any verb that requires an object, error format should be consistent
     */
    it('should produce consistent verb-without-object errors', () => {
      const verbs = ['drop', 'take', 'get', 'put', 'examine', 'open', 'close', 'read'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...verbs),
          (verb) => {
            const error = harmonizer.getVerbWithoutObjectError(verb);
            
            // All errors should be questions
            expect(error).toMatch(/\?$/);
            // All errors should start with "What do you want to"
            expect(error).toMatch(/^What do you want to/);
            
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Property: Object visibility errors are properly formatted
     * For any object name, visibility error should follow Z-Machine format
     */
    it('should format object visibility errors consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z]+$/i.test(s)),
          (objectName) => {
            const tsMessage = `You can't see any ${objectName} here!`;
            
            // For non-put commands, message should stay the same
            const result = harmonizer.harmonizeObjectVisibility(tsMessage, objectName, false, 'examine');
            expect(result).toBe(tsMessage);
            
            // For put commands without possession, should change to "You don't have that!"
            const putResult = harmonizer.harmonizeObjectVisibility(tsMessage, objectName, false, 'put');
            expect(putResult).toBe("You don't have that!");
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Harmonization is idempotent
     * Harmonizing an already-harmonized message should not change it
     */
    it('should be idempotent - harmonizing twice produces same result', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "What do you want to drop?",
            "You don't have that!",
            "Taken.",
            "Dropped."
          ),
          fc.constantFrom('drop', 'take', 'put', 'examine'),
          (message, verb) => {
            const command = `${verb} something`;
            
            const result1 = harmonizer.harmonizeResponse(message, command, state);
            const result2 = harmonizer.harmonizeResponse(result1.message, command, state);
            
            expect(result1.message).toBe(result2.message);
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    /**
     * Property: Error detection is accurate
     * Visibility and possession errors should be correctly identified
     */
    it('should accurately detect error types', () => {
      const visibilityErrors = [
        "You can't see any lamp here!",
        "I don't see any sword here.",
        "There is no key here."
      ];
      
      const possessionErrors = [
        "You don't have that!",
        "You aren't holding that.",
        "You're not carrying that."
      ];
      
      const nonErrors = [
        "Taken.",
        "Dropped.",
        "OK.",
        "You are in a forest."
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...visibilityErrors),
          (error) => {
            expect(harmonizer.isObjectVisibilityError(error)).toBe(true);
            return true;
          }
        ),
        { numRuns: 10 }
      );
      
      fc.assert(
        fc.property(
          fc.constantFrom(...possessionErrors),
          (error) => {
            expect(harmonizer.isPossessionError(error)).toBe(true);
            return true;
          }
        ),
        { numRuns: 10 }
      );
      
      fc.assert(
        fc.property(
          fc.constantFrom(...nonErrors),
          (message) => {
            expect(harmonizer.isObjectVisibilityError(message)).toBe(false);
            expect(harmonizer.isPossessionError(message)).toBe(false);
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Integration Tests', () => {
    it('should harmonize full response for drop command', () => {
      const result = harmonizer.harmonizeResponse(
        "There seems to be a noun missing in that sentence!",
        "drop",
        state
      );
      
      expect(result.wasHarmonized).toBe(true);
      expect(result.message).toBe("What do you want to drop?");
    });

    it('should not harmonize successful commands', () => {
      const result = harmonizer.harmonizeResponse(
        "Dropped.",
        "drop lamp",
        state
      );
      
      expect(result.wasHarmonized).toBe(false);
      expect(result.message).toBe("Dropped.");
    });
  });

  describe('Container Interaction Alignment - Requirements 3.3', () => {
    it('should align PUT command error when object is known but not possessed', () => {
      const context = {
        verb: 'put',
        directObjectName: 'box',
        indirectObjectName: 'board',
        isDirectObjectInInventory: false,
        isDirectObjectVisible: false,
        isDirectObjectKnown: true,
        isIndirectObjectContainer: true,
        isIndirectObjectOpen: true
      };
      
      const result = harmonizer.alignContainerInteractions(
        "You can't see any box here!",
        context
      );
      
      expect(result.wasHarmonized).toBe(true);
      expect(result.message).toBe("You don't have that!");
      expect(result.harmonizationType).toBe('put_possession');
    });

    it('should align PUT command error when object is visible but not in inventory', () => {
      const context = {
        verb: 'put',
        directObjectName: 'sword',
        indirectObjectName: 'chest',
        isDirectObjectInInventory: false,
        isDirectObjectVisible: true,
        isDirectObjectKnown: true,
        isIndirectObjectContainer: true,
        isIndirectObjectOpen: true
      };
      
      const result = harmonizer.alignContainerInteractions(
        "You don't have the sword.",
        context
      );
      
      expect(result.wasHarmonized).toBe(true);
      expect(result.message).toBe("You don't have the sword.");
      expect(result.harmonizationType).toBe('put_not_holding');
    });

    it('should not harmonize PUT command when object is in inventory', () => {
      const context = {
        verb: 'put',
        directObjectName: 'lamp',
        indirectObjectName: 'chest',
        isDirectObjectInInventory: true,
        isDirectObjectVisible: true,
        isDirectObjectKnown: true,
        isIndirectObjectContainer: true,
        isIndirectObjectOpen: true
      };
      
      const result = harmonizer.alignContainerInteractions(
        "Done.",
        context
      );
      
      expect(result.wasHarmonized).toBe(false);
      expect(result.message).toBe("Done.");
    });

    it('should align REMOVE command error when container is closed', () => {
      const context = {
        verb: 'remove',
        directObjectName: 'key',
        indirectObjectName: 'chest',
        isDirectObjectInInventory: false,
        isDirectObjectVisible: false,
        isDirectObjectKnown: true,
        isIndirectObjectContainer: true,
        isIndirectObjectOpen: false
      };
      
      const result = harmonizer.alignContainerInteractions(
        "The chest is closed.",
        context
      );
      
      expect(result.wasHarmonized).toBe(true);
      expect(result.message).toBe("The chest is closed.");
      expect(result.harmonizationType).toBe('container_closed');
    });

    it('should handle PLACE as synonym for PUT', () => {
      const context = {
        verb: 'place',
        directObjectName: 'coin',
        indirectObjectName: 'box',
        isDirectObjectInInventory: false,
        isDirectObjectVisible: false,
        isDirectObjectKnown: true,
        isIndirectObjectContainer: true,
        isIndirectObjectOpen: true
      };
      
      const result = harmonizer.alignContainerInteractions(
        "You can't see any coin here!",
        context
      );
      
      expect(result.wasHarmonized).toBe(true);
      expect(result.message).toBe("You don't have that!");
    });

    it('should handle INSERT as synonym for PUT', () => {
      const context = {
        verb: 'insert',
        directObjectName: 'key',
        indirectObjectName: 'lock',
        isDirectObjectInInventory: false,
        isDirectObjectVisible: false,
        isDirectObjectKnown: true,
        isIndirectObjectContainer: true,
        isIndirectObjectOpen: true
      };
      
      const result = harmonizer.alignContainerInteractions(
        "You can't see any key here!",
        context
      );
      
      expect(result.wasHarmonized).toBe(true);
      expect(result.message).toBe("You don't have that!");
    });
  });

  describe('Property 8: Object Interaction Parity - Container Operations', () => {
    /**
     * Property: PUT command errors are consistent with Z-Machine
     * For any PUT command where player doesn't have the object,
     * error should be "You don't have that!" not "You can't see any X here!"
     */
    it('should produce consistent PUT command errors for missing objects', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-z]+$/i.test(s)),
          fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-z]+$/i.test(s)),
          (objectName, containerName) => {
            const context = {
              verb: 'put',
              directObjectName: objectName,
              indirectObjectName: containerName,
              isDirectObjectInInventory: false,
              isDirectObjectVisible: false,
              isDirectObjectKnown: true,
              isIndirectObjectContainer: true,
              isIndirectObjectOpen: true
            };
            
            const result = harmonizer.alignContainerInteractions(
              `You can't see any ${objectName} here!`,
              context
            );
            
            // Z-Machine says "You don't have that!" for known objects not in inventory
            expect(result.message).toBe("You don't have that!");
            expect(result.wasHarmonized).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Container interaction alignment is idempotent
     * Aligning an already-aligned message should not change it
     */
    it('should be idempotent for container interactions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('put', 'place', 'insert'),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/i.test(s)),
          (verb, objectName) => {
            const context = {
              verb,
              directObjectName: objectName,
              indirectObjectName: 'container',
              isDirectObjectInInventory: false,
              isDirectObjectVisible: false,
              isDirectObjectKnown: true,
              isIndirectObjectContainer: true,
              isIndirectObjectOpen: true
            };
            
            const result1 = harmonizer.alignContainerInteractions(
              `You can't see any ${objectName} here!`,
              context
            );
            
            const result2 = harmonizer.alignContainerInteractions(
              result1.message,
              context
            );
            
            expect(result1.message).toBe(result2.message);
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Inventory State Management - Requirements 3.4', () => {
    it('should synchronize inventory add operation', () => {
      const testState = new GameState();
      
      const result = harmonizer.synchronizeInventoryState(testState, 'add', 'TEST_ITEM');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Taken.');
      expect(testState.isInInventory('TEST_ITEM')).toBe(true);
    });

    it('should prevent duplicate inventory add', () => {
      const testState = new GameState();
      testState.addToInventory('TEST_ITEM');
      
      const result = harmonizer.synchronizeInventoryState(testState, 'add', 'TEST_ITEM');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe("You're already carrying that!");
    });

    it('should synchronize inventory remove operation', () => {
      const testState = new GameState();
      testState.addToInventory('TEST_ITEM');
      
      const result = harmonizer.synchronizeInventoryState(testState, 'remove', 'TEST_ITEM');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Dropped.');
      expect(testState.isInInventory('TEST_ITEM')).toBe(false);
    });

    it('should prevent removing non-existent item', () => {
      const testState = new GameState();
      
      const result = harmonizer.synchronizeInventoryState(testState, 'remove', 'TEST_ITEM');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe("You're not carrying that!");
    });

    it('should check inventory state correctly', () => {
      const testState = new GameState();
      testState.addToInventory('TEST_ITEM');
      
      const hasResult = harmonizer.synchronizeInventoryState(testState, 'check', 'TEST_ITEM');
      expect(hasResult.success).toBe(true);
      expect(hasResult.message).toBe('You have it.');
      
      const notHasResult = harmonizer.synchronizeInventoryState(testState, 'check', 'OTHER_ITEM');
      expect(notHasResult.success).toBe(false);
      expect(notHasResult.message).toBe("You don't have that!");
    });

    it('should get correct inventory operation error for drop', () => {
      const error = harmonizer.getInventoryOperationError('drop', 'sword');
      expect(error).toBe("You don't have the sword.");
    });

    it('should get correct inventory operation error for take', () => {
      const error = harmonizer.getInventoryOperationError('take', 'lamp');
      expect(error).toBe("You can't see any lamp here!");
    });

    it('should get correct inventory operation error for put', () => {
      const error = harmonizer.getInventoryOperationError('put', 'coin');
      expect(error).toBe("You don't have that!");
    });

    it('should validate inventory state correctly', () => {
      const testState = new GameState();
      
      // Valid state
      const validResult = harmonizer.validateInventoryState(testState);
      expect(validResult.isValid).toBe(true);
      expect(validResult.issues.length).toBe(0);
    });
  });
});
