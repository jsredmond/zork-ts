/**
 * Special Puzzle Mechanics
 * Implements complex puzzle logic for Zork I
 */

import { GameState } from './state.js';
import { GameObjectImpl } from './objects.js';
import { ObjectFlag } from './data/flags.js';
import { ActionResult } from './actions.js';

/**
 * Dam and Flood Control Puzzle
 * Handles the bolt turning mechanism, water level changes, and gate control
 */
export class DamPuzzle {
  /**
   * Handle turning the bolt with the wrench
   */
  static turnBolt(state: GameState, wrenchId: string): ActionResult {
    const gateFlag = state.getGlobalVariable('GATE_FLAG') || false;
    const gatesOpen = state.getGlobalVariable('GATES_OPEN') || false;

    // Check if wrench is being used
    if (!wrenchId || wrenchId !== 'WRENCH') {
      return {
        success: false,
        message: "The bolt won't turn with your best effort.",
        stateChanges: []
      };
    }

    // Check if player has the wrench
    if (!state.isInInventory(wrenchId)) {
      return {
        success: false,
        message: "You don't have the wrench.",
        stateChanges: []
      };
    }

    // Check if gate flag is set (bubble is glowing)
    if (!gateFlag) {
      return {
        success: false,
        message: "The bolt won't turn.",
        stateChanges: []
      };
    }

    // Toggle gates
    if (gatesOpen) {
      // Close gates
      state.setGlobalVariable('GATES_OPEN', false);
      
      // Update LOW_TIDE flag after gates close
      // Water will start to rise, so LOW_TIDE becomes false
      state.setFlag('LOW_TIDE', false);

      return {
        success: true,
        message: "The sluice gates close and water starts to collect behind the dam.",
        stateChanges: [{
          type: 'GATES_CLOSED',
          oldValue: true,
          newValue: false
        }]
      };
    } else {
      // Open gates
      state.setGlobalVariable('GATES_OPEN', true);

      return {
        success: true,
        message: "The sluice gates open and water pours through the dam.",
        stateChanges: [{
          type: 'GATES_OPENED',
          oldValue: false,
          newValue: true
        }]
      };
    }
  }

  /**
   * Handle pushing buttons in maintenance room
   */
  static pushButton(state: GameState, buttonId: string): ActionResult {
    if (buttonId === 'BLUE-BUTTON') {
      const waterLevel = state.getGlobalVariable('WATER_LEVEL') || 0;
      
      if (waterLevel === 0) {
        // Start the leak
        state.setGlobalVariable('WATER_LEVEL', 1);
        
        // Make leak visible
        const leak = state.getObject('LEAK') as GameObjectImpl;
        if (leak) {
          leak.removeFlag(ObjectFlag.INVISIBLE);
        }

        return {
          success: true,
          message: "The blue button appears to have been recently installed. A thin stream of water begins to trickle from the east wall of the room (apparently, a leak has occurred in a pipe).",
          stateChanges: [{
            type: 'LEAK_STARTED',
            oldValue: 0,
            newValue: 1
          }]
        };
      } else {
        return {
          success: true,
          message: "The water is already leaking.",
          stateChanges: []
        };
      }
    } else if (buttonId === 'BROWN-BUTTON') {
      // Turn off gate flag (bubble stops glowing)
      state.setGlobalVariable('GATE_FLAG', false);
      
      return {
        success: true,
        message: "Click.",
        stateChanges: [{
          type: 'GATE_FLAG_OFF',
          oldValue: true,
          newValue: false
        }]
      };
    } else if (buttonId === 'YELLOW-BUTTON') {
      // Turn on gate flag (bubble starts glowing)
      state.setGlobalVariable('GATE_FLAG', true);
      
      return {
        success: true,
        message: "Click.",
        stateChanges: [{
          type: 'GATE_FLAG_ON',
          oldValue: false,
          newValue: true
        }]
      };
    }

    return {
      success: false,
      message: "Nothing happens.",
      stateChanges: []
    };
  }

