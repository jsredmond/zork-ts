/**
 * Checkpoint Test - Task 14.4
 * Test basic navigation and object interaction
 */

import { describe, it, expect } from 'vitest';
import { createInitialGameState } from './gameFactory.js';
import { Direction } from '../rooms.js';

describe('Task 14.4 Checkpoint - Basic Navigation and Object Interaction', () => {
  it('should create initial game state with rooms and objects', () => {
    const state = createInitialGameState();
    
    expect(state.rooms.size).toBeGreaterThan(0);
    expect(state.objects.size).toBeGreaterThan(0);
    expect(state.currentRoom).toBe('WEST-OF-HOUSE');
  });

  it('should allow player to navigate between rooms', () => {
    const state = createInitialGameState();
    
    // Start at WEST-OF-HOUSE
    expect(state.currentRoom).toBe('WEST-OF-HOUSE');
    
    // Move north to NORTH-OF-HOUSE
    const westOfHouse = state.getCurrentRoom();
    expect(westOfHouse).toBeDefined();
    
    const northExit = westOfHouse?.getExit(Direction.NORTH);
    expect(northExit).toBeDefined();
    expect(northExit?.destination).toBe('NORTH-OF-HOUSE');
    
    // Perform the move
    state.setCurrentRoom('NORTH-OF-HOUSE');
    expect(state.currentRoom).toBe('NORTH-OF-HOUSE');
    
    // Verify we can move back
    const northOfHouse = state.getCurrentRoom();
    const southExit = northOfHouse?.getExit(Direction.SW);
    expect(southExit?.destination).toBe('WEST-OF-HOUSE');
  });

  it('should allow objects to be taken and dropped', () => {
    const state = createInitialGameState();
    
    // Get the lamp object
    const lamp = state.getObject('LAMP');
    expect(lamp).toBeDefined();
    expect(lamp?.isTakeable()).toBe(true);
    
    // Initially lamp should be in LIVING-ROOM
    expect(lamp?.location).toBe('LIVING-ROOM');
    expect(state.isInInventory('LAMP')).toBe(false);
    
    // Take the lamp
    state.moveObject('LAMP', 'PLAYER');
    expect(state.isInInventory('LAMP')).toBe(true);
    expect(lamp?.location).toBe('PLAYER');
    
    // Drop the lamp in current room
    state.moveObject('LAMP', state.currentRoom);
    expect(state.isInInventory('LAMP')).toBe(false);
    expect(lamp?.location).toBe(state.currentRoom);
    
    // Verify lamp is in the room's object list
    const currentRoom = state.getCurrentRoom();
    expect(currentRoom?.objects).toContain('LAMP');
  });

  it('should display room descriptions correctly', () => {
    const state = createInitialGameState();
    
    const westOfHouse = state.getCurrentRoom();
    expect(westOfHouse).toBeDefined();
    expect(westOfHouse?.name).toBe('West of House');
    expect(westOfHouse?.description).toBeTruthy();
    expect(westOfHouse?.description.length).toBeGreaterThan(0);
  });

  it('should track visited status for rooms', () => {
    const state = createInitialGameState();
    
    // WEST-OF-HOUSE should not be visited initially
    const westOfHouse = state.getCurrentRoom();
    expect(westOfHouse?.visited).toBe(false);
    
    // Mark as visited
    westOfHouse?.markVisited();
    expect(westOfHouse?.visited).toBe(true);
  });

  it('should have proper room exits configured', () => {
    const state = createInitialGameState();
    
    const westOfHouse = state.getCurrentRoom();
    expect(westOfHouse).toBeDefined();
    
    // Check that WEST-OF-HOUSE has multiple exits
    const availableExits = westOfHouse?.getAvailableExits() || [];
    expect(availableExits.length).toBeGreaterThan(0);
    
    // Verify specific exits exist
    expect(westOfHouse?.getExit(Direction.NORTH)).toBeDefined();
    expect(westOfHouse?.getExit(Direction.SOUTH)).toBeDefined();
  });

  it('should have objects with proper properties', () => {
    const state = createInitialGameState();
    
    // Check lamp properties
    const lamp = state.getObject('LAMP');
    expect(lamp).toBeDefined();
    expect(lamp?.name).toBe('brass lantern');
    expect(lamp?.synonyms).toContain('LAMP');
    expect(lamp?.synonyms).toContain('LANTERN');
    expect(lamp?.isTakeable()).toBe(true);
    
    // Check sword properties
    const sword = state.getObject('SWORD');
    expect(sword).toBeDefined();
    expect(sword?.name).toBe('sword');
    expect(sword?.hasFlag).toBeDefined();
  });

  it('should have treasures properly configured', () => {
    const state = createInitialGameState();
    
    // Check that key treasures exist
    const treasures = ['SKULL', 'CHALICE', 'TRIDENT', 'DIAMOND', 'JADE'];
    
    for (const treasureId of treasures) {
      const treasure = state.getObject(treasureId);
      expect(treasure).toBeDefined();
      expect(treasure?.isTakeable()).toBe(true);
    }
  });

  it('should maintain game state consistency', () => {
    const state = createInitialGameState();
    
    // Initial state checks
    expect(state.score).toBe(0);
    expect(state.moves).toBe(0);
    expect(state.inventory.length).toBe(0);
    
    // Add item to inventory
    state.moveObject('LAMP', 'PLAYER');
    expect(state.inventory.length).toBe(1);
    
    // Increment moves
    state.incrementMoves();
    expect(state.moves).toBe(1);
    
    // Add score
    state.addScore(10);
    expect(state.score).toBe(10);
  });

  it('should handle container objects', () => {
    const state = createInitialGameState();
    
    // Check trophy case
    const trophyCase = state.getObject('TROPHY-CASE');
    expect(trophyCase).toBeDefined();
    expect(trophyCase?.isContainer()).toBe(true);
    expect(trophyCase?.capacity).toBe(10000);
    
    // Check bottle
    const bottle = state.getObject('BOTTLE');
    expect(bottle).toBeDefined();
    expect(bottle?.isContainer()).toBe(true);
    expect(bottle?.capacity).toBe(4);
  });
});
