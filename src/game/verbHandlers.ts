/**
 * V-Object Message Handlers
 * 
 * V-objects in ZIL are special pseudo-objects that represent abstract concepts,
 * spell effects, or vehicle-related actions. This module provides TypeScript
 * implementations of V-object message handlers from gverbs.zil.
 */

import { GameState } from './state';

/**
 * V-object message handler function type
 */
export type VObjectHandler = (
  state: GameState,
  verb: string,
  directObject?: string,
  indirectObject?: string
) => string | null;

/**
 * Registry of V-object handlers
 */
const vObjectHandlers: Map<string, VObjectHandler> = new Map();

/**
 * Register a V-object handler
 */
export function registerVObjectHandler(vObjectId: string, handler: VObjectHandler): void {
  vObjectHandlers.set(vObjectId, handler);
}

/**
 * Get a V-object handler
 */
export function getVObjectHandler(vObjectId: string): VObjectHandler | undefined {
  return vObjectHandlers.get(vObjectId);
}

/**
 * Check if an object is a V-object
 */
export function isVObject(objectId: string): boolean {
  return vObjectHandlers.has(objectId);
}

/**
 * Handle V-object interaction
 */
export function handleVObject(
  state: GameState,
  vObjectId: string,
  verb: string,
  directObject?: string,
  indirectObject?: string
): string | null {
  const handler = vObjectHandlers.get(vObjectId);
  if (!handler) {
    return null;
  }
  return handler(state, verb, directObject, indirectObject);
}

// ============================================================================
// SPELL-RELATED V-OBJECTS
// ============================================================================

/**
 * FEEBLE spell - Makes target weaker
 * From gverbs.zil V-DISENCHANT
 */
registerVObjectHandler('FEEBLE', (state, verb) => {
  if (verb === 'DISENCHANT') {
    return 'The target seems stronger now.';
  }
  return null;
});

/**
 * FUMBLE spell - Makes target clumsy
 * From gverbs.zil V-DISENCHANT
 */
registerVObjectHandler('FUMBLE', (state, verb) => {
  if (verb === 'DISENCHANT') {
    return 'The target no longer appears clumsy.';
  }
  return null;
});

/**
 * FEAR spell - Frightens target
 * From gverbs.zil V-DISENCHANT
 */
registerVObjectHandler('FEAR', (state, verb) => {
  if (verb === 'DISENCHANT') {
    return 'The target no longer appears afraid.';
  }
  return null;
});

/**
 * FREEZE spell - Immobilizes target
 * From gverbs.zil V-DISENCHANT
 */
registerVObjectHandler('FREEZE', (state, verb) => {
  if (verb === 'DISENCHANT') {
    return 'The target moves again.';
  }
  if (verb === 'TAKE') {
    return 'It seems rooted to the spot.';
  }
  return null;
});

/**
 * FALL spell - Causes target to fall
 * From gverbs.zil V-DISENCHANT
 */
registerVObjectHandler('FALL', (state, verb) => {
  if (verb === 'DISENCHANT') {
    return 'The target regains its balance.';
  }
  return null;
});

/**
 * FERMENT spell - Makes target sway
 * From gverbs.zil V-DISENCHANT
 */
registerVObjectHandler('FERMENT', (state, verb) => {
  if (verb === 'DISENCHANT') {
    return 'The target stops swaying.';
  }
  return null;
});

/**
 * FIERCE spell - Makes target aggressive
 * From gverbs.zil V-DISENCHANT
 */
registerVObjectHandler('FIERCE', (state, verb) => {
  if (verb === 'DISENCHANT') {
    return 'The target appears more peaceful.';
  }
  return null;
});

/**
 * FENCE spell - Creates a barrier
 * From gverbs.zil V-DISENCHANT
 */
registerVObjectHandler('FENCE', (state, verb) => {
  if (verb === 'DISENCHANT') {
    return 'The barrier disappears.';
  }
  return null;
});

/**
 * FANTASIZE spell - Creates illusions
 * From gverbs.zil V-DISENCHANT
 */
registerVObjectHandler('FANTASIZE', (state, verb) => {
  if (verb === 'DISENCHANT') {
    return 'The illusion fades away.';
  }
  return null;
});

/**
 * FLOAT spell - Makes target levitate
 * From gverbs.zil V-DISENCHANT and DESCRIBE-OBJECT
 */
registerVObjectHandler('FLOAT', (state, verb) => {
  if (verb === 'DISENCHANT') {
    return 'The target sinks to the ground.';
  }
  if (verb === 'TAKE') {
    return "You can't reach that. It's floating above your head.";
  }
  if (verb === 'DESCRIBE') {
    return '(floating in midair)';
  }
  return null;
});

/**
 * FUDGE spell - Creates sweet smell
 * From gverbs.zil V-DISENCHANT
 */
registerVObjectHandler('FUDGE', (state, verb) => {
  if (verb === 'DISENCHANT') {
    return 'The sweet smell has dispersed.';
  }
  if (verb === 'ENCHANT') {
    return 'A strong odor of chocolate permeates the room.';
  }
  return null;
});

