/**
 * Death Messages Handler
 * Handles critical death scenarios and JIGS-UP messages
 */

import { GameState } from './state.js';

/**
 * Death scenario types
 */
export enum DeathScenario {
  CANYON_LEAP = 'CANYON_LEAP',
  LEAF_BURN = 'LEAF_BURN',
  DOME_LEAP = 'DOME_LEAP',
  MAINTENANCE_DROWN = 'MAINTENANCE_DROWN',
  CYCLOPS_EAT = 'CYCLOPS_EAT',
  BODY_DISRESPECT = 'BODY_DISRESPECT',
  BLACK_BOOK = 'BLACK_BOOK',
  RIVER_DROWN = 'RIVER_DROWN',
  WEAPON_DROP_WATER = 'WEAPON_DROP_WATER',
  SAND_COLLAPSE = 'SAND_COLLAPSE',
  TREE_FALL = 'TREE_FALL',
  SUICIDE = 'SUICIDE',
  CRETIN_KILL = 'CRETIN_KILL',
  BURN_SELF = 'BURN_SELF',
  GRUE_ATTACK = 'GRUE_ATTACK',
  GRUE_DEVOUR = 'GRUE_DEVOUR'
}

/**
 * Death messages for each scenario
 */
const DEATH_MESSAGES: Record<DeathScenario, string> = {
  [DeathScenario.CANYON_LEAP]: "Nice view, lousy place to jump.",
  [DeathScenario.LEAF_BURN]: "The leaves burn, and so do you.",
  [DeathScenario.DOME_LEAP]: "I'm afraid that the leap you attempted has done you in.",
  [DeathScenario.MAINTENANCE_DROWN]: "I'm afraid you have done drowned yourself.",
  [DeathScenario.CYCLOPS_EAT]: "The cyclops, tired of all of your games and trickery, grabs you firmly. As he licks his chops, he says \"Mmm. Just like Mom used to make 'em.\" It's nice to be appreciated.",
  [DeathScenario.BODY_DISRESPECT]: "A booming voice says \"Your disrespect costs you your life!\"",
  [DeathScenario.BLACK_BOOK]: "A booming voice says \"Your disrespect costs you your life!\"",
  [DeathScenario.RIVER_DROWN]: "You splash around for a while, fighting the current, then you drown.",
  [DeathScenario.WEAPON_DROP_WATER]: "Another pathetic sputter, this time from you, heralds your drowning.",
  [DeathScenario.SAND_COLLAPSE]: "The hole collapses, smothering you.",
  [DeathScenario.TREE_FALL]: "That was just a bit too far down.",
  [DeathScenario.SUICIDE]: "Well, you really did it that time. Is suicide painless?",
  [DeathScenario.CRETIN_KILL]: "If you insist.... Poof, you're dead!",
  [DeathScenario.BURN_SELF]: "You burn yourself to a crisp.",
  [DeathScenario.GRUE_ATTACK]: "Oh, no! You have walked into a den of hungry grues and it's dinner time!",
  [DeathScenario.GRUE_DEVOUR]: "Oh, no! You have walked into the slavering fangs of a lurking grue!"
};

/**
 * Check if a death scenario should trigger
 */
export function checkDeathScenario(state: GameState, action: string, objectId?: string): DeathScenario | null {
  const currentRoom = state.getCurrentRoom();
  
  // Canyon leap
  if (action === 'LEAP' && currentRoom?.id === 'CANYON-VIEW') {
    return DeathScenario.CANYON_LEAP;
  }
  
  // Leaf pile burn
  if (action === 'BURN' && objectId === 'LEAVES' && currentRoom?.id === 'CLEARING') {
    return DeathScenario.LEAF_BURN;
  }
  
  // Dome room leap
  if (action === 'LEAP' && currentRoom?.id === 'DOME-ROOM') {
    return DeathScenario.DOME_LEAP;
  }
  
  // Maintenance room drowning
  if (currentRoom?.id === 'MAINTENANCE-ROOM') {
    const waterLevel = state.getGlobalVariable('WATER_LEVEL') || 0;
    if (waterLevel >= 10) {
      return DeathScenario.MAINTENANCE_DROWN;
    }
  }
  
  // Cyclops eating player
  if (currentRoom?.id === 'CYCLOPS-ROOM') {
    const cyclopsAte = state.getGlobalVariable('CYCLOPS_ATE_PLAYER');
    if (cyclopsAte) {
      return DeathScenario.CYCLOPS_EAT;
    }
  }
  
  // Body disrespect
  if (action === 'TAKE' && objectId === 'BODIES') {
    return DeathScenario.BODY_DISRESPECT;
  }
  
  // River drowning
  if (action === 'PUT' && objectId === 'ME' && currentRoom?.id === 'RIVER') {
    return DeathScenario.RIVER_DROWN;
  }
  
  // Sand collapse
  if (action === 'DIG' && objectId === 'SAND') {
    const hasBuoy = state.isInInventory('BUOY');
    const scarabHere = state.getObject('SCARAB')?.location === currentRoom?.id;
    if (hasBuoy && scarabHere) {
      return DeathScenario.SAND_COLLAPSE;
    }
  }
  
  // Tree fall
  if (action === 'LEAP' && currentRoom?.id === 'UP-A-TREE') {
    return DeathScenario.TREE_FALL;
  }
  
  // Grue attacks in darkness
  if (!currentRoom?.hasFlag('ONBIT' as any) && action === 'WALK') {
    const hasLight = state.hasLightSource();
    if (!hasLight) {
      // Random chance of grue attack
      if (Math.random() < 0.5) {
        return DeathScenario.GRUE_ATTACK;
      } else {
        return DeathScenario.GRUE_DEVOUR;
      }
    }
  }
  
  return null;
}

/**
 * Get death message for a scenario
 */
export function getDeathMessage(scenario: DeathScenario): string {
  return DEATH_MESSAGES[scenario];
}

/**
 * Handle player death
 */
export function handleDeath(state: GameState, scenario: DeathScenario): void {
  const message = getDeathMessage(scenario);
  
  // Display death message
  console.log(message);
  console.log("\n    ****  You have died  ****\n");
  
  // Set death flag
  state.setGlobalVariable('PLAYER_DEAD', true);
  
  // Optionally offer resurrection or restart
  console.log("Would you like to restart, restore a saved game, or quit?");
}

/**
 * Check for impossible actions that should give error messages
 */
export function getImpossibleActionMessage(action: string, objectId?: string, state?: GameState): string | null {
  // Trying to take the mirror
  if (action === 'TAKE' && (objectId === 'MIRROR-1' || objectId === 'MIRROR-2')) {
    const mirrorMung = state?.getGlobalVariable('MIRROR_MUNG') || false;
    if (mirrorMung) {
      return "Haven't you done enough damage already?";
    }
    return "The mirror is many times your size. Give up.";
  }
  
  // Trying to open dam with hands
  if (action === 'OPEN' && objectId === 'DAM') {
    return "Are you the little Dutch boy, then? Sorry, this is a big dam.";
  }
  
  // Trying to open dam with tube
  if (action === 'OPEN' && objectId === 'DAM') {
    return "Sounds reasonable, but this isn't how.";
  }
  
  return null;
}
