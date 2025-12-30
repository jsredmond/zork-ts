/**
 * AtmosphericMessageAligner
 * 
 * Ensures atmospheric messages match Z-Machine timing and content exactly.
 * Based on message probabilities and content from ZIL source (1actions.zil).
 * 
 * This module provides:
 * - Message probability constants from ZIL
 * - Location-specific message rules
 * - Deterministic message generation with seeded random
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

// ============================================================================
// MESSAGE PROBABILITY CONSTANTS FROM ZIL
// ============================================================================

/**
 * Forest message probability from ZIL I-FOREST-ROOM routine
 * 
 * ZIL source (1actions.zil):
 * <ROUTINE I-FOREST-ROOM ()
 *   <COND (<NOT <FOREST-ROOM?>>
 *          <DISABLE <INT I-FOREST-ROOM>>
 *          <RFALSE>)
 *         (<PROB 15>
 *          <TELL "You hear in the distance the chirping of a song bird." CR>)>>
 * 
 * 15% probability per turn in forest rooms
 */
export const FOREST_MESSAGE_PROBABILITY = 0.15;

/**
 * Underground message probability
 * 
 * Note: The original ZIL doesn't have a dedicated underground atmospheric
 * message system like the forest. The "grue" messages are death messages,
 * not atmospheric. Setting to 0 for Z-Machine parity.
 */
export const UNDERGROUND_MESSAGE_PROBABILITY = 0.0;

/**
 * Thief announcement probability when stealing
 * 
 * ZIL source (1actions.zil):
 * <COND (<AND <FSET? .X ,TAKEBIT>
 *             <NOT <FSET? .X ,INVISIBLE>>
 *             <PROB 40>>
 *        <TELL "You hear, off in the distance, someone saying..." CR>)
 * 
 * 40% probability when thief steals a takeable, visible item
 */
export const THIEF_ANNOUNCEMENT_PROBABILITY = 0.40;

// ============================================================================
// ATMOSPHERIC MESSAGE DEFINITIONS
// ============================================================================

/**
 * Atmospheric message configuration
 */
export interface AtmosphericMessage {
  /** Unique identifier for the message */
  readonly id: string;
  /** Exact message text matching Z-Machine */
  readonly text: string;
  /** Probability of displaying (0-1) */
  readonly probability: number;
  /** Location type where this message can appear */
  readonly locationType: 'forest' | 'underground' | 'any';
  /** Specific room IDs where this message can appear (empty = all rooms of type) */
  readonly validRooms: readonly string[];
}

/**
 * Forest atmospheric message - Bird chirping
 * 
 * This is the ONLY atmospheric message in the original Zork I.
 * It appears in forest rooms with 15% probability per turn.
 */
export const FOREST_BIRD_MESSAGE: AtmosphericMessage = Object.freeze({
  id: 'forest-bird',
  text: 'You hear in the distance the chirping of a song bird.',
  probability: FOREST_MESSAGE_PROBABILITY,
  locationType: 'forest',
  validRooms: Object.freeze(['FOREST-1', 'FOREST-2', 'FOREST-3', 'PATH', 'UP-A-TREE'])
});

/**
 * All atmospheric messages in the game
 * 
 * Note: Zork I only has ONE atmospheric message - the forest bird.
 * Other "atmospheric" content like grue warnings are actually
 * game state messages, not random atmospheric flavor.
 */
export const ATMOSPHERIC_MESSAGES: readonly AtmosphericMessage[] = Object.freeze([
  FOREST_BIRD_MESSAGE
]);

// ============================================================================
// LOCATION TYPE DETECTION
// ============================================================================

/**
 * Forest room IDs from ZIL FOREST-ROOM? routine
 * 
 * ZIL source (1actions.zil):
 * <ROUTINE FOREST-ROOM? ()
 *   <OR <EQUAL? ,HERE ,FOREST-1 ,FOREST-2 ,FOREST-3>
 *       <EQUAL? ,HERE ,PATH ,UP-A-TREE>>>
 */
export const FOREST_ROOMS: readonly string[] = Object.freeze([
  'FOREST-1',
  'FOREST-2', 
  'FOREST-3',
  'PATH',
  'UP-A-TREE'
]);

/**
 * Check if a room is a forest room
 * @param roomId - The room ID to check
 * @returns true if the room is a forest room
 */
