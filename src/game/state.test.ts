/**
 * Property-based tests for GameState
 * Tests game initialization and state management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GameState } from './state.js';
import { GameObjectImpl } from './objects.js';
import { RoomImpl, Direction } from './rooms.js';
import { ObjectFlag, RoomFlag, INITIAL_GLOBAL_FLAGS } from './data/flags.js';

/**
 * Generator for creating test game objects
 */
const gameObjectGenerator = (): fc.Arbitrary<GameObjectImpl> => {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    synonyms: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
    adjectives: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
    description: fc.string({ minLength: 1, maxLength: 100 }),
    location: fc.oneof(
      fc.constant(null),
      fc.string({ minLength: 1, maxLength: 20 })
    ),
    flags: fc.array(fc.constantFrom(...Object.values(ObjectFlag)), { maxLength: 5 }),
    capacity: fc.option(fc.integer({ min: 0, max: 100 })),
    size: fc.option(fc.integer({ min: 0, max: 100 })),
    value: fc.option(fc.integer({ min: 0, max: 100 }))
  }).map(data => new GameObjectImpl(data));
};

/**
 * Generator for creating test rooms
 */
const roomGenerator = (): fc.Arbitrary<RoomImpl> => {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    objects: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
    visited: fc.boolean(),
    flags: fc.array(fc.constantFrom(...Object.values(RoomFlag)), { maxLength: 3 })
  }).map(data => new RoomImpl(data));
};

describe('GameState Property Tests', () => {
  // Feature: modern-zork-rewrite, Property 1: Game initialization consistency
  it('should always initialize to original Zork I starting conditions', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.string({ minLength: 1 }), gameObjectGenerator()), { minLength: 0, maxLength: 20 }),
        fc.array(fc.tuple(fc.string({ minLength: 1 }), roomGenerator()), { minLength: 1, maxLength: 20 }),
        (objectEntries, roomEntries) => {
          // Create maps from the generated entries
          const objects = new Map(objectEntries);
          const rooms = new Map(roomEntries);
          
          // Ensure WEST-OF-HOUSE room exists
          if (!rooms.has('WEST-OF-HOUSE')) {
            rooms.set('WEST-OF-HOUSE', new RoomImpl({
              id: 'WEST-OF-HOUSE',
              name: 'West of House',
              description: 'You are standing in an open field west of a white house.'
            }));
          }

          // Create initial state
          const state = GameState.createInitialState(objects, rooms);

          // Verify all initial conditions match original Zork I
          expect(state.currentRoom).toBe('WEST-OF-HOUSE');
          expect(state.score).toBe(0);
          expect(state.moves).toBe(0);
          expect(state.inventory).toEqual([]);
          expect(state.isInventoryEmpty()).toBe(true);
          
          // Verify all global flags are initialized to false
          expect(state.flags.CYCLOPS_FLAG).toBe(false);
          expect(state.flags.DEFLATE).toBe(false);
          expect(state.flags.DOME_FLAG).toBe(false);
          expect(state.flags.EMPTY_HANDED).toBe(false);
          expect(state.flags.LLD_FLAG).toBe(false);
          expect(state.flags.LOW_TIDE).toBe(false);
          expect(state.flags.MAGIC_FLAG).toBe(false);
          expect(state.flags.RAINBOW_FLAG).toBe(false);
          expect(state.flags.TROLL_FLAG).toBe(false);
          expect(state.flags.WON_FLAG).toBe(false);
          expect(state.flags.COFFIN_CURE).toBe(false);

          // Verify objects and rooms are properly stored
          expect(state.objects).toBe(objects);
          expect(state.rooms).toBe(rooms);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent state when creating with explicit parameters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 10000 }),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
        (roomId, score, moves, inventory) => {
          const state = new GameState({
            currentRoom: roomId,
            score,
            moves,
            inventory,
            objects: new Map(),
            rooms: new Map()
          });

          expect(state.currentRoom).toBe(roomId);
          expect(state.score).toBe(score);
          expect(state.moves).toBe(moves);
          expect(state.inventory).toEqual(inventory);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
