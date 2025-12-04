/**
 * Action Handler Tests
 * Tests for TAKE, DROP, and other action handlers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { GameState } from './state.js';
import { GameObjectImpl } from './objects.js';
import { RoomImpl } from './rooms.js';
import { TakeAction, DropAction, InventoryAction } from './actions.js';
import { ObjectFlag } from './data/flags.js';

describe('TakeAction', () => {
  let state: GameState;
  let takeAction: TakeAction;

  beforeEach(() => {
    // Create a simple test state
    const rooms = new Map([
      ['TEST-ROOM', new RoomImpl({
        id: 'TEST-ROOM',
        name: 'Test Room',
        description: 'A test room',
        exits: new Map()
      })]
    ]);

    const objects = new Map();
    state = new GameState({
      currentRoom: 'TEST-ROOM',
      objects,
      rooms,
      inventory: [],
      score: 0,
      moves: 0
    });

    takeAction = new TakeAction();
  });

  it('should take a takeable object from the current room', () => {
    const obj = new GameObjectImpl({
      id: 'SWORD',
      name: 'Sword',
      description: 'A sharp sword',
      location: 'TEST-ROOM',
      flags: [ObjectFlag.TAKEBIT],
      size: 10
    });
    state.objects.set('SWORD', obj);
    state.rooms.get('TEST-ROOM')!.addObject('SWORD');

    const result = takeAction.execute(state, 'SWORD');

    expect(result.success).toBe(true);
    expect(state.isInInventory('SWORD')).toBe(true);
    expect(obj.location).toBe('PLAYER');
  });

  it('should not take an object that is not takeable', () => {
    const obj = new GameObjectImpl({
      id: 'HOUSE',
      name: 'House',
      description: 'A large house',
      location: 'TEST-ROOM',
      flags: [],
      size: 1000
    });
    state.objects.set('HOUSE', obj);

    const result = takeAction.execute(state, 'HOUSE');

    expect(result.success).toBe(false);
    expect(state.isInInventory('HOUSE')).toBe(false);
  });

  it('should not take an object that is too heavy', () => {
    const obj = new GameObjectImpl({
      id: 'BOULDER',
      name: 'Boulder',
      description: 'A huge boulder',
      location: 'TEST-ROOM',
      flags: [ObjectFlag.TAKEBIT],
      size: 150
    });
    state.objects.set('BOULDER', obj);

    const result = takeAction.execute(state, 'BOULDER');

    expect(result.success).toBe(false);
    expect(state.isInInventory('BOULDER')).toBe(false);
  });

  it('should not take an object already in inventory', () => {
    const obj = new GameObjectImpl({
      id: 'SWORD',
      name: 'Sword',
      description: 'A sharp sword',
      location: 'PLAYER',
      flags: [ObjectFlag.TAKEBIT],
      size: 10
    });
    state.objects.set('SWORD', obj);
    state.addToInventory('SWORD');

    const result = takeAction.execute(state, 'SWORD');

    expect(result.success).toBe(false);
    expect(result.message).toContain('already have');
  });
});

describe('DropAction', () => {
  let state: GameState;
  let dropAction: DropAction;

  beforeEach(() => {
    const rooms = new Map([
      ['TEST-ROOM', new RoomImpl({
        id: 'TEST-ROOM',
        name: 'Test Room',
        description: 'A test room',
        exits: new Map()
      })]
    ]);

    const objects = new Map();
    state = new GameState({
      currentRoom: 'TEST-ROOM',
      objects,
      rooms,
      inventory: [],
      score: 0,
      moves: 0
    });

    dropAction = new DropAction();
  });

  it('should drop an object from inventory into current room', () => {
    const obj = new GameObjectImpl({
      id: 'SWORD',
      name: 'Sword',
      description: 'A sharp sword',
      location: 'PLAYER',
      flags: [ObjectFlag.TAKEBIT],
      size: 10
    });
    state.objects.set('SWORD', obj);
    state.addToInventory('SWORD');

    const result = dropAction.execute(state, 'SWORD');

    expect(result.success).toBe(true);
    expect(state.isInInventory('SWORD')).toBe(false);
    expect(obj.location).toBe('TEST-ROOM');
  });

  it('should not drop an object not in inventory', () => {
    const obj = new GameObjectImpl({
      id: 'SWORD',
      name: 'Sword',
      description: 'A sharp sword',
      location: 'TEST-ROOM',
      flags: [ObjectFlag.TAKEBIT],
      size: 10
    });
    state.objects.set('SWORD', obj);

    const result = dropAction.execute(state, 'SWORD');

    expect(result.success).toBe(false);
    expect(result.message).toContain("don't have");
  });
});

// Feature: modern-zork-rewrite, Property 8: Object location round-trip
describe('Property Test: Object location round-trip', () => {
  it('should preserve object in current room after take then drop', () => {
    fc.assert(
      fc.property(
        // Generate random takeable objects with valid sizes
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, '')),
          name: fc.string({ minLength: 1, maxLength: 30 }),
          description: fc.string({ minLength: 1, maxLength: 100 }),
          size: fc.integer({ min: 1, max: 50 })
        }),
        (objData) => {
          // Skip invalid IDs
          if (!objData.id || objData.id.length === 0) {
            return true;
          }

          // Create test state
          const rooms = new Map([
            ['TEST-ROOM', new RoomImpl({
              id: 'TEST-ROOM',
              name: 'Test Room',
              description: 'A test room',
              exits: new Map()
            })]
          ]);

          const obj = new GameObjectImpl({
            id: objData.id,
            name: objData.name,
            description: objData.description,
            location: 'TEST-ROOM',
            flags: [ObjectFlag.TAKEBIT],
            size: objData.size
          });

          const objects = new Map([[objData.id, obj]]);
          const state = new GameState({
            currentRoom: 'TEST-ROOM',
            objects,
            rooms,
            inventory: [],
            score: 0,
            moves: 0
          });

          rooms.get('TEST-ROOM')!.addObject(objData.id);

          const takeAction = new TakeAction();
          const dropAction = new DropAction();

          // Take the object
          const takeResult = takeAction.execute(state, objData.id);
          
          // If take succeeded, drop should work
          if (takeResult.success) {
            const dropResult = dropAction.execute(state, objData.id);
            
            // After take then drop, object should be in current room
            expect(dropResult.success).toBe(true);
            expect(obj.location).toBe('TEST-ROOM');
            expect(state.isInInventory(objData.id)).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('InventoryAction', () => {
  let state: GameState;
  let inventoryAction: InventoryAction;

  beforeEach(() => {
    const rooms = new Map([
      ['TEST-ROOM', new RoomImpl({
        id: 'TEST-ROOM',
        name: 'Test Room',
        description: 'A test room',
        exits: new Map()
      })]
    ]);

    const objects = new Map();
    state = new GameState({
      currentRoom: 'TEST-ROOM',
      objects,
      rooms,
      inventory: [],
      score: 0,
      moves: 0
    });

    inventoryAction = new InventoryAction();
  });

  it('should display empty-handed message when inventory is empty', () => {
    const result = inventoryAction.execute(state);

    expect(result.success).toBe(true);
    expect(result.message).toContain('empty-handed');
  });

  it('should list all objects in inventory', () => {
    const sword = new GameObjectImpl({
      id: 'SWORD',
      name: 'Sword',
      description: 'A sharp sword',
      location: 'PLAYER',
      flags: [ObjectFlag.TAKEBIT],
      size: 10
    });

    const lamp = new GameObjectImpl({
      id: 'LAMP',
      name: 'Brass Lantern',
      description: 'A brass lantern',
      location: 'PLAYER',
      flags: [ObjectFlag.TAKEBIT],
      size: 5
    });

    state.objects.set('SWORD', sword);
    state.objects.set('LAMP', lamp);
    state.addToInventory('SWORD');
    state.addToInventory('LAMP');

    const result = inventoryAction.execute(state);

    expect(result.success).toBe(true);
    expect(result.message).toContain('carrying');
    expect(result.message).toContain('Sword');
    expect(result.message).toContain('Brass Lantern');
  });
});

describe('Inventory Management Integration Tests', () => {
  let state: GameState;
  let takeAction: TakeAction;
  let dropAction: DropAction;
  let inventoryAction: InventoryAction;

  beforeEach(() => {
    const rooms = new Map([
      ['TEST-ROOM', new RoomImpl({
        id: 'TEST-ROOM',
        name: 'Test Room',
        description: 'A test room',
        exits: new Map()
      })]
    ]);

    const objects = new Map();
    state = new GameState({
      currentRoom: 'TEST-ROOM',
      objects,
      rooms,
      inventory: [],
      score: 0,
      moves: 0
    });

    takeAction = new TakeAction();
    dropAction = new DropAction();
    inventoryAction = new InventoryAction();
  });

  it('should handle complete take-inventory-drop cycle', () => {
    // Create object in room
    const sword = new GameObjectImpl({
      id: 'SWORD',
      name: 'Sword',
      description: 'A sharp sword',
      location: 'TEST-ROOM',
      flags: [ObjectFlag.TAKEBIT],
      size: 10
    });
    state.objects.set('SWORD', sword);
    state.rooms.get('TEST-ROOM')!.addObject('SWORD');

    // Initially inventory should be empty
    let result = inventoryAction.execute(state);
    expect(result.message).toContain('empty-handed');

    // Take the sword
    result = takeAction.execute(state, 'SWORD');
    expect(result.success).toBe(true);

    // Inventory should now show the sword
    result = inventoryAction.execute(state);
    expect(result.message).toContain('Sword');

    // Drop the sword
    result = dropAction.execute(state, 'SWORD');
    expect(result.success).toBe(true);

    // Inventory should be empty again
    result = inventoryAction.execute(state);
    expect(result.message).toContain('empty-handed');
  });

  it('should enforce weight limits when taking objects', () => {
    // Create multiple heavy objects
    const boulder1 = new GameObjectImpl({
      id: 'BOULDER1',
      name: 'Boulder 1',
      description: 'A heavy boulder',
      location: 'TEST-ROOM',
      flags: [ObjectFlag.TAKEBIT],
      size: 60
    });

    const boulder2 = new GameObjectImpl({
      id: 'BOULDER2',
      name: 'Boulder 2',
      description: 'Another heavy boulder',
      location: 'TEST-ROOM',
      flags: [ObjectFlag.TAKEBIT],
      size: 60
    });

    state.objects.set('BOULDER1', boulder1);
    state.objects.set('BOULDER2', boulder2);
    state.rooms.get('TEST-ROOM')!.addObject('BOULDER1');
    state.rooms.get('TEST-ROOM')!.addObject('BOULDER2');

    // Take first boulder - should succeed
    let result = takeAction.execute(state, 'BOULDER1');
    expect(result.success).toBe(true);
    expect(state.getInventoryWeight()).toBe(60);

    // Try to take second boulder - should fail due to weight limit
    result = takeAction.execute(state, 'BOULDER2');
    expect(result.success).toBe(false);
    expect(result.message).toContain('too much');
  });

  it('should correctly track inventory weight', () => {
    const sword = new GameObjectImpl({
      id: 'SWORD',
      name: 'Sword',
      description: 'A sharp sword',
      location: 'TEST-ROOM',
      flags: [ObjectFlag.TAKEBIT],
      size: 10
    });

    const lamp = new GameObjectImpl({
      id: 'LAMP',
      name: 'Brass Lantern',
      description: 'A brass lantern',
      location: 'TEST-ROOM',
      flags: [ObjectFlag.TAKEBIT],
      size: 5
    });

    state.objects.set('SWORD', sword);
    state.objects.set('LAMP', lamp);
    state.rooms.get('TEST-ROOM')!.addObject('SWORD');
    state.rooms.get('TEST-ROOM')!.addObject('LAMP');

    // Initially weight should be 0
    expect(state.getInventoryWeight()).toBe(0);

    // Take sword
    takeAction.execute(state, 'SWORD');
    expect(state.getInventoryWeight()).toBe(10);

    // Take lamp
    takeAction.execute(state, 'LAMP');
    expect(state.getInventoryWeight()).toBe(15);

    // Drop sword
    dropAction.execute(state, 'SWORD');
    expect(state.getInventoryWeight()).toBe(5);

    // Drop lamp
    dropAction.execute(state, 'LAMP');
    expect(state.getInventoryWeight()).toBe(0);
  });
});