  /**
   * Handle putting putty on the leak
   */
  static fixLeak(state: GameState, puttyId: string): ActionResult {
    const waterLevel = state.getGlobalVariable('WATER_LEVEL') || 0;

    if (waterLevel <= 0) {
      return {
        success: false,
        message: "There's no leak here.",
        stateChanges: []
      };
    }

    if (puttyId !== 'PUTTY') {
      return {
        success: false,
        message: "That won't fix the leak.",
        stateChanges: []
      };
    }

    // Fix the leak
    state.setGlobalVariable('WATER_LEVEL', -1);
    
    // Make leak invisible again
    const leak = state.getObject('LEAK') as GameObjectImpl;
    if (leak) {
      leak.addFlag(ObjectFlag.INVISIBLE);
    }

    return {
      success: true,
      message: "The putty seems to have stopped the leak.",
      stateChanges: [{
        type: 'LEAK_FIXED',
        oldValue: waterLevel,
        newValue: -1
      }]
    };
  }

  /**
   * Get dam room description based on gate state
   */
  static getDamRoomDescription(state: GameState): string {
    const gatesOpen = state.getGlobalVariable('GATES_OPEN') || false;
    const lowTide = state.getFlag('LOW_TIDE');

    let desc = "You are standing on the top of the Flood Control Dam #3, which was quite a tourist attraction in times far distant. There are paths to the north, south, and west, and a scramble down.";

    if (lowTide && gatesOpen) {
      desc += "\nThe water level behind the dam is low: The sluice gates have been opened. Water rushes through the dam and downstream.";
    } else if (gatesOpen) {
      desc += "\nThe sluice gates are open, and water rushes through the dam. The water level in the reservoir is still high.";
    } else {
      desc += "\nThe sluice gates are closed. The water level in the reservoir is high.";
    }

    return desc;
  }

  /**
   * Get control panel description
   */
  static getControlPanelDescription(state: GameState): string {
    const gateFlag = state.getGlobalVariable('GATE_FLAG') || false;

    let desc = "There is a control panel here, on which a large metal bolt is mounted. Directly above the bolt is a small green plastic bubble";

    if (gateFlag) {
      desc += " which is glowing serenely";
    }

    desc += ".";

    return desc;
  }
}

/**
 * Mirror Room Puzzle
 * Handles mirror breaking and room connections
 */
export class MirrorPuzzle {
  /**
   * Handle rubbing the mirror
   */
  static rubMirror(state: GameState, mirrorId: string, toolId?: string): ActionResult {
    const mirrorMung = state.getGlobalVariable('MIRROR_MUNG') || false;

    if (mirrorMung) {
      return {
        success: false,
        message: "The mirror is broken into many pieces.",
        stateChanges: []
      };
    }

    // Check if using hands or appropriate tool
    if (toolId && toolId !== 'HANDS') {
      return {
        success: false,
        message: "Fiddling with the mirror has no effect.",
        stateChanges: []
      };
    }

    return {
      success: true,
      message: "There is a rumble from deep within the earth and the room shakes.",
      stateChanges: []
    };
  }

  /**
   * Handle breaking the mirror
   */
  static breakMirror(state: GameState): ActionResult {
    const mirrorMung = state.getGlobalVariable('MIRROR_MUNG') || false;

    if (mirrorMung) {
      return {
        success: false,
        message: "Haven't you done enough damage already?",
        stateChanges: []
      };
    }

    // Break the mirror
    state.setGlobalVariable('MIRROR_MUNG', true);
    state.setGlobalVariable('LUCKY', false);

    return {
      success: true,
      message: "You have broken the mirror. I hope you have a seven years' supply of good luck handy.",
      stateChanges: [{
        type: 'MIRROR_BROKEN',
        oldValue: false,
        newValue: true
      }]
    };
  }

  /**
   * Handle taking/touching the mirror
   */
  static takeMirror(state: GameState): ActionResult {
    const mirrorMung = state.getGlobalVariable('MIRROR_MUNG') || false;

    if (mirrorMung) {
      return {
        success: false,
        message: "Haven't you done enough damage already?",
        stateChanges: []
      };
    }

    return {
      success: false,
      message: "The mirror is many times your size. Give up.",
      stateChanges: []
    };
  }

