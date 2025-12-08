/**
 * Tests for scenery action handlers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  handleSceneryAction, 
  hasSceneryHandler,
  executeSceneryAction 
} from './sceneryActions.js';
import { GameState } from './state.js';
import { createInitialGameState } from './factories/gameFactory.js';

describe('Scenery Action Handlers', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialGameState();
  });

  describe('BOARD handler', () => {
    it('should return message for TAKE action', () => {
      const result = handleSceneryAction('BOARD', 'TAKE', state);
      expect(result).toBe('The boards are securely fastened.');
    });

    it('should return message for EXAMINE action', () => {
      const result = handleSceneryAction('BOARD', 'EXAMINE', state);
      expect(result).toBe('The boards are securely fastened.');
    });

    it('should return message for REMOVE action', () => {
      const result = handleSceneryAction('BOARD', 'REMOVE', state);
      expect(result).toBe('The boards are securely fastened.');
    });
  });

  describe('GRANITE-WALL handler', () => {
    it('should return different message in SLIDE-ROOM', () => {
      state.currentRoom = 'SLIDE-ROOM';
      const result = handleSceneryAction('GRANITE-WALL', 'TAKE', state);
      expect(result).toBe("The wall isn't granite.");
    });

    it('should return standard message in other rooms', () => {
      state.currentRoom = 'WEST-OF-HOUSE';
      const result = handleSceneryAction('GRANITE-WALL', 'TAKE', state);
      expect(result).toBe("It's solid granite.");
    });

    it('should return location-specific message for FIND in NORTH-TEMPLE', () => {
      state.currentRoom = 'NORTH-TEMPLE';
      const result = handleSceneryAction('GRANITE-WALL', 'FIND', state);
      expect(result).toBe('The west wall is solid granite here.');
    });

    it('should return location-specific message for FIND in TREASURE-ROOM', () => {
      state.currentRoom = 'TREASURE-ROOM';
      const result = handleSceneryAction('GRANITE-WALL', 'FIND', state);
      expect(result).toBe('The east wall is solid granite here.');
    });
  });

  describe('WHITE-HOUSE handler', () => {
    it('should return snarky message when inside house', () => {
      state.currentRoom = 'LIVING-ROOM';
      const result = handleSceneryAction('WHITE-HOUSE', 'EXAMINE', state);
      expect(result).toBe('Why not find your brains?');
    });

    it('should return description when outside house', () => {
      state.currentRoom = 'WEST-OF-HOUSE';
      const result = handleSceneryAction('WHITE-HOUSE', 'EXAMINE', state);
      expect(result).toContain('colonial house');
    });
  });

  describe('FOREST handler', () => {
    it('should return message for TAKE action', () => {
      const result = handleSceneryAction('FOREST', 'TAKE', state);
      expect(result).toBe("You can't be serious.");
    });

    it('should return message for EXAMINE action', () => {
      const result = handleSceneryAction('FOREST', 'EXAMINE', state);
      expect(result).toContain('forest');
    });
  });

  describe('SONGBIRD handler', () => {
    it('should return message for FIND action', () => {
      const result = handleSceneryAction('SONGBIRD', 'FIND', state);
      expect(result).toBe('The songbird is not here but is probably nearby.');
    });

    it('should return message for LISTEN action', () => {
      const result = handleSceneryAction('SONGBIRD', 'LISTEN', state);
      expect(result).toBe("You can't hear the songbird now.");
    });

    it('should return message for FOLLOW action', () => {
      const result = handleSceneryAction('SONGBIRD', 'FOLLOW', state);
      expect(result).toBe("It can't be followed.");
    });
  });

  describe('TEETH handler', () => {
    it('should return dental hygiene message when no items in inventory', () => {
      const result = handleSceneryAction('TEETH', 'BRUSH', state);
      expect(result).toContain('Dental hygiene');
    });

    it('should return death message when player has putty', () => {
      // Add putty to inventory
      state.addToInventory('PUTTY');
      const result = handleSceneryAction('TEETH', 'BRUSH', state);
      expect(result).toContain('grue');
    });
  });

  describe('hasSceneryHandler', () => {
    it('should return true for registered handlers', () => {
      expect(hasSceneryHandler('BOARD')).toBe(true);
      expect(hasSceneryHandler('GRANITE-WALL')).toBe(true);
      expect(hasSceneryHandler('SONGBIRD')).toBe(true);
    });

    it('should return false for unregistered handlers', () => {
      expect(hasSceneryHandler('NONEXISTENT')).toBe(false);
    });
  });

  describe('executeSceneryAction', () => {
    it('should return ActionResult for valid scenery action', () => {
      const result = executeSceneryAction('BOARD', 'TAKE', state);
      expect(result).not.toBeNull();
      // Scenery actions that indicate failure (like "securely fastened") should return success: false
      expect(result?.success).toBe(false);
      expect(result?.message).toBe('The boards are securely fastened.');
      expect(result?.stateChanges).toEqual([]);
    });

    it('should return null for invalid scenery action', () => {
      const result = executeSceneryAction('NONEXISTENT', 'TAKE', state);
      expect(result).toBeNull();
    });
  });
});


describe('Property-Based Tests', () => {
  describe('Property 2: Scenery action coverage', () => {
    /**
     * Feature: complete-text-accuracy, Property 2: Scenery action coverage
     * Validates: Requirements 1.1, 1.2, 1.3, 1.4
     * 
     * For any scenery object and any verb attempted on it, if the original ZIL 
     * has a message for that combination, the TypeScript implementation should 
     * display that message
     */
    it('should have handlers for all registered scenery objects', () => {
      const sceneryObjects = [
        'BOARD',
        'GRANITE-WALL',
        'WHITE-HOUSE',
        'FOREST',
        'SONGBIRD',
        'TEETH',
        'WALL',
        'TREE',
        'MOUNTAIN-RANGE',
        'LEAVES',
        'SAND'
      ];

      for (const objectId of sceneryObjects) {
        expect(hasSceneryHandler(objectId)).toBe(true);
      }
    });

    it('should return non-null messages for all registered scenery actions', () => {
      const state = createInitialGameState();
      
      const sceneryActions = [
        { object: 'BOARD', verb: 'TAKE' },
        { object: 'BOARD', verb: 'EXAMINE' },
        { object: 'BOARD', verb: 'REMOVE' },
        { object: 'GRANITE-WALL', verb: 'TAKE' },
        { object: 'GRANITE-WALL', verb: 'EXAMINE' },
        { object: 'GRANITE-WALL', verb: 'FIND' },
        { object: 'WHITE-HOUSE', verb: 'EXAMINE' },
        { object: 'WHITE-HOUSE', verb: 'TAKE' },
        { object: 'FOREST', verb: 'TAKE' },
        { object: 'FOREST', verb: 'EXAMINE' },
        { object: 'SONGBIRD', verb: 'FIND' },
        { object: 'SONGBIRD', verb: 'LISTEN' },
        { object: 'TEETH', verb: 'BRUSH' },
        { object: 'WALL', verb: 'EXAMINE' },
        { object: 'TREE', verb: 'EXAMINE' },
        { object: 'MOUNTAIN-RANGE', verb: 'EXAMINE' },
        { object: 'LEAVES', verb: 'EXAMINE' },
        { object: 'SAND', verb: 'EXAMINE' }
      ];

      for (const { object, verb } of sceneryActions) {
        const result = handleSceneryAction(object, verb, state);
        expect(result).not.toBeNull();
        expect(typeof result).toBe('string');
        expect(result!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Property 1: Message text exactness (scenery subset)', () => {
    /**
     * Feature: complete-text-accuracy, Property 1: Message text exactness (scenery subset)
     * Validates: Requirements 1.5
     * 
     * For any implemented scenery message, the text displayed to the player should 
     * match the original ZIL message exactly (ignoring whitespace normalization)
     */
    it('should match exact messages from ZIL source for BOARD', () => {
      const state = createInitialGameState();
      const result = handleSceneryAction('BOARD', 'TAKE', state);
      expect(result).toBe('The boards are securely fastened.');
    });

    it('should match exact messages from ZIL source for GRANITE-WALL', () => {
      const state = createInitialGameState();
      
      state.currentRoom = 'SLIDE-ROOM';
      expect(handleSceneryAction('GRANITE-WALL', 'TAKE', state))
        .toBe("The wall isn't granite.");
      
      state.currentRoom = 'NORTH-TEMPLE';
      expect(handleSceneryAction('GRANITE-WALL', 'FIND', state))
        .toBe('The west wall is solid granite here.');
      
      state.currentRoom = 'TREASURE-ROOM';
      expect(handleSceneryAction('GRANITE-WALL', 'FIND', state))
        .toBe('The east wall is solid granite here.');
    });

    it('should match exact messages from ZIL source for SONGBIRD', () => {
      const state = createInitialGameState();
      
      expect(handleSceneryAction('SONGBIRD', 'FIND', state))
        .toBe('The songbird is not here but is probably nearby.');
      
      expect(handleSceneryAction('SONGBIRD', 'LISTEN', state))
        .toBe("You can't hear the songbird now.");
      
      expect(handleSceneryAction('SONGBIRD', 'FOLLOW', state))
        .toBe("It can't be followed.");
    });
  });
});
