/**
 * Action Handlers
 * Implements game action handlers
 */

import { GameState } from './state.js';
import { GameObject } from './objects.js';
import { ObjectFlag } from './data/flags.js';

export interface StateChange {
  type: string;
  objectId?: string;
  oldValue?: any;
  newValue?: any;
}

export interface ActionResult {
  success: boolean;
  message: string;
  stateChanges: StateChange[];
}

export interface ActionHandler {
  execute(state: GameState, ...args: any[]): ActionResult;
}

/**
 * Maximum inventory weight limit
 */
const MAX_INVENTORY_WEIGHT = 100;

/**
 * TAKE action handler
 * Allows player to pick up objects
 */
export class TakeAction implements ActionHandler {
  execute(state: GameState, objectId: string): ActionResult {
    const obj = state.getObject(objectId);
    
    if (!obj) {
      return {
        success: false,
        message: "You can't see that here.",
        stateChanges: []
      };
    }

    // Check if object is already in inventory
    if (state.isInInventory(objectId)) {
      return {
        success: false,
        message: "You already have that.",
        stateChanges: []
      };
    }

    // Check if object is takeable
    if (!obj.isTakeable()) {
      return {
        success: false,
        message: `You can't take the ${obj.name.toLowerCase()}.`,
        stateChanges: []
      };
    }

    // Check if object is in current room or inventory
    const currentRoom = state.getCurrentRoom();
    if (!currentRoom) {
      return {
        success: false,
        message: "Something went wrong.",
        stateChanges: []
      };
    }

    const isInCurrentRoom = obj.location === currentRoom.id;
    const isInContainer = obj.location && state.getObject(obj.location);
    
    if (!isInCurrentRoom && !isInContainer) {
      return {
        success: false,
        message: "You can't see that here.",
        stateChanges: []
      };
    }

    // Check weight constraints
    const currentWeight = state.getInventoryWeight();
    const objectWeight = obj.size || 0;
    
    if (currentWeight + objectWeight > MAX_INVENTORY_WEIGHT) {
      return {
        success: false,
        message: "You're carrying too much already.",
        stateChanges: []
      };
    }

    // Take the object
    const oldLocation = obj.location;
    state.moveObject(objectId, 'PLAYER', 'HELD');

    return {
      success: true,
      message: "Taken.",
      stateChanges: [{
        type: 'OBJECT_MOVED',
        objectId: objectId,
        oldValue: oldLocation,
        newValue: 'PLAYER'
      }]
    };
  }
}

/**
 * DROP action handler
 * Allows player to drop objects from inventory
 */
export class DropAction implements ActionHandler {
  execute(state: GameState, objectId: string): ActionResult {
    const obj = state.getObject(objectId);
    
    if (!obj) {
      return {
        success: false,
        message: "You don't have that.",
        stateChanges: []
      };
    }

    // Check if object is in inventory
    if (!state.isInInventory(objectId)) {
      return {
        success: false,
        message: "You don't have that.",
        stateChanges: []
      };
    }

    // Get current room
    const currentRoom = state.getCurrentRoom();
    if (!currentRoom) {
      return {
        success: false,
        message: "Something went wrong.",
        stateChanges: []
      };
    }

    // Drop the object in current room
    const oldLocation = obj.location;
    state.moveObject(objectId, currentRoom.id);

    return {
      success: true,
      message: "Dropped.",
      stateChanges: [{
        type: 'OBJECT_MOVED',
        objectId: objectId,
        oldValue: oldLocation,
        newValue: currentRoom.id
      }]
    };
  }
}

/**
 * INVENTORY action handler
 * Displays all objects in player's inventory
 */
export class InventoryAction implements ActionHandler {
  execute(state: GameState): ActionResult {
    // Check if inventory is empty
    if (state.isInventoryEmpty()) {
      return {
        success: true,
        message: "You are empty-handed.",
        stateChanges: []
      };
    }

    // Get all inventory objects
    const inventoryObjects = state.getInventoryObjects();
    
    // Build inventory list message
    const objectNames = inventoryObjects.map(obj => obj.name);
    let message = "You are carrying:\n";
    
    for (const name of objectNames) {
      message += `  ${name}\n`;
    }

    return {
      success: true,
      message: message.trim(),
      stateChanges: []
    };
  }
}