  /**
   * Handle examining the mirror
   */
  static examineMirror(state: GameState): ActionResult {
    const mirrorMung = state.getGlobalVariable('MIRROR_MUNG') || false;

    if (mirrorMung) {
      return {
        success: true,
        message: "The mirror is broken into many pieces.",
        stateChanges: []
      };
    }

    return {
      success: true,
      message: "There is an ugly person staring back at you. The mirror is many times your size. Give up.",
      stateChanges: []
    };
  }

  /**
   * Get mirror room description
   */
  static getMirrorRoomDescription(state: GameState): string {
    const mirrorMung = state.getGlobalVariable('MIRROR_MUNG') || false;

    let desc = "You are in a large square room with tall ceilings. On the south wall is an enormous mirror which fills the entire wall. There are exits on the other three sides of the room.";

    if (mirrorMung) {
      desc += "\nUnfortunately, the mirror has been destroyed by your recklessness.";
    }

    return desc;
  }
}

/**
 * Rainbow and Pot of Gold Puzzle
 * Handles rainbow appearance and pot of gold visibility
 */
export class RainbowPuzzle {
  /**
   * Handle waving the sceptre to make rainbow appear/disappear
   */
  static waveSceptre(state: GameState, sceptreId: string): ActionResult {
    const currentRoom = state.getCurrentRoom();
    
    if (!currentRoom) {
      return {
        success: false,
        message: "You can't do that here.",
        stateChanges: []
      };
    }

    // Check if in appropriate location (Aragain Falls or End of Rainbow)
    if (currentRoom.id !== 'ARAGAIN-FALLS' && currentRoom.id !== 'END-OF-RAINBOW' && currentRoom.id !== 'ON-RAINBOW') {
      return {
        success: false,
        message: "A faint rainbow appears in the mist, but it quickly fades.",
        stateChanges: []
      };
    }

    const rainbowFlag = state.getFlag('RAINBOW_FLAG');

    if (!rainbowFlag) {
      // Make rainbow appear
      state.setFlag('RAINBOW_FLAG', true);

      // Make pot of gold visible if at end of rainbow
      if (currentRoom.id === 'END-OF-RAINBOW') {
        const pot = state.getObject('POT-OF-GOLD') as GameObjectImpl;
        if (pot && pot.location === 'END-OF-RAINBOW') {
          pot.removeFlag(ObjectFlag.INVISIBLE);
        }
      }

      let message = "Suddenly, the rainbow appears to become solid and, I venture, walkable (I think the giveaway was the stairs and bannister).";
      
      if (currentRoom.id === 'END-OF-RAINBOW') {
        const pot = state.getObject('POT-OF-GOLD');
        if (pot && pot.location === 'END-OF-RAINBOW') {
          message += "\nA shimmering pot of gold appears at the end of the rainbow.";
        }
      }

      return {
        success: true,
        message: message,
        stateChanges: [{
          type: 'RAINBOW_APPEARED',
          oldValue: false,
          newValue: true
        }]
      };
    } else {
      // Make rainbow disappear
      state.setFlag('RAINBOW_FLAG', false);

      // If player is on rainbow, move them
      if (currentRoom.id === 'ON-RAINBOW') {
        // Move player to Aragain Falls
        state.setCurrentRoom('ARAGAIN-FALLS');
        
        return {
          success: true,
          message: "The rainbow seems to have become somewhat run-of-the-mill.\nYou fall to the ground.",
          stateChanges: [{
            type: 'RAINBOW_DISAPPEARED',
            oldValue: true,
            newValue: false
          }]
        };
      }

      return {
        success: true,
        message: "The rainbow seems to have become somewhat run-of-the-mill.",
        stateChanges: [{
          type: 'RAINBOW_DISAPPEARED',
          oldValue: true,
          newValue: false
        }]
      };
    }
  }

  /**
   * Handle climbing the rainbow
   */
  static climbRainbow(state: GameState): ActionResult {
    const rainbowFlag = state.getFlag('RAINBOW_FLAG');

    if (!rainbowFlag) {
      return {
        success: false,
        message: "The rainbow is not solid enough to climb.",
        stateChanges: []
      };
    }

    return {
      success: true,
      message: "You climb up onto the rainbow.",
      stateChanges: []
    };
  }
}

/**
 * Rope and Basket Puzzle
 * Handles raising/lowering basket and rope mechanics
 */