/**
 * FLUORESCE spell - Makes target glow
 * From gverbs.zil V-ENCHANT
 */
registerVObjectHandler('FLUORESCE', (state, verb, directObject) => {
  if (verb === 'ENCHANT' && directObject) {
    const obj = state.getObject(directObject);
    if (obj) {
      obj.setFlag('LIGHTBIT', true);
      obj.setFlag('ONBIT', true);
      return `The ${obj.name.toLowerCase()} begins to glow.`;
    }
  }
  return null;
});

/**
 * FILCH spell - Steals object
 * From gverbs.zil V-ENCHANT
 */
registerVObjectHandler('FILCH', (state, verb, directObject) => {
  if (verb === 'ENCHANT' && directObject) {
    const obj = state.getObject(directObject);
    if (obj && obj.hasFlag('TAKEBIT')) {
      return 'Filched!';
    }
    return `You can't filch the ${obj?.name.toLowerCase() || 'object'}!`;
  }
  return null;
});

/**
 * FRY spell - Burns target
 * From gverbs.zil V-ENCHANT
 */
registerVObjectHandler('FRY', (state, verb, directObject) => {
  if (verb === 'ENCHANT' && directObject) {
    const obj = state.getObject(directObject);
    if (obj && obj.hasFlag('TAKEBIT')) {
      return `The ${obj.name.toLowerCase()} goes up in a puff of smoke.`;
    }
  }
  return null;
});

/**
 * FIREPROOF spell - Makes target resistant to fire
 * From gverbs.zil V-ENCHANT
 */
registerVObjectHandler('FIREPROOF', (state, verb) => {
  if (verb === 'ENCHANT') {
    return 'The target is now protected from fire.';
  }
  return null;
});

/**
 * Generic spell enchantment on non-actor
 * From gverbs.zil V-ENCHANT
 */
export function handleGenericSpellOnObject(objectName: string): string {
  return `That might have done something, but it's hard to tell with a ${objectName}.`;
}

/**
 * Generic spell enchantment on actor
 * From gverbs.zil V-ENCHANT
 */
export function handleGenericSpellOnActor(): string {
  return 'The wand stops glowing, but there is no other obvious effect.';
}

/**
 * No spell effect
 * From gverbs.zil V-ENCHANT
 */
export function handleNoSpellEffect(): string {
  return 'The wand stops glowing, but there is no other apparent effect.';
}

/**
 * Spell victim not set
 * From gverbs.zil V-ENCHANT
 */
export function handleNoSpellVictim(): string {
  return 'Nothing happens.';
}

/**
 * Spell not specified
 * From gverbs.zil V-ENCHANT
 */
export function handleSpellNotSpecified(): string {
  return 'You must be more specific.';
}

/**
 * Wand glowing message
 * From gverbs.zil V-INCANT
 */
export function handleWandGlow(): string {
  return 'The wand glows very brightly for a moment.';
}

/**
 * Incantation echo
 * From gverbs.zil V-INCANT
 */
export function handleIncantationEcho(): string {
  return 'The incantation echoes back faintly, but nothing else happens.';
}

/**
 * Float spell enchantment message
 * From gverbs.zil V-ENCHANT
 */
export function handleFloatEnchant(objectName: string): string {
  return `The ${objectName} floats serenely in midair.`;
}

// ============================================================================
// VEHICLE-RELATED V-OBJECTS
// ============================================================================

/**
 * Handle vehicle boarding messages
 * From gverbs.zil V-BOARD
 */
export function handleVehicleBoard(state: GameState, vehicleId: string): string {
  const vehicle = state.getObject(vehicleId);
  if (!vehicle) {
    return "You can't board that.";
  }

  if (!vehicle.hasFlag('VEHBIT')) {
    return `You have a theory on how to board a ${vehicle.name.toLowerCase()}, perhaps?`;
  }

  const currentLocation = state.getPlayerLocation();
  if (!currentLocation) {
    return "You can't board that right now.";
  }

  // Check if vehicle is in current room
  const vehicleLocation = vehicle.location;
  if (vehicleLocation !== currentLocation) {
    return `The ${vehicle.name.toLowerCase()} must be on the ground to be boarded.`;
  }

  // Check if already in a vehicle
  const playerLocation = state.getObject(state.getPlayerLocation() || '');
  if (playerLocation && playerLocation.hasFlag('VEHBIT')) {
    return `You are already in the ${playerLocation.name.toLowerCase()}!`;
  }

  // Board the vehicle
  state.moveObject('PLAYER', vehicleId);
  return `You are now in the ${vehicle.name.toLowerCase()}.`;
}

/**
 * Handle vehicle disembarking messages
 * From gverbs.zil V-DISEMBARK
 */
