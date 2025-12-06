/**
 * Special Behavior Handlers
 * Handles complex state-dependent behaviors for special objects
 */

import { GameState } from './state.js';
import { ActionResult } from './actions.js';

/**
 * Handler function for a special behavior
 * Returns a message string if the behavior applies, or null if it doesn't
 */
export type SpecialBehaviorHandler = (
  verb: string,
  state: GameState,
  ...args: any[]
) => string | null;

/**
 * Condition function to check if a special behavior should be active
 */
export type SpecialBehaviorCondition = (state: GameState) => boolean;

/**
 * SpecialBehavior defines a complex behavior for an object
 */
export interface SpecialBehavior {
  objectId: string;
  condition: SpecialBehaviorCondition;
  handler: SpecialBehaviorHandler;
}

/**
 * Registry of all special behaviors
 */
const specialBehaviors: Map<string, SpecialBehavior[]> = new Map();

/**
 * Register a special behavior for an object
 * Multiple behaviors can be registered for the same object
 */
export function registerSpecialBehavior(behavior: SpecialBehavior): void {
  const existing = specialBehaviors.get(behavior.objectId) || [];
  existing.push(behavior);
  specialBehaviors.set(behavior.objectId, existing);
}

/**
 * Apply special behavior for an object and verb
 * Returns the message to display, or null if no behavior applies
 */