export class RopeBasketPuzzle {
  /**
   * Handle raising the basket
   */
  static raiseBasket(state: GameState): ActionResult {
    const cageTop = state.getGlobalVariable('CAGE_TOP');

    if (cageTop === true || cageTop === undefined) {
      return {
        success: false,
        message: "The basket is already at the top.",
        stateChanges: []
      };
    }

    // Move basket to top position
    state.setGlobalVariable('CAGE_TOP', true);

    // Move raised basket to shaft room
    const raisedBasket = state.getObject('RAISED-BASKET');
    const loweredBasket = state.getObject('LOWERED-BASKET');

    if (raisedBasket && loweredBasket) {
      state.moveObject('RAISED-BASKET', 'SHAFT-ROOM');
      state.moveObject('LOWERED-BASKET', 'LOWER-SHAFT');
    }

    return {
      success: true,
      message: "The basket is raised to the top of the shaft.",
      stateChanges: [{
        type: 'BASKET_RAISED',
        oldValue: false,
        newValue: true
      }]
    };
  }

  /**
   * Handle lowering the basket
   */
  static lowerBasket(state: GameState): ActionResult {
    const cageTop = state.getGlobalVariable('CAGE_TOP');

    if (cageTop === false) {
      return {
        success: false,
        message: "The basket is already at the bottom.",
        stateChanges: []
      };
    }

    // Move basket to bottom position
    state.setGlobalVariable('CAGE_TOP', false);

    // Move lowered basket to lower shaft
    const raisedBasket = state.getObject('RAISED-BASKET');
    const loweredBasket = state.getObject('LOWERED-BASKET');

    if (raisedBasket && loweredBasket) {
      state.moveObject('LOWERED-BASKET', 'LOWER-SHAFT');
      state.moveObject('RAISED-BASKET', 'SHAFT-ROOM');
    }

    return {
      success: true,
      message: "The basket is lowered to the bottom of the shaft.",
      stateChanges: [{
        type: 'BASKET_LOWERED',
        oldValue: true,
        newValue: false
      }]
    };
  }

  /**
   * Handle tying the rope
   */
  static tieRope(state: GameState, ropeId: string, objectId: string): ActionResult {
    if (ropeId !== 'ROPE') {
      return {
        success: false,
        message: "You can't tie that.",
        stateChanges: []
      };
    }

    // Check if player has the rope
    if (!state.isInInventory(ropeId)) {
      return {
        success: false,
        message: "You don't have the rope.",
        stateChanges: []
      };
    }

    // Check what object we're tying to
    if (objectId === 'RAILING' || objectId === 'RAIL') {
      // Tie rope to railing in dome room
      state.setGlobalVariable('ROPE_TIED', true);
      state.setFlag('DOME_FLAG', true);

      // Move rope to the room (no longer in inventory)
      const currentRoom = state.getCurrentRoom();
      if (currentRoom) {
        state.moveObject(ropeId, currentRoom.id);
      }

      return {
        success: true,
        message: "The rope is now tied to the railing.",
        stateChanges: [{
          type: 'ROPE_TIED',
          oldValue: false,
          newValue: true
        }]
      };
    }

    return {
      success: false,
      message: "You can't tie the rope to that.",
      stateChanges: []
    };
  }

  /**
   * Handle climbing the rope
   */
  static climbRope(state: GameState): ActionResult {
    const ropeTied = state.getGlobalVariable('ROPE_TIED') || false;

    if (!ropeTied) {
      return {
        success: false,
        message: "The rope isn't tied to anything.",
        stateChanges: []
      };
    }

    return {
      success: true,
      message: "You climb down the rope.",
      stateChanges: []
    };
  }
}

/**
 * Trap Door Puzzle
 * Handles trap door opening and revealing
 */
export class TrapDoorPuzzle {
  /**
   * Handle opening the trap door
   */
  static openTrapDoor(state: GameState): ActionResult {
    const trapDoor = state.getObject('TRAP-DOOR') as GameObjectImpl;
    
    if (!trapDoor) {
      return {
        success: false,
        message: "You can't see that here.",
        stateChanges: []
      };
    }

    // Make trap door visible if not already
    if (trapDoor.hasFlag(ObjectFlag.INVISIBLE)) {
      trapDoor.removeFlag(ObjectFlag.INVISIBLE);
    }

    // Check if already open
    if (trapDoor.hasFlag(ObjectFlag.OPENBIT)) {
      return {
        success: false,
        message: "It's already open.",
        stateChanges: []
      };
    }

    // Open the trap door
    trapDoor.addFlag(ObjectFlag.OPENBIT);

    return {
      success: true,
      message: "The door reluctantly opens to reveal a rickety staircase descending into darkness.",
      stateChanges: [{
        type: 'TRAP_DOOR_OPENED',
        oldValue: false,
        newValue: true
      }]
    };
  }

