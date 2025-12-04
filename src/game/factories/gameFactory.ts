/**
 * Game Factory
 * Main factory for creating complete game state with all rooms and objects
 */

import { GameState } from '../state.js';
import { createAllRooms } from './roomFactory.js';
import { createAllObjects, placeObjectsInRooms } from './objectFactory.js';
import { ALL_ROOMS } from '../data/rooms-complete.js';
import { ALL_OBJECTS } from '../data/objects-complete.js';

/**
 * Create a complete initial game state with all rooms and objects
 * This is the main entry point for initializing the game world
 */
export function createInitialGameState(): GameState {
  // Create a temporary state for condition evaluation
  const tempState = new GameState();
  
  // Create all rooms
  const rooms = createAllRooms(ALL_ROOMS, tempState);
  
  // Create all objects
  const objects = createAllObjects(ALL_OBJECTS);
  
  // Place objects in their initial rooms
  placeObjectsInRooms(objects, rooms);
  
  // Create the final game state with all rooms and objects
  const gameState = GameState.createInitialState(objects, rooms);
  
  return gameState;
}

/**
 * Get count of rooms created
 */
export function getRoomCount(): number {
  return Object.keys(ALL_ROOMS).length;
}

/**
 * Get count of objects created
 */
export function getObjectCount(): number {
  return Object.keys(ALL_OBJECTS).length;
}

/**
 * Validate that all rooms are properly connected
 * Returns array of validation errors
 */
export function validateRoomConnections(state: GameState): string[] {
  const errors: string[] = [];
  
  for (const [roomId, room] of state.rooms.entries()) {
    for (const [direction, exit] of room.exits.entries()) {
      if (exit.destination && !state.rooms.has(exit.destination)) {
        errors.push(`Room ${roomId} has exit ${direction} to non-existent room ${exit.destination}`);
      }
    }
  }
  
  return errors;
}

/**
 * Validate that all objects are in valid locations
 * Returns array of validation errors
 */
export function validateObjectLocations(state: GameState): string[] {
  const errors: string[] = [];
  
  for (const [objectId, obj] of state.objects.entries()) {
    if (obj.location) {
      // Check if location is a room
      if (!state.rooms.has(obj.location) && !state.objects.has(obj.location)) {
        errors.push(`Object ${objectId} has invalid location ${obj.location}`);
      }
    }
  }
  
  return errors;
}
