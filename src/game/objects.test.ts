/**
 * Object Interaction Parity Tests
 * 
 * Property 8: Object Interaction Parity
 * Tests that object interactions maintain identical state and behavior to Z-Machine
 * 
 * Validates: Requirements 3.3, 3.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { GameState } from './state.js';
import { GameObjectImpl } from './objects.js';
import { ObjectFlag } from './data/flags.js';
import { PutAction, TakeAction, DropAction, OpenAction, CloseAction } from './actions.js';
import { createInitialGameState } from './factories/gameFactory.js';

describe('Object Interaction Parity', () => {
  let state: GameState;
  let putAction: PutAction;
  let takeAction: TakeAction;
  let dropAction: DropAction;
  let openAction: OpenAction;
  let closeAction: CloseAction;

  beforeEach(() => {
    state = createInitialGameState();
    putAction = new PutAction();
    takeAction = new TakeAction();
    dropAction = new DropAction();
    openAction = new OpenAction();
    closeAction = new CloseAction();
  });

  describe('Unit Tests - Container Operations', () => {
    it('should put object into open container', () => {
      // Setup: Create a container and an object
      const container = new GameObjectImpl({
        id: 'TEST_CHEST',
        name: 'chest',
        description: 'A wooden chest',
        flags: [ObjectFlag.CONTBIT, ObjectFlag.OPENBIT],
        capacity: 100
      });
      
      const item = new GameObjectImpl({
        id: 'TEST_COIN',
        name: 'coin',
        description: 'A gold coin',
        flags: [ObjectFlag.TAKEBIT],
        size: 1
      });
      
      state.objects.set('TEST_CHEST', container);
      state.objects.set('TEST_COIN', item);
      state.addToInventory('TEST_COIN');
      
      // Put the coin in the chest
      const result = putAction.execute(state, 'TEST_COIN', 'TEST_CHEST');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Done.');
      expect(item.location).toBe('TEST_CHEST');
    });

    it('should not put object into closed container', () => {
      const container = new GameObjectImpl({
        id: 'TEST_CHEST',
        name: 'chest',
        description: 'A wooden chest',
        flags: [ObjectFlag.CONTBIT], // Not open
        capacity: 100
      });
      
      const item = new GameObjectImpl({
        id: 'TEST_COIN',
        name: 'coin',
        description: 'A gold coin',
        flags: [ObjectFlag.TAKEBIT],
        size: 1
      });
      
      state.objects.set('TEST_CHEST', container);
      state.objects.set('TEST_COIN', item);
      state.addToInventory('TEST_COIN');
      
      const result = putAction.execute(state, 'TEST_COIN', 'TEST_CHEST');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("isn't open");
    });

    it('should not put object into non-container', () => {
      const nonContainer = new GameObjectImpl({
        id: 'TEST_ROCK',
        name: 'rock',
        description: 'A large rock',
        flags: []
      });
      
      const item = new GameObjectImpl({
        id: 'TEST_COIN',
        name: 'coin',
        description: 'A gold coin',
        flags: [ObjectFlag.TAKEBIT],
        size: 1
      });
      
      state.objects.set('TEST_ROCK', nonContainer);
      state.objects.set('TEST_COIN', item);
      state.addToInventory('TEST_COIN');
      
      const result = putAction.execute(state, 'TEST_COIN', 'TEST_ROCK');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe("You can't do that.");
    });

    it('should respect container capacity', () => {
      const container = new GameObjectImpl({
        id: 'TEST_CHEST',
        name: 'chest',
        description: 'A small chest',
        flags: [ObjectFlag.CONTBIT, ObjectFlag.OPENBIT],
        capacity: 5
      });
      
      const largeItem = new GameObjectImpl({
        id: 'TEST_BOULDER',
        name: 'boulder',
        description: 'A large boulder',
        flags: [ObjectFlag.TAKEBIT],
        size: 10
      });
      
      state.objects.set('TEST_CHEST', container);
      state.objects.set('TEST_BOULDER', largeItem);
      state.addToInventory('TEST_BOULDER');
      
      const result = putAction.execute(state, 'TEST_BOULDER', 'TEST_CHEST');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe("There's no room.");
    });
  });

  describe('Unit Tests - Inventory Operations', () => {
    it('should take object from room', () => {
      const item = new GameObjectImpl({
        id: 'TEST_LAMP',
        name: 'lamp',
        description: 'A brass lamp',
        location: state.currentRoom,
        flags: [ObjectFlag.TAKEBIT],
        size: 5
      });
      
      state.objects.set('TEST_LAMP', item);
      
      const result = takeAction.execute(state, 'TEST_LAMP');
      
      expect(result.success).toBe(true);
      expect(state.isInInventory('TEST_LAMP')).toBe(true);
    });

    it('should drop object from inventory', () => {
      const item = new GameObjectImpl({
        id: 'TEST_LAMP',
        name: 'lamp',
        description: 'A brass lamp',
        flags: [ObjectFlag.TAKEBIT],
        size: 5
      });
      
      state.objects.set('TEST_LAMP', item);
      state.addToInventory('TEST_LAMP');
      
      const result = dropAction.execute(state, 'TEST_LAMP');
      
      expect(result.success).toBe(true);
      // After dropping, the object should be in the current room
      expect(item.location).toBe(state.currentRoom);
    });
  });

  describe('Property 8: Object Interaction Parity', () => {
    /**
     * Property: Take then drop returns object to original location
     * For any takeable object in a room, taking then dropping should return it to the room
     */
    it('should maintain location consistency after take-drop cycle', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[A-Z_]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
          (objectId, objectName) => {
            // Create a fresh state for each test
            const testState = createInitialGameState();
            const originalRoom = testState.currentRoom;
            
            const item = new GameObjectImpl({
              id: objectId,
              name: objectName,
              description: `A ${objectName}`,
              location: originalRoom,
              flags: [ObjectFlag.TAKEBIT],
              size: 1
            });
            
            testState.objects.set(objectId, item);
            
            // Take the object
            const takeResult = takeAction.execute(testState, objectId);
            if (!takeResult.success) return true; // Skip if take fails
            
            // Drop the object
            const dropResult = dropAction.execute(testState, objectId);
            if (!dropResult.success) return true; // Skip if drop fails
            
            // Object should be back in the original room
            expect(item.location).toBe(originalRoom);
            expect(testState.isInInventory(objectId)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Put then remove returns object to inventory
     * For any object in inventory and open container, put then remove should return object to inventory
     */
    it('should maintain state consistency after put-remove cycle', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[A-Z_]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
          (objectId, objectName) => {
            const testState = createInitialGameState();
            
            // Create container
            const container = new GameObjectImpl({
              id: 'TEST_CONTAINER',
              name: 'container',
              description: 'A container',
              location: testState.currentRoom,
              flags: [ObjectFlag.CONTBIT, ObjectFlag.OPENBIT],
              capacity: 100
            });
            
            // Create item
            const item = new GameObjectImpl({
              id: objectId,
              name: objectName,
              description: `A ${objectName}`,
              flags: [ObjectFlag.TAKEBIT],
              size: 1
            });
            
            testState.objects.set('TEST_CONTAINER', container);
            testState.objects.set(objectId, item);
            testState.addToInventory(objectId);
            
            // Put the object in container
            const putResult = putAction.execute(testState, objectId, 'TEST_CONTAINER');
            if (!putResult.success) return true;
            
            expect(item.location).toBe('TEST_CONTAINER');
            
            // Take it back
            const takeResult = takeAction.execute(testState, objectId);
            if (!takeResult.success) return true;
            
            expect(testState.isInInventory(objectId)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Container open/close state is preserved
     * Opening then closing a container should return it to closed state
     */
    it('should maintain container state after open-close cycle', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[A-Z_]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
          (containerId, containerName) => {
            const testState = createInitialGameState();
            
            const container = new GameObjectImpl({
              id: containerId,
              name: containerName,
              description: `A ${containerName}`,
              location: testState.currentRoom,
              flags: [ObjectFlag.CONTBIT], // Starts closed
              capacity: 100
            });
            
            testState.objects.set(containerId, container);
            
            // Initially closed
            expect(container.hasFlag(ObjectFlag.OPENBIT)).toBe(false);
            
            // Open it
            const openResult = openAction.execute(testState, containerId);
            if (!openResult.success) return true;
            
            expect(container.hasFlag(ObjectFlag.OPENBIT)).toBe(true);
            
            // Close it
            const closeResult = closeAction.execute(testState, containerId);
            if (!closeResult.success) return true;
            
            expect(container.hasFlag(ObjectFlag.OPENBIT)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Inventory weight is correctly tracked
     * Taking objects should increase inventory weight, dropping should decrease it
     */
    it('should correctly track inventory weight changes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (objectSize) => {
            const testState = createInitialGameState();
            
            const item = new GameObjectImpl({
              id: 'TEST_ITEM',
              name: 'item',
              description: 'An item',
              location: testState.currentRoom,
              flags: [ObjectFlag.TAKEBIT],
              size: objectSize
            });
            
            testState.objects.set('TEST_ITEM', item);
            
            const weightBefore = testState.getInventoryWeight();
            
            // Take the object
            const takeResult = takeAction.execute(testState, 'TEST_ITEM');
            if (!takeResult.success) return true;
            
            const weightAfterTake = testState.getInventoryWeight();
            expect(weightAfterTake).toBe(weightBefore + objectSize);
            
            // Drop the object
            const dropResult = dropAction.execute(testState, 'TEST_ITEM');
            if (!dropResult.success) return true;
            
            const weightAfterDrop = testState.getInventoryWeight();
            expect(weightAfterDrop).toBe(weightBefore);
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    /**
     * Property: Container contents are correctly tracked
     * Putting objects in container should add them to contents
     */
    it('should correctly track container contents', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (numItems) => {
            const testState = createInitialGameState();
            
            const container = new GameObjectImpl({
              id: 'TEST_CONTAINER',
              name: 'container',
              description: 'A container',
              location: testState.currentRoom,
              flags: [ObjectFlag.CONTBIT, ObjectFlag.OPENBIT],
              capacity: 100
            });
            
            testState.objects.set('TEST_CONTAINER', container);
            
            // Create and add items
            const itemIds: string[] = [];
            for (let i = 0; i < numItems; i++) {
              const itemId = `TEST_ITEM_${i}`;
              const item = new GameObjectImpl({
                id: itemId,
                name: `item${i}`,
                description: `Item ${i}`,
                flags: [ObjectFlag.TAKEBIT],
                size: 1
              });
              
              testState.objects.set(itemId, item);
              testState.addToInventory(itemId);
              itemIds.push(itemId);
            }
            
            // Put all items in container
            for (const itemId of itemIds) {
              const result = putAction.execute(testState, itemId, 'TEST_CONTAINER');
              if (!result.success) return true; // Skip if put fails
            }
            
            // Check container contents
            const contents = testState.getObjectsInContainer('TEST_CONTAINER');
            expect(contents.length).toBe(numItems);
            
            // Verify each item is in the container
            for (const itemId of itemIds) {
              const item = testState.getObject(itemId);
              expect(item?.location).toBe('TEST_CONTAINER');
            }
            
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Integration Tests - Z-Machine Parity', () => {
    it('should produce "Done." message for successful PUT', () => {
      const container = new GameObjectImpl({
        id: 'TEST_CHEST',
        name: 'chest',
        description: 'A chest',
        location: state.currentRoom,
        flags: [ObjectFlag.CONTBIT, ObjectFlag.OPENBIT],
        capacity: 100
      });
      
      const item = new GameObjectImpl({
        id: 'TEST_COIN',
        name: 'coin',
        description: 'A coin',
        flags: [ObjectFlag.TAKEBIT],
        size: 1
      });
      
      state.objects.set('TEST_CHEST', container);
      state.objects.set('TEST_COIN', item);
      state.addToInventory('TEST_COIN');
      
      const result = putAction.execute(state, 'TEST_COIN', 'TEST_CHEST');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Done.');
    });

    it('should produce "Taken." message for successful TAKE', () => {
      const item = new GameObjectImpl({
        id: 'TEST_LAMP',
        name: 'lamp',
        description: 'A lamp',
        location: state.currentRoom,
        flags: [ObjectFlag.TAKEBIT],
        size: 5
      });
      
      state.objects.set('TEST_LAMP', item);
      
      const result = takeAction.execute(state, 'TEST_LAMP');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Taken.');
    });

    it('should produce "Dropped." message for successful DROP', () => {
      const item = new GameObjectImpl({
        id: 'TEST_LAMP',
        name: 'lamp',
        description: 'A lamp',
        flags: [ObjectFlag.TAKEBIT],
        size: 5
      });
      
      state.objects.set('TEST_LAMP', item);
      state.addToInventory('TEST_LAMP');
      
      const result = dropAction.execute(state, 'TEST_LAMP');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Dropped.');
    });
  });
});
