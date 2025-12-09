/**
 * Death and Resurrection Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { triggerDeath, triggerGrueDeath, getDeathCount, isGameOver } from './death.js';
import { GameState } from './state.js';
import { createInitialGameState } from './factories/gameFactory.js';

describe('Death and Resurrection', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialGameState();
  });

  describe('triggerDeath', () => {
    it('should display death message and banner', () => {
      const message = triggerDeath(state, 'You fell into a pit.');
      
      expect(message).toContain('You fell into a pit.');
      expect(message).toContain('****  You have died  ****');
    });

    it('should decrement score by 10', () => {
      state.score = 50;
      triggerDeath(state, 'Test death');
      
      expect(state.score).toBe(40);
    });

    it('should increment death counter', () => {
      expect(getDeathCount(state)).toBe(0);
      
      triggerDeath(state, 'First death');
      expect(getDeathCount(state)).toBe(1);
      
      triggerDeath(state, 'Second death');
      expect(getDeathCount(state)).toBe(2);
    });

    it('should resurrect player in FOREST-1 on first death', () => {
      state.setCurrentRoom('CELLAR');
      
      const message = triggerDeath(state, 'Test death');
      
      expect(message).toContain('deserve another chance');
      expect(state.currentRoom).toBe('FOREST-1');
    });

    it('should clear inventory on resurrection', () => {
      state.addToInventory('LAMP');
      state.addToInventory('SWORD');
      
      triggerDeath(state, 'Test death');
      
      expect(state.inventory.length).toBe(0);
    });

    it('should trigger game over on third death', () => {
      triggerDeath(state, 'First death');
      triggerDeath(state, 'Second death');
      
      const message = triggerDeath(state, 'Third death');
      
      expect(message).toContain('suicidal maniac');
      expect(isGameOver(state)).toBe(true);
    });

    it('should trigger game over if already dead', () => {
      state.setGlobalVariable('DEAD', true);
      
      const message = triggerDeath(state, 'Double death');
      
      expect(message).toContain('killed while already dead');
      expect(isGameOver(state)).toBe(true);
    });

    it('should show bad luck message if not lucky', () => {
      state.setGlobalVariable('LUCKY', false);
      
      const message = triggerDeath(state, 'Test death');
      
      expect(message).toContain('Bad luck');
    });

    it('should not show bad luck message if lucky', () => {
      state.setGlobalVariable('LUCKY', true);
      
      const message = triggerDeath(state, 'Test death');
      
      expect(message).not.toContain('Bad luck');
    });
  });

  describe('triggerGrueDeath', () => {
    it('should trigger death with grue message', () => {
      const message = triggerGrueDeath(state);
      
      expect(message).toContain('slavering fangs');
      expect(message).toContain('grue');
      expect(message).toContain('****  You have died  ****');
    });

    it('should resurrect player after grue attack', () => {
      state.setCurrentRoom('CELLAR');
      
      triggerGrueDeath(state);
      
      expect(state.currentRoom).toBe('FOREST-1');
    });
  });

  describe('getDeathCount', () => {
    it('should return 0 initially', () => {
      expect(getDeathCount(state)).toBe(0);
    });

    it('should return correct count after deaths', () => {
      triggerDeath(state, 'Death 1');
      expect(getDeathCount(state)).toBe(1);
      
      triggerDeath(state, 'Death 2');
      expect(getDeathCount(state)).toBe(2);
    });
  });

  describe('isGameOver', () => {
    it('should return false initially', () => {
      expect(isGameOver(state)).toBe(false);
    });

    it('should return true after game over', () => {
      // Trigger 3 deaths
      triggerDeath(state, 'Death 1');
      triggerDeath(state, 'Death 2');
      triggerDeath(state, 'Death 3');
      
      expect(isGameOver(state)).toBe(true);
    });
  });
});