export function isForestRoom(roomId: string): boolean {
  return FOREST_ROOMS.includes(roomId);
}

/**
 * Underground room detection
 * Underground rooms are those without natural light (not surface rooms)
 * This is used for potential future atmospheric messages
 */
export const SURFACE_ROOMS: readonly string[] = Object.freeze([
  'WEST-OF-HOUSE',
  'NORTH-OF-HOUSE', 
  'BEHIND-HOUSE',
  'SOUTH-OF-HOUSE',
  'FOREST-1',
  'FOREST-2',
  'FOREST-3',
  'PATH',
  'CLEARING',
  'UP-A-TREE',
  'CANYON-VIEW',
  'ROCKY-LEDGE',
  'CLIFF-BOTTOM',
  'SANDY-BEACH',
  'SHORE',
  'DAM-BASE',
  'DAM',
  'DAM-LOBBY'
]);

/**
 * Check if a room is underground
 * @param roomId - The room ID to check
 * @returns true if the room is underground
 */
export function isUndergroundRoom(roomId: string): boolean {
  return !SURFACE_ROOMS.includes(roomId);
}

// ============================================================================
// DETERMINISTIC MESSAGE GENERATION
// ============================================================================

/**
 * Seeded random number generator state for atmospheric messages
 */
let atmosphericSeed: number = 12345;

/**
 * Set the random seed for deterministic atmospheric messages
 * @param seed - The seed value
 */
export function setAtmosphericSeed(seed: number): void {
  atmosphericSeed = seed;
}

/**
 * Get the current atmospheric seed
 * @returns The current seed value
 */
export function getAtmosphericSeed(): number {
  return atmosphericSeed;
}

/**
 * Generate a deterministic random number between 0 and 1
 * Uses a simple linear congruential generator for reproducibility
 * @returns A pseudo-random number between 0 and 1
 */
export function getAtmosphericRandom(): number {
  // LCG parameters (same as MINSTD)
  const a = 48271;
  const m = 2147483647;
  atmosphericSeed = (atmosphericSeed * a) % m;
  return atmosphericSeed / m;
}

/**
 * Get atmospheric message for a specific seed and move count
 * 
 * This function provides deterministic message generation that matches
 * Z-Machine behavior when using the same seed.
 * 
 * @param roomId - Current room ID
 * @param seed - Random seed for deterministic behavior
 * @param moveCount - Current move count (used to advance RNG state)
 * @returns The atmospheric message text, or null if no message
 */
export function getMessageForSeed(
  roomId: string,
  seed: number,
  moveCount: number
): string | null {
  // Initialize seed state
  setAtmosphericSeed(seed);
  
  // Advance RNG to the correct state for this move
  // Each move consumes one random number
  for (let i = 0; i < moveCount; i++) {
    getAtmosphericRandom();
  }
  
  // Check if we should generate a message
  return generateAtmosphericMessage(roomId);
}

/**
 * Generate an atmospheric message for the current room
 * Uses the current RNG state (call setAtmosphericSeed first for determinism)
 * 
 * @param roomId - Current room ID
 * @returns The atmospheric message text, or null if no message
 */
export function generateAtmosphericMessage(roomId: string): string | null {
  // Check each atmospheric message
  for (const message of ATMOSPHERIC_MESSAGES) {
    // Check if message is valid for this room
    if (!isMessageValidForRoom(message, roomId)) {
      continue;
    }
    
    // Check probability
    const random = getAtmosphericRandom();
    if (random < message.probability) {
      return message.text;
    }
  }
  
  return null;
}

/**
 * Check if a message is valid for a given room
 * @param message - The atmospheric message configuration
 * @param roomId - The room ID to check
 * @returns true if the message can appear in this room
 */
export function isMessageValidForRoom(
  message: AtmosphericMessage,
  roomId: string
): boolean {
  // If specific rooms are defined, check against them
  if (message.validRooms.length > 0) {
    return message.validRooms.includes(roomId);
  }
  
  // Otherwise check by location type
  switch (message.locationType) {
    case 'forest':
      return isForestRoom(roomId);
    case 'underground':
      return isUndergroundRoom(roomId);
    case 'any':
      return true;
    default:
      return false;
  }
}

// ============================================================================
// ATMOSPHERIC MESSAGE ALIGNER CLASS
// ============================================================================

/**
 * AtmosphericMessageAligner class for managing atmospheric message generation
 * with Z-Machine parity
 */
