/**
 * Tests for V-Object Message Handlers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerVObjectHandler,
  getVObjectHandler,
  isVObject,
  handleVObject,
  handleVehicleBoard,
  handleVehicleDisembark,
  handleEcho,
  handleLaunchVehicle,
  getAllVObjectIds
} from './verbHandlers';
import { GameState } from './state';

describe('V-Object Handlers', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  describe('Spell V-Objects', () => {
    it('should handle FEEBLE disenchant', () => {
      const result = handleVObject(state, 'FEEBLE', 'DISENCHANT');
      expect(result).toBe('The target seems stronger now.');
    });

    it('should handle FUMBLE disenchant', () => {
      const result = handleVObject(state, 'FUMBLE', 'DISENCHANT');
      expect(result).toBe('The target no longer appears clumsy.');
    });

    it('should handle FEAR disenchant', () => {
      const result = handleVObject(state, 'FEAR', 'DISENCHANT');
      expect(result).toBe('The target no longer appears afraid.');
    });

    it('should handle FREEZE disenchant', () => {
      const result = handleVObject(state, 'FREEZE', 'DISENCHANT');
      expect(result).toBe('The target moves again.');
    });

    it('should handle FREEZE take', () => {
      const result = handleVObject(state, 'FREEZE', 'TAKE');
      expect(result).toBe('It seems rooted to the spot.');
    });

    it('should handle FALL disenchant', () => {
      const result = handleVObject(state, 'FALL', 'DISENCHANT');
      expect(result).toBe('The target regains its balance.');
    });

    it('should handle FERMENT disenchant', () => {
      const result = handleVObject(state, 'FERMENT', 'DISENCHANT');
      expect(result).toBe('The target stops swaying.');
    });

    it('should handle FIERCE disenchant', () => {
      const result = handleVObject(state, 'FIERCE', 'DISENCHANT');
      expect(result).toBe('The target appears more peaceful.');
    });

    it('should handle FENCE disenchant', () => {
      const result = handleVObject(state, 'FENCE', 'DISENCHANT');
      expect(result).toBe('The barrier disappears.');
    });

    it('should handle FANTASIZE disenchant', () => {
      const result = handleVObject(state, 'FANTASIZE', 'DISENCHANT');
      expect(result).toBe('The illusion fades away.');
    });

    it('should handle FLOAT disenchant', () => {
      const result = handleVObject(state, 'FLOAT', 'DISENCHANT');
      expect(result).toBe('The target sinks to the ground.');
    });

    it('should handle FLOAT take', () => {
      const result = handleVObject(state, 'FLOAT', 'TAKE');
      expect(result).toBe("You can't reach that. It's floating above your head.");
    });

    it('should handle FLOAT describe', () => {
      const result = handleVObject(state, 'FLOAT', 'DESCRIBE');
      expect(result).toBe('(floating in midair)');
    });

    it('should handle FUDGE disenchant', () => {
      const result = handleVObject(state, 'FUDGE', 'DISENCHANT');
      expect(result).toBe('The sweet smell has dispersed.');
    });

    it('should handle FUDGE enchant', () => {
      const result = handleVObject(state, 'FUDGE', 'ENCHANT');
      expect(result).toBe('A strong odor of chocolate permeates the room.');
    });
  });

  describe('Vehicle Functions', () => {
    it('should handle launch vehicle', () => {
      const result = handleLaunchVehicle();
      expect(result).toBe("You can't launch that by saying \"launch\"!");
    });
  });

  describe('Echo Handler', () => {
    it('should echo empty input', () => {
      const result = handleEcho('');
      expect(result).toBe('echo echo ...');
    });

    it('should echo input once', () => {
      const result = handleEcho('hello', 0);
      expect(result).toBe('hello ');
    });

    it('should stop echoing after 2 times', () => {
      const result = handleEcho('hello', 2);
      expect(result).toBe('...');
    });
  });

  describe('V-Object Registry', () => {
    it('should identify registered V-objects', () => {
      expect(isVObject('FEEBLE')).toBe(true);
      expect(isVObject('FLOAT')).toBe(true);
      expect(isVObject('NONEXISTENT')).toBe(false);
    });

    it('should list all V-object IDs', () => {
      const ids = getAllVObjectIds();
      expect(ids).toContain('FEEBLE');
      expect(ids).toContain('FUMBLE');
      expect(ids).toContain('FLOAT');
      expect(ids.length).toBeGreaterThan(10);
    });

    it('should get V-object handler', () => {
      const handler = getVObjectHandler('FEEBLE');
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });

    it('should return undefined for non-existent handler', () => {
      const handler = getVObjectHandler('NONEXISTENT');
      expect(handler).toBeUndefined();
    });
  });

  describe('Custom V-Object Registration', () => {
    it('should allow registering custom V-objects', () => {
      registerVObjectHandler('TEST', (state, verb) => {
        if (verb === 'TEST') {
          return 'Test message';
        }
        return null;
      });

      expect(isVObject('TEST')).toBe(true);
      const result = handleVObject(state, 'TEST', 'TEST');
      expect(result).toBe('Test message');
    });
  });
});
