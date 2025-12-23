/**
 * Death and Resurrection System
 * Implements JIGS-UP routine from 1actions.zil
 * Handles player death, resurrection, and game over conditions
 */

import { GameState } from './state.js';
import { ObjectFlag, RoomFlag } from './data/flags.js';
import { applyDeathPenalty } from './scoring.js';

/**
 * Above-ground rooms where non-treasure items can be scattered
 * Based on ZIL ABOVE-GROUND table from 1dungeon.zil
 */
const ABOVE_GROUND_ROOMS = [
  'WEST-OF-HOUSE',
  'NORTH-OF-HOUSE', 
  'EAST-OF-HOUSE',
  'SOUTH-OF-HOUSE',
  'FOREST-1',
  'FOREST-2',
  'FOREST-3',
  'PATH',
  'CLEARING',
  'GRATING-CLEARING',
  'CANYON-VIEW'
];

/**
 * Trigger player death
 * Based on JIGS-UP routine from 1actions.zil (lines 4046-4095)
 * 
 * @param state - Current game state
 * @param deathMessage - Description of how player died
 * @returns Message to display (includes death and resurrection/game over)
 */
export function triggerDeath(state: GameState, deathMessage: string): string {
  let output = '';
  
  // Check if already dead (double death = game over)
  const alreadyDead = state.getGlobalVariable('DEAD');
  if (alreadyDead) {
    output += "It takes a talented person to be killed while already dead. YOU are such\n";
    output += "a talent. Unfortunately, it takes a talented person to deal with it.\n";
    output += "I am not such a talent. Sorry.\n";
    // Set game over flag
    state.setGlobalVariable('GAME_OVER', true);
    return output;
  }
  
  // Display death message
  if (deathMessage) {
    output += deathMessage + '\n';
  }
  
  // Check luck flag
  const lucky = state.getGlobalVariable('LUCKY');
  if (!lucky) {
    output += "Bad luck, huh?\n";
  }
  
  // Display death banner
  output += "\n    ****  You have died  ****\n\n\n";
  
  // Apply death penalty (deduct 10 points, never below 0)
  applyDeathPenalty(state);
  
  // Get death count
  const deaths = (state.getGlobalVariable('DEATHS') || 0) as number;
  
  // Check for third death (game over)
  if (deaths >= 2) {
    output += "You clearly are a suicidal maniac.  We don't allow psychotics in the\n";
    output += "cave, since they may harm other adventurers.  Your remains will be\n";
    output += "installed in the Land of the Living Dead, where your fellow\n";
    output += "adventurers may gloat over them.\n";
    // Set game over flag
    state.setGlobalVariable('GAME_OVER', true);
    return output;
  }
  
  // Increment death counter
  state.setGlobalVariable('DEATHS', deaths + 1);
  
  // Check if SOUTH-TEMPLE has been touched (determines resurrection vs death state)
  const southTemple = state.getRoom('SOUTH-TEMPLE');
  const southTempleTouched = southTemple?.hasFlag(RoomFlag.TOUCHBIT);
  
  if (southTempleTouched) {
    // Enter death state (become spirit in Hades)
    output += "As you take your last breath, you feel relieved of your burdens. The\n";
    output += "feeling passes as you find yourself before the gates of Hell, where\n";
    output += "the spirits jeer at you and deny you entry.  Your senses are\n";
    output += "disturbed.  The objects in the dungeon appear indistinct, bleached of\n";
    output += "color, even unreal.\n\n";
    
    // Set death state flags
    state.setGlobalVariable('DEAD', true);
    state.setGlobalVariable('TROLL_FLAG', true);
    state.setGlobalVariable('ALWAYS_LIT', true);
    
    // Move to Entrance to Hades
    state.setCurrentRoom('ENTRANCE-TO-HADES');
    
    // Get room description
    const hadesRoom = state.getCurrentRoom();
    if (hadesRoom) {
      output += hadesRoom.name + '\n';
      output += hadesRoom.description + '\n';
    }
  } else {
    // Automatic resurrection
    output += "Now, let's take a look here... Well, you probably deserve another chance. I can't\n";
    output += "quite fix you up completely, but you can't have everything.\n\n";
    
    // Resurrect player
    resurrectPlayer(state);
    
    // Get forest room description
    const forestRoom = state.getCurrentRoom();
    if (forestRoom) {
      output += forestRoom.name + '\n';
      output += forestRoom.description + '\n';
    }
  }
  
  return output;
}

/**
 * Resurrect player after death
 * Based on JIGS-UP routine from 1actions.zil
 * 
 * @param state - Current game state
 */
function resurrectPlayer(state: GameState): void {
  // Move player to FOREST-1
  state.setCurrentRoom('FOREST-1');
  
  // Clear trap door TOUCHBIT (using ObjectFlag, not RoomFlag)
  const trapDoor = state.getObject('TRAP-DOOR');
  if (trapDoor) {
    trapDoor.flags.delete(ObjectFlag.TOUCHBIT);
  }
  
  // Clear P-CONT (parser continuation)
  state.setGlobalVariable('P-CONT', null);
  
  // Randomize objects (scatter treasures and items)
  randomizeObjects(state);
  
  // Kill all interrupts/daemons
  killInterrupts(state);
}