export function applySpecialBehavior(
  objectId: string,
  verb: string,
  state: GameState,
  ...args: any[]
): string | null {
  const behaviors = specialBehaviors.get(objectId);
  
  if (!behaviors) {
    return null;
  }

  // Check each behavior in order until one applies
  for (const behavior of behaviors) {
    // Check if the condition is met
    if (behavior.condition(state)) {
      // Try to handle the action
      const result = behavior.handler(verb, state, ...args);
      if (result !== null) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Check if an object has any special behaviors
 */
export function hasSpecialBehavior(objectId: string): boolean {
  return specialBehaviors.has(objectId);
}

/**
 * Execute a special behavior and return an ActionResult
 */
export function executeSpecialBehavior(
  objectId: string,
  verb: string,
  state: GameState,
  ...args: any[]
): ActionResult | null {
  const message = applySpecialBehavior(objectId, verb, state, ...args);
  
  if (message === null) {
    return null;
  }

  return {
    success: true,
    message: message,
    stateChanges: []
  };
}

// ============================================================================
// Special Behavior Implementations
// ============================================================================

/**
 * WATER special behavior
 * Handles drinking water and taking water with/without containers
 */
const waterBehavior: SpecialBehavior = {
  objectId: 'WATER',
  condition: () => true, // Always active
  handler: (verb: string, state: GameState, directObject?: string, indirectObject?: string) => {
    if (verb === 'DRINK') {
      return 'The water is cool and refreshing.';
    }
    
    if (verb === 'TAKE') {
      // Check if trying to put water in a vehicle (like boat)
      if (indirectObject) {
        const container = state.getObject(indirectObject);
        if (container && container.hasFlag('VEHBIT')) {
          // Check if water is from global water source
          const water = state.getObject('WATER');
          const globalWater = state.getObject('GLOBAL-WATER');
          
          if (water && water.location === indirectObject) {
            return 'There is now a puddle in the bottom of the ' + container.name + '.';
          }
          
          // Water leaks out of non-bottle containers
          if (indirectObject !== 'BOTTLE') {
            return 'The water leaks out of the ' + container.name + ' and evaporates immediately.';
          }
        }
      }
      
      // Check if player has bottle
      const hasBottle = state.isInInventory('BOTTLE');
      
      if (!hasBottle) {
        return 'You have nothing to carry it in.';
      }
      
      // Check if bottle is open
      const bottle = state.getObject('BOTTLE');
      if (bottle && !bottle.hasFlag('OPENBIT')) {
        return 'The bottle is closed.';
      }
      
      // Check if bottle is empty
      const bottleContents = state.getObjectsInContainer('BOTTLE');
      if (bottleContents.length > 0) {
        return 'The bottle is already full.';
      }
      
      // Fill the bottle
      state.moveObject('WATER', 'BOTTLE');
      return 'The bottle is now full of water.';
    }
    
    return null;
  }
};

/**
 * GLOBAL-WATER special behavior
 * Handles interactions with water in streams/reservoirs
 */
const globalWaterBehavior: SpecialBehavior = {
  objectId: 'GLOBAL-WATER',
  condition: (state: GameState) => {
    // Active when in rooms with water sources
    const waterRooms = ['STREAM', 'RESERVOIR', 'RESERVOIR-NORTH', 'RESERVOIR-SOUTH'];
    return waterRooms.includes(state.currentRoom);
  },
  handler: (verb: string, state: GameState) => {
    if (verb === 'DRINK') {
      return 'The water is cool and refreshing.';
    }
    
    if (verb === 'TAKE') {
      // Check if player has bottle
      const hasBottle = state.isInInventory('BOTTLE');
      
      if (!hasBottle) {
        return 'You have nothing to carry it in.';
      }
      
      // Check if bottle is open
      const bottle = state.getObject('BOTTLE');
      if (bottle && !bottle.hasFlag('OPENBIT')) {
        return 'The bottle is closed.';
      }
      
      // Check if bottle is empty
      const bottleContents = state.getObjectsInContainer('BOTTLE');
      if (bottleContents.length > 0) {
        return 'The bottle is already full.';
      }
      
      // Fill the bottle with water from the source
      state.moveObject('WATER', 'BOTTLE');
      return 'The bottle is now full of water.';
    }
    
    return null;
  }
};

/**
 * GHOSTS special behavior
 * Handles interactions with spirits in the temple
 */
const ghostsBehavior: SpecialBehavior = {
  objectId: 'GHOSTS',
  condition: () => true, // Always active when ghosts are present
  handler: (verb: string, state: GameState, directObject?: string, indirectObject?: string) => {
    if (verb === 'EXORCISE') {
      return 'Only the ceremony itself has any effect.';
    }
    
    if (verb === 'ATTACK' || verb === 'KILL') {
      // Check if in kitchen and attacking with material objects
      if (state.currentRoom === 'KITCHEN' && indirectObject) {
        return 'How can you attack a spirit with material objects?';
      }
      return 'The ghosts do not seem to fear you.';
    }
    
    if (verb === 'TELL') {
      return 'The spirits jeer loudly and ignore you.';
    }
    
    // Generic ghostly response for other interactions
    return 'You seem unable to interact with these spirits.';
  }
};

/**
 * BASKET special behaviors
 * Handles interactions with basket when it's at the wrong end
 */
const basketBehavior: SpecialBehavior = {
  objectId: 'LOWERED-BASKET',
  condition: () => true,
  handler: (verb: string, state: GameState) => {
    if (verb === 'TAKE' || verb === 'EXAMINE') {
      return 'The basket is at the other end of the chain.';
    }
    return null;
  }
};

const raisedBasketBehavior: SpecialBehavior = {
  objectId: 'RAISED-BASKET',
  condition: () => true,
  handler: (verb: string, state: GameState) => {
    if (verb === 'TAKE') {
      return 'The cage is securely fastened to the iron chain.';
    }
    return null;
  }
};

/**
 * CANDLES special behavior
 * Handles lighting and extinguishing candles
 */
const candlesBehavior: SpecialBehavior = {
  objectId: 'CANDLES',
  condition: () => true,
  handler: (verb: string, state: GameState, directObject?: string, indirectObject?: string) => {
    const candles = state.getObject('CANDLES');
    if (!candles) return null;
    
    const isLit = candles.hasFlag('ONBIT');
    const isRmung = candles.hasFlag('RMUNGBIT');
    
    if (verb === 'LIGHT' || verb === 'BURN') {
      // Check what we're lighting with
      if (indirectObject === 'MATCH') {
        const match = state.getObject('MATCH');
        const matchLit = match && match.hasFlag('ONBIT');
        
        if (matchLit && isLit) {
          return 'The candles are already lit.';
        }
        
        if (matchLit && isRmung) {
          return 'The candles are already lit.';
        }
      }
      
      if (indirectObject === 'TORCH') {
        if (isLit) {
          return 'You realize, just in time, that the candles are already lighted.';
        }
        return 'The heat from the torch is so intense that the candles are vaporized.';
      }
      
      // Generic response for trying to light without proper tool
      if (!indirectObject || (indirectObject !== 'MATCH' && indirectObject !== 'TORCH')) {
        return 'You have to light them with something that\'s burning, you know.';
      }
    }
    
    if (verb === 'EXTINGUISH' || verb === 'TURN-OFF') {
      if (!isLit) {
        return 'The candles are not lighted.';
      }
    }
    
    return null;
  }
};

// Register water behaviors
registerSpecialBehavior(waterBehavior);
registerSpecialBehavior(globalWaterBehavior);

// Register ghost behavior
registerSpecialBehavior(ghostsBehavior);

// Register basket behaviors
registerSpecialBehavior(basketBehavior);
registerSpecialBehavior(raisedBasketBehavior);

// Register candles behavior
registerSpecialBehavior(candlesBehavior);