  /**
   * Handle moving the rug to reveal trap door
   */
  static moveRug(state: GameState): ActionResult {
    const trapDoor = state.getObject('TRAP-DOOR') as GameObjectImpl;
    
    if (!trapDoor) {
      return {
        success: false,
        message: "Nothing happens.",
        stateChanges: []
      };
    }

    // Reveal the trap door
    if (trapDoor.hasFlag(ObjectFlag.INVISIBLE)) {
      trapDoor.removeFlag(ObjectFlag.INVISIBLE);
      
      return {
        success: true,
        message: "With a great effort, the rug is moved to one side of the room, revealing the dusty cover of a closed trap door.",
        stateChanges: [{
          type: 'TRAP_DOOR_REVEALED',
          oldValue: false,
          newValue: true
        }]
      };
    }

    return {
      success: true,
      message: "The rug is moved.",
      stateChanges: []
    };
  }
}

/**
 * Grating Puzzle
 * Handles grating opening with keys
 */
export class GratingPuzzle {
  /**
   * Handle unlocking the grating with keys
   */
  static unlockGrating(state: GameState, keysId: string): ActionResult {
    const grating = state.getObject('GRATE') as GameObjectImpl;
    
    if (!grating) {
      return {
        success: false,
        message: "You can't see that here.",
        stateChanges: []
      };
    }

    if (keysId !== 'KEYS') {
      return {
        success: false,
        message: "That won't unlock it.",
        stateChanges: []
      };
    }

    // Check if player has the keys
    if (!state.isInInventory(keysId)) {
      return {
        success: false,
        message: "You don't have the keys.",
        stateChanges: []
      };
    }

    // Check if already open
    if (grating.hasFlag(ObjectFlag.OPENBIT)) {
      return {
        success: false,
        message: "It's already unlocked.",
        stateChanges: []
      };
    }

    // Unlock and open the grating
    grating.addFlag(ObjectFlag.OPENBIT);
    
    // Make grating visible if not already
    if (grating.hasFlag(ObjectFlag.INVISIBLE)) {
      grating.removeFlag(ObjectFlag.INVISIBLE);
    }

    // Set grate revealed flag
    state.setGlobalVariable('GRATE_REVEALED', true);

    return {
      success: true,
      message: "The grating is unlocked and opens up to reveal a dark passageway.",
      stateChanges: [{
        type: 'GRATING_UNLOCKED',
        oldValue: false,
        newValue: true
      }]
    };
  }

  /**
   * Handle revealing the grating by moving leaves
   */
  static revealGrating(state: GameState): ActionResult {
    const grating = state.getObject('GRATE') as GameObjectImpl;
    
    if (!grating) {
      return {
        success: false,
        message: "Nothing happens.",
        stateChanges: []
      };
    }

    // Reveal the grating
    if (grating.hasFlag(ObjectFlag.INVISIBLE)) {
      grating.removeFlag(ObjectFlag.INVISIBLE);
      state.setGlobalVariable('GRATE_REVEALED', true);
      
      return {
        success: true,
        message: "In disturbing the pile of leaves, a grating is revealed.",
        stateChanges: [{
          type: 'GRATING_REVEALED',
          oldValue: false,
          newValue: true
        }]
      };
    }

    return {
      success: true,
      message: "The leaves are moved.",
      stateChanges: []
    };
  }
}

/**
 * Boat Inflation Puzzle
 * Handles inflating and deflating the boat
 */