/**
 * Kill all active interrupts/daemons
 * Based on KILL-INTERRUPTS routine from 1actions.zil
 * 
 * @param state - Current game state
 */
function killInterrupts(state: GameState): void {
  // Disable all game interrupts
  const interruptsToDisable = [
    'I-XB',           // Boat interrupt
    'I-XC',           // Candle interrupt (alternate)
    'I-CYCLOPS',      // Cyclops interrupt
    'I-LANTERN',      // Lamp timer
    'I-CANDLES',      // Candle timer
    'I-SWORD',        // Sword glow
    'I-FOREST-ROOM',  // Forest room events
    'I-MATCH',        // Match burning
    'I-FIGHT',        // Combat daemon
    'I-THIEF'         // Thief daemon
  ];
  
  for (const interruptId of interruptsToDisable) {
    state.eventSystem.disableEvent(interruptId);
  }
  
  // Clear match ONBIT flag
  const match = state.getObject('MATCH');
  if (match) {
    match.flags.delete(ObjectFlag.ONBIT);
  }
}

/**
 * Randomize objects after death
 * Based on RANDOMIZE-OBJECTS routine from 1actions.zil
 * Scatters treasures to random RLANDBIT rooms, non-treasures to ABOVE-GROUND rooms
 * 
 * @param state - Current game state
 */
function randomizeObjects(state: GameState): void {
  // Move LAMP to LIVING-ROOM if in inventory
  const lamp = state.getObject('LAMP');
  if (lamp && state.isInInventory('LAMP')) {
    lamp.location = 'LIVING-ROOM';
    state.removeFromInventory('LAMP');
  }
  
  // Move COFFIN to EGYPT-ROOM if in inventory
  const coffin = state.getObject('COFFIN');
  if (coffin && state.isInInventory('COFFIN')) {
    coffin.location = 'EGYPT-ROOM';
    state.removeFromInventory('COFFIN');
  }
  
  // Reset SWORD treasure value to 0
  const sword = state.getObject('SWORD');
  if (sword) {
    sword.tvalue = 0;
  }
  
  // Get all objects in inventory
  const inventoryObjects = state.getInventoryObjects();
  
  // Get all RLANDBIT rooms (above-ground rooms where treasures can be scattered)
  const rooms = state.getAllRooms();
  const rlandRooms = rooms.filter(room => 
    room.hasFlag(RoomFlag.RLANDBIT) && !room.hasFlag(RoomFlag.ONBIT)
  );
  
  // Move each object to appropriate location
  for (const obj of inventoryObjects) {
    // Skip lamp and coffin (already handled)
    if (obj.id === 'LAMP' || obj.id === 'COFFIN') {
      continue;
    }
    
    // Treasures (tvalue > 0) go to random RLANDBIT rooms
    if (obj.tvalue && obj.tvalue > 0) {
      // Pick a random RLANDBIT room using 50% probability per room
      if (rlandRooms.length > 0) {
        let placed = false;
        
        // Iterate through rooms with 50% chance each
        for (const room of rlandRooms) {
          if (Math.random() < 0.5) {
            obj.location = room.id;
            state.removeFromInventory(obj.id);
            placed = true;
            break;
          }
        }
        
        // If not placed after iterating, force placement in first RLANDBIT room
        if (!placed) {
          const randomRoom = rlandRooms[Math.floor(Math.random() * rlandRooms.length)];
          obj.location = randomRoom.id;
          state.removeFromInventory(obj.id);
        }
      }
    } else {
      // Non-treasures go to random ABOVE-GROUND room
      const randomIndex = Math.floor(Math.random() * ABOVE_GROUND_ROOMS.length);
      const targetRoom = ABOVE_GROUND_ROOMS[randomIndex];
      obj.location = targetRoom;
      state.removeFromInventory(obj.id);
    }
  }
}

/**
 * Trigger grue death
 * Called when player moves into darkness without light
 * 
 * @param state - Current game state
 * @returns Death message
 */
export function triggerGrueDeath(state: GameState): string {
  const grueMessage = "Oh, no! You have walked into the slavering fangs of a lurking grue!";
  return triggerDeath(state, grueMessage);
}

/**
 * Check if game is over
 * 
 * @param state - Current game state
 * @returns true if game is over
 */
export function isGameOver(state: GameState): boolean {
  return state.getGlobalVariable('GAME_OVER') === true;
}

/**
 * Get death count
 * 
 * @param state - Current game state
 * @returns Number of times player has died
 */
export function getDeathCount(state: GameState): number {
  return (state.getGlobalVariable('DEATHS') || 0) as number;
}
