/**
 * Property-based tests for test progress tracking
 * Feature: exhaustive-game-testing, Property 1: Test progress persistence
 * Validates: Requirements 4.1, 4.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  serializeTestProgress,
  deserializeTestProgress,
  createTestProgress,
  addTestedRoom,
  addTestedObject,
  addTestedInteraction,
  incrementTestCount,
  isRoomTested,
  isObjectTested,
  isInteractionTested,
  getTestedInteractions
} from './testProgress';
import { TestProgress } from './types';

/**
 * Arbitrary generator for TestProgress
 */
const testProgressArbitrary = fc.record({
  version: fc.constant('1.0'),
  lastUpdated: fc.date(),
  testedRooms: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 50 }),
  testedObjects: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 50 }),
  testedInteractions: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
    { maxKeys: 20 }
  ),
  totalTests: fc.nat({ max: 10000 }),
  coverage: fc.record({
    rooms: fc.float({ min: 0, max: 100 }),
    objects: fc.float({ min: 0, max: 100 }),
    interactions: fc.float({ min: 0, max: 100 })
  })
}) as fc.Arbitrary<TestProgress>;

describe('TestProgress - Property-Based Tests', () => {
  /**
   * Feature: exhaustive-game-testing, Property 1: Test progress persistence
   * For any test session, saving and then loading test progress should preserve all tested items and their results
   * Validates: Requirements 4.1, 4.2
   */
  it('Property 1: serialization round-trip preserves all data', () => {
    fc.assert(
      fc.property(testProgressArbitrary, (progress) => {
        // Serialize then deserialize
        const serialized = serializeTestProgress(progress);
        const deserialized = deserializeTestProgress(serialized);

        // Check all fields are preserved
        expect(deserialized.version).toBe(progress.version);
        expect(deserialized.testedRooms).toEqual(progress.testedRooms);
        expect(deserialized.testedObjects).toEqual(progress.testedObjects);
        expect(deserialized.testedInteractions).toEqual(progress.testedInteractions);
        expect(deserialized.totalTests).toBe(progress.totalTests);
        
        // Handle NaN values in coverage (NaN should be normalized to 0 after deserialization)
        if (Number.isNaN(progress.coverage.rooms)) {
          expect(deserialized.coverage.rooms).toBe(0);
        } else {
          expect(deserialized.coverage.rooms).toBeCloseTo(progress.coverage.rooms, 5);
        }
        
        if (Number.isNaN(progress.coverage.objects)) {
          expect(deserialized.coverage.objects).toBe(0);
        } else {
          expect(deserialized.coverage.objects).toBeCloseTo(progress.coverage.objects, 5);
        }
        
        if (Number.isNaN(progress.coverage.interactions)) {
          expect(deserialized.coverage.interactions).toBe(0);
        } else {
          expect(deserialized.coverage.interactions).toBeCloseTo(progress.coverage.interactions, 5);
        }
        
        // Date should be preserved (within millisecond precision)
        expect(Math.abs(deserialized.lastUpdated.getTime() - progress.lastUpdated.getTime())).toBeLessThan(1);
      }),
      { numRuns: 100 }
    );
  });

  it('adding a room to progress includes it in tested rooms', () => {
    fc.assert(
      fc.property(
        testProgressArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        (progress, roomId) => {
          const updated = addTestedRoom(progress, roomId);
          expect(isRoomTested(updated, roomId)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('adding an object to progress includes it in tested objects', () => {
    fc.assert(
      fc.property(
        testProgressArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        (progress, objectId) => {
          const updated = addTestedObject(progress, objectId);
          expect(isObjectTested(updated, objectId)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('adding an interaction to progress includes it in tested interactions', () => {
    fc.assert(
      fc.property(
        testProgressArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (progress, objectId, verb) => {
          const updated = addTestedInteraction(progress, objectId, verb);
          expect(isInteractionTested(updated, objectId, verb)).toBe(true);
          expect(getTestedInteractions(updated, objectId)).toContain(verb);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('incrementing test count increases total by one', () => {
    fc.assert(
      fc.property(testProgressArbitrary, (progress) => {
        const updated = incrementTestCount(progress);
        expect(updated.totalTests).toBe(progress.totalTests + 1);
      }),
      { numRuns: 100 }
    );
  });

  it('adding the same room twice does not duplicate it', () => {
    fc.assert(
      fc.property(
        testProgressArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        (progress, roomId) => {
          const updated1 = addTestedRoom(progress, roomId);
          const updated2 = addTestedRoom(updated1, roomId);
          
          // Count occurrences of roomId
          const count = updated2.testedRooms.filter(id => id === roomId).length;
          expect(count).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('adding the same object twice does not duplicate it', () => {
    fc.assert(
      fc.property(
        testProgressArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        (progress, objectId) => {
          const updated1 = addTestedObject(progress, objectId);
          const updated2 = addTestedObject(updated1, objectId);
          
          // Count occurrences of objectId
          const count = updated2.testedObjects.filter(id => id === objectId).length;
          expect(count).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('adding the same interaction twice does not duplicate it', () => {
    fc.assert(
      fc.property(
        testProgressArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (progress, objectId, verb) => {
          const updated1 = addTestedInteraction(progress, objectId, verb);
          const updated2 = addTestedInteraction(updated1, objectId, verb);
          
          const interactions = getTestedInteractions(updated2, objectId);
          const count = interactions.filter(v => v === verb).length;
          expect(count).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createTestProgress returns valid empty progress', () => {
    const progress = createTestProgress();
    
    expect(progress.version).toBe('1.0');
    expect(progress.testedRooms).toEqual([]);
    expect(progress.testedObjects).toEqual([]);
    expect(progress.testedInteractions).toEqual({});
    expect(progress.totalTests).toBe(0);
    expect(progress.coverage.rooms).toBe(0);
    expect(progress.coverage.objects).toBe(0);
    expect(progress.coverage.interactions).toBe(0);
    expect(progress.lastUpdated).toBeInstanceOf(Date);
  });
});