export class AtmosphericMessageAligner {
  private seed: number;
  private moveCount: number;
  private suppressMessages: boolean;

  constructor(seed: number = 12345) {
    this.seed = seed;
    this.moveCount = 0;
    this.suppressMessages = false;
    setAtmosphericSeed(seed);
  }

  /**
   * Set the random seed
   * @param seed - The seed value
   */
  setSeed(seed: number): void {
    this.seed = seed;
    setAtmosphericSeed(seed);
  }

  /**
   * Get the current seed
   * @returns The current seed value
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Set the current move count
   * @param moveCount - The move count
   */
  setMoveCount(moveCount: number): void {
    this.moveCount = moveCount;
  }

  /**
   * Get the current move count
   * @returns The current move count
   */
  getMoveCount(): number {
    return this.moveCount;
  }

  /**
   * Increment the move count
   */
  incrementMoveCount(): void {
    this.moveCount++;
  }

  /**
   * Suppress atmospheric messages (for testing)
   * @param suppress - Whether to suppress messages
   */
  suppress(suppress: boolean = true): void {
    this.suppressMessages = suppress;
  }

  /**
   * Check if messages are suppressed
   * @returns true if messages are suppressed
   */
  isSuppressed(): boolean {
    return this.suppressMessages;
  }

  /**
   * Generate an atmospheric message for the current state
   * @param roomId - Current room ID
   * @returns The atmospheric message text, or null if no message
   */
  generateMessage(roomId: string): string | null {
    if (this.suppressMessages) {
      return null;
    }
    
    return getMessageForSeed(roomId, this.seed, this.moveCount);
  }

  /**
   * Get all possible messages for a room
   * @param roomId - The room ID
   * @returns Array of possible atmospheric messages
   */
  getPossibleMessages(roomId: string): AtmosphericMessage[] {
    return ATMOSPHERIC_MESSAGES.filter(msg => isMessageValidForRoom(msg, roomId));
  }

  /**
   * Check if a room can have atmospheric messages
   * @param roomId - The room ID
   * @returns true if the room can have atmospheric messages
   */
  canHaveMessages(roomId: string): boolean {
    return this.getPossibleMessages(roomId).length > 0;
  }

  /**
   * Reset the aligner to initial state
   * @param seed - Optional new seed
   */
  reset(seed?: number): void {
    if (seed !== undefined) {
      this.seed = seed;
    }
    this.moveCount = 0;
    setAtmosphericSeed(this.seed);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Filter atmospheric messages from output
 * Used during parity testing to remove non-deterministic content
 * 
 * @param output - The output string to filter
 * @returns The filtered output with atmospheric messages removed
 */
export function filterAtmosphericMessages(output: string): string {
  let filtered = output;
  
  // Remove all known atmospheric message patterns
  for (const message of ATMOSPHERIC_MESSAGES) {
    // Escape special regex characters in the message text
    const escaped = message.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped + '\\s*', 'g');
    filtered = filtered.replace(pattern, '');
  }
  
  return filtered.trim();
}

/**
 * Check if output contains any atmospheric messages
 * @param output - The output string to check
 * @returns true if the output contains atmospheric messages
 */
export function containsAtmosphericMessage(output: string): boolean {
  return ATMOSPHERIC_MESSAGES.some(msg => output.includes(msg.text));
}

/**
 * Get the atmospheric message from output if present
 * @param output - The output string to check
 * @returns The atmospheric message found, or null if none
 */
export function extractAtmosphericMessage(output: string): AtmosphericMessage | null {
  for (const message of ATMOSPHERIC_MESSAGES) {
    if (output.includes(message.text)) {
      return message;
    }
  }
  return null;
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

/**
 * Default atmospheric message aligner instance
 */
let defaultAligner: AtmosphericMessageAligner | null = null;

/**
 * Get the default atmospheric message aligner
 * @returns The default aligner instance
 */
export function getAtmosphericMessageAligner(): AtmosphericMessageAligner {
  if (!defaultAligner) {
    defaultAligner = new AtmosphericMessageAligner();
  }
  return defaultAligner;
}

/**
 * Reset the default atmospheric message aligner
 * @param seed - Optional seed for the new aligner
 */
export function resetAtmosphericMessageAligner(seed?: number): void {
  defaultAligner = new AtmosphericMessageAligner(seed);
}