export class BoatPuzzle {
  /**
   * Handle inflating the boat with pump
   */
  static inflateBoat(state: GameState, boatId: string, pumpId: string): ActionResult {
    if (boatId !== 'INFLATABLE-BOAT' && boatId !== 'BOAT') {
      return {
        success: false,
        message: "You can't inflate that.",
        stateChanges: []
      };
    }

    if (pumpId !== 'PUMP') {
      return {
        success: false,
        message: "You need a pump to inflate it.",
        stateChanges: []
      };
    }

    // Check if player has both items
    if (!state.isInInventory(boatId) && !state.isInInventory(pumpId)) {
      return {
        success: false,
        message: "You don't have those items.",
        stateChanges: []
      };
    }

    // Check if already inflated
    const deflateFlag = state.getFlag('DEFLATE');
    if (!deflateFlag) {
      return {
        success: false,
        message: "The boat is already inflated.",
        stateChanges: []
      };
    }

    // Inflate the boat
    state.setFlag('DEFLATE', false);

    // Replace deflated boat with inflated boat
    const currentRoom = state.getCurrentRoom();
    const boatLocation = state.getObject(boatId)?.location;
    
    if (boatLocation) {
      state.moveObject('INFLATABLE-BOAT', 'NOWHERE');
      state.moveObject('INFLATED-BOAT', boatLocation);
    }

    return {
      success: true,
      message: "The boat inflates and appears seaworthy.",
      stateChanges: [{
        type: 'BOAT_INFLATED',
        oldValue: true,
        newValue: false
      }]
    };
  }

  /**
   * Handle deflating the boat
   */
  static deflateBoat(state: GameState): ActionResult {
    const deflateFlag = state.getFlag('DEFLATE');
    
    if (deflateFlag) {
      return {
        success: false,
        message: "The boat is already deflated.",
        stateChanges: []
      };
    }

    // Deflate the boat
    state.setFlag('DEFLATE', true);

    // Replace inflated boat with deflated boat
    const inflatedBoat = state.getObject('INFLATED-BOAT');
    if (inflatedBoat && inflatedBoat.location) {
      const location = inflatedBoat.location;
      state.moveObject('INFLATED-BOAT', 'NOWHERE');
      state.moveObject('INFLATABLE-BOAT', location);
    }

    return {
      success: true,
      message: "The boat deflates.",
      stateChanges: [{
        type: 'BOAT_DEFLATED',
        oldValue: false,
        newValue: true
      }]
    };
  }
}

/**
 * Coffin Puzzle
 * Handles coffin movement and access
 */
export class CoffinPuzzle {
  /**
   * Handle pushing the coffin
   */
  static pushCoffin(state: GameState): ActionResult {
    const coffinCure = state.getFlag('COFFIN_CURE');
    
    if (coffinCure) {
      return {
        success: true,
        message: "The coffin moves, but nothing else happens.",
        stateChanges: []
      };
    }

    // Enable coffin movement
    state.setFlag('COFFIN_CURE', true);

    return {
      success: true,
      message: "The coffin moves, revealing a passage to the northwest.",
      stateChanges: [{
        type: 'COFFIN_MOVED',
        oldValue: false,
        newValue: true
      }]
    };
  }
}

/**
 * Magic Word Puzzle
 * Handles saying the magic word to open passages
 */
export class MagicWordPuzzle {
  /**
   * Handle saying the magic word "ULYSSES"
   */
  static sayMagicWord(state: GameState, word: string): ActionResult {
    const currentRoom = state.getCurrentRoom();
    
    if (!currentRoom) {
      return {
        success: false,
        message: "Nothing happens.",
        stateChanges: []
      };
    }

    // Check if the word is the magic word
    if (word.toUpperCase() !== 'ULYSSES') {
      return {
        success: true,
        message: "Nothing happens.",
        stateChanges: []
      };
    }

    // Check if in appropriate location (Cyclops room)
    if (currentRoom.id === 'CYCLOPS-ROOM') {
      state.setFlag('MAGIC_FLAG', true);
      state.setFlag('CYCLOPS_FLAG', true);

      return {
        success: true,
        message: "The cyclops, hearing the name of his father's deadly nemesis, flees the room by knocking down the wall on the east of the room.",
        stateChanges: [{
          type: 'MAGIC_WORD_SPOKEN',
          oldValue: false,
          newValue: true
        }]
      };
    }

    return {
      success: true,
      message: "Nothing happens.",
      stateChanges: []
    };
  }
}
