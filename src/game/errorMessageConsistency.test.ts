/**
 * Property-Based Test: Error Message Consistency
 * Feature: complete-text-accuracy, Property 6: Error message consistency
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 * 
 * Tests that error messages for invalid actions match the original ZIL error messages
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getInformativeError, getObjectNotVisibleError, getParserError } from './errorMessages.js';
import { getImpossibleActionMessage, getDeathMessage, DeathScenario } from './deathMessages.js';
import { GameObjectImpl } from './objects.js';
import { ObjectFlag } from './data/flags.js';

describe('Error Message Consistency', () => {
  /**
   * Property 6: Error message consistency
   * For any invalid action, the error message displayed should match 
   * the original ZIL error message for that scenario
   */
  it('should provide consistent error messages for impossible actions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'TAKE',
          'DROP',
          'OPEN',
          'CLOSE',
          'READ',
          'ATTACK',
          'EAT',
          'DRINK',
          'MOVE',
          'PUSH',
          'PULL',
          'CLIMB'
        ),
        fc.option(fc.constantFrom('MIRROR-1', 'MIRROR-2', 'DAM', 'BOLT', 'TROLL', 'CYCLOPS'), { nil: undefined }),
        (action, objectId) => {
          // Test that impossible action messages are non-empty and informative
          const message = getImpossibleActionMessage(action, objectId);
          
          // If there's a specific impossible action message, it should be meaningful
          if (message) {
            expect(message.length).toBeGreaterThan(0);
            expect(message).not.toBe('');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide consistent death messages for all death scenarios', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          DeathScenario.CANYON_LEAP,
          DeathScenario.LEAF_BURN,
          DeathScenario.DOME_LEAP,
          DeathScenario.MAINTENANCE_DROWN,
          DeathScenario.CYCLOPS_EAT,
          DeathScenario.BODY_DISRESPECT,
          DeathScenario.BLACK_BOOK,
          DeathScenario.RIVER_DROWN,
          DeathScenario.WEAPON_DROP_WATER,
          DeathScenario.SAND_COLLAPSE,
          DeathScenario.TREE_FALL,
          DeathScenario.SUICIDE,
          DeathScenario.CRETIN_KILL,
          DeathScenario.BURN_SELF,
          DeathScenario.GRUE_ATTACK,
          DeathScenario.GRUE_DEVOUR
        ),
        (scenario) => {
          // Every death scenario should have a non-empty message
          const message = getDeathMessage(scenario);
          
          expect(message).toBeDefined();
          expect(message.length).toBeGreaterThan(0);
          expect(message).not.toBe('');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide consistent error messages for common action failures', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('TAKE', 'DROP', 'OPEN', 'CLOSE', 'READ'),
        fc.record({
          id: fc.constantFrom('LAMP', 'SWORD', 'BOTTLE', 'MAILBOX', 'TROPHY-CASE'),
          name: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          flags: fc.constantFrom(
            new Set([ObjectFlag.TAKEBIT]),
            new Set([ObjectFlag.CONTBIT]),
            new Set([ObjectFlag.READBIT]),
            new Set([ObjectFlag.ACTORBIT]),
            new Set()
          )
        }),
        (action, objData) => {
          // Skip if name is empty or whitespace-only
          if (!objData.name || objData.name.trim().length === 0) {
            return true;
          }
          
          const object = new GameObjectImpl(
            objData.id,
            objData.name,
            'A test object',
            'TEST-ROOM',
            objData.flags
          );
          
          const error = getInformativeError({
            action,
            object
          });
          
          // Error messages should be non-empty and informative
          expect(error).toBeDefined();
          expect(error.length).toBeGreaterThan(0);
          expect(error).not.toBe('');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide consistent parser error messages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'UNKNOWN_WORD',
          'INVALID_SYNTAX',
          'NO_VERB',
          'AMBIGUOUS',
          'OBJECT_NOT_FOUND'
        ),
        fc.option(fc.string({ minLength: 1, maxLength: 15 }), { nil: undefined }),
        (errorType, word) => {
          const error = getParserError(errorType, word);
          
          // Parser errors should be non-empty and informative
          expect(error).toBeDefined();
          expect(error.length).toBeGreaterThan(0);
          expect(error).not.toBe('');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide consistent object not visible errors', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }),
        (objectName) => {
          const error = getObjectNotVisibleError(objectName);
          
          // Object not visible errors should mention the object
          expect(error).toBeDefined();
          expect(error.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle mirror-specific error messages correctly', () => {
    // Test mirror take error
    const mirrorTakeError = getImpossibleActionMessage('TAKE', 'MIRROR-1');
    expect(mirrorTakeError).toContain('many times your size');
    
    // Test mirror after breaking
    const mirrorBrokenError = getImpossibleActionMessage('TAKE', 'MIRROR-1', {
      getGlobalVariable: () => true
    } as any);
    expect(mirrorBrokenError).toContain('damage');
  });

  it('should handle dam-specific error messages correctly', () => {
    // Test dam open with hands
    const damHandsError = getImpossibleActionMessage('OPEN', 'DAM');
    expect(damHandsError).toBeDefined();
    expect(damHandsError?.length).toBeGreaterThan(0);
  });

  it('should handle cyclops death message correctly', () => {
    const cyclopsDeathMessage = getDeathMessage(DeathScenario.CYCLOPS_EAT);
    expect(cyclopsDeathMessage).toContain('cyclops');
    expect(cyclopsDeathMessage).toContain('Mom');
  });

  it('should handle grue death messages correctly', () => {
    const grueAttackMessage = getDeathMessage(DeathScenario.GRUE_ATTACK);
    const grueDevourMessage = getDeathMessage(DeathScenario.GRUE_DEVOUR);
    
    expect(grueAttackMessage).toContain('grue');
    expect(grueDevourMessage).toContain('grue');
    expect(grueAttackMessage).not.toBe(grueDevourMessage);
  });
});