export function handleVehicleDisembark(state: GameState, vehicleId?: string): string {
  const playerLoc = state.getPlayerLocation();
  if (!playerLoc) {
    return "You're not in anything!";
  }

  const currentVehicle = state.getObject(playerLoc);
  if (!currentVehicle || !currentVehicle.hasFlag('VEHBIT')) {
    return "You're not in that!";
  }

  if (vehicleId && vehicleId !== playerLoc) {
    return "You're not in that!";
  }

  // Check if current room allows landing
  const room = state.getCurrentRoom();
  if (!room || !room.hasFlag('RLANDBIT')) {
    return 'You realize that getting out here would be fatal.';
  }

  // Disembark
  const roomId = currentVehicle.location;
  if (roomId) {
    state.moveObject('PLAYER', roomId);
  }
  return 'You are on your own feet again.';
}

/**
 * Handle vehicle movement restrictions
 * From gverbs.zil NO-GO-TELL
 */
export function handleVehicleMovementRestriction(
  state: GameState,
  targetRoomId: string
): string | null {
  const playerLoc = state.getPlayerLocation();
  if (!playerLoc) {
    return null;
  }

  const currentVehicle = state.getObject(playerLoc);
  if (!currentVehicle || !currentVehicle.hasFlag('VEHBIT')) {
    return null;
  }

  const targetRoom = state.getObject(targetRoomId);
  if (!targetRoom) {
    return null;
  }

  // Check if target room allows this vehicle type
  const vehicleType = currentVehicle.getProperty('VTYPE');
  if (!targetRoom.hasFlag('RLANDBIT') && !vehicleType) {
    return `You can't go there in a ${currentVehicle.name.toLowerCase()}.`;
  }

  if (!targetRoom.hasFlag('RLANDBIT') && vehicleType && !targetRoom.hasFlag(vehicleType)) {
    return `You can't go there in a ${currentVehicle.name.toLowerCase()}.`;
  }

  return null;
}

/**
 * Handle vehicle landing messages
 * From gverbs.zil GOTO
 */
export function handleVehicleLanding(state: GameState, vehicleId: string): string | null {
  const vehicle = state.getObject(vehicleId);
  if (!vehicle || !vehicle.hasFlag('VEHBIT')) {
    return null;
  }

  const room = state.getCurrentRoom();
  if (!room || !room.hasFlag('RLANDBIT')) {
    return null;
  }

  // Special case for balloon
  if (vehicleId === 'BALLOON') {
    return 'The balloon lands.';
  }

  return `The ${vehicle.name.toLowerCase()} comes to a rest on the shore.`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all registered V-object IDs
 */
export function getAllVObjectIds(): string[] {
  return Array.from(vObjectHandlers.keys());
}

/**
 * Clear all V-object handlers (for testing)
 */
export function clearVObjectHandlers(): void {
  vObjectHandlers.clear();
}

// ============================================================================
// SPECIAL VERB HANDLERS
// ============================================================================

/**
 * ECHO verb handler
 * From gverbs.zil V-ECHO
 * Echoes back the player's input
 */
export function handleEcho(input: string, echoCount: number = 0): string {
  if (!input || input.trim().length === 0) {
    return 'echo echo ...';
  }

  if (echoCount >= 2) {
    return '...';
  }

  return input + ' ';
}

/**
 * BURN verb with flaming object
 * From gverbs.zil PRE-BURN
 */
export function handleBurnWithFlaming(objectName: string): string {
  return `With a ${objectName}??!?`;
}

/**
 * Launch vehicle message
 * From gverbs.zil V-LAUNCH
 */
export function handleLaunchVehicle(): string {
  return "You can't launch that by saying \"launch\"!";
}

/**
 * Vehicle stop message (generic)
 * From gverbs.zil GOTO
 */
export function handleVehicleStop(vehicleName: string): string {
  return `The ${vehicleName} comes to a stop.`;
}

/**
 * Vehicle shore landing message
 * From gverbs.zil GOTO
 */
export function handleVehicleShoreLanding(vehicleName: string): string {
  return `The ${vehicleName} comes to a rest on the shore.`;
}

/**
 * Not in vehicle message
 * From gverbs.zil V-OVERBOARD
 */
export function handleNotInVehicle(): string {
  return "You're not in anything!";
}

/**
 * Overboard message
 * From gverbs.zil V-OVERBOARD
 */
export function handleOverboard(objectName: string): string {
  return `Ahoy -- ${objectName} overboard!`;
}

/**
 * Vehicle description suffix
 * From gverbs.zil DESCRIBE-ROOM
 */
export function handleVehicleLocationSuffix(vehicleName: string): string {
  return `, in the ${vehicleName}`;
}

/**
 * Outside vehicle description
 * From gverbs.zil DESCRIBE-OBJECT
 */
export function handleOutsideVehicle(vehicleName: string): string {
  return ` (outside the ${vehicleName})`;
}

/**
 * Can't go without vehicle
 * From gverbs.zil NO-GO-TELL
 */
export function handleCantGoWithoutVehicle(): string {
  return "You can't go there without a vehicle.";
}
