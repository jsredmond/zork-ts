/**
 * Conditional Message System
 * Handles messages that vary based on game state, flags, or conditions
 */

import { GameState } from './state.js';
import { GameObject } from './objects.js';
import { Room } from './rooms.js';
import { ObjectFlag } from './data/flags.js';

/**
 * Condition function that evaluates game state
 */
export type MessageCondition = (state: GameState) => boolean;

/**
 * Message variant with condition
 */
export interface MessageVariant {
  condition: MessageCondition;
  message: string;
}

/**
 * Conditional message definition
 */
export interface ConditionalMessage {
  messageId: string;
  variants: MessageVariant[];
  defaultMessage: string;
}

/**
 * Registry of all conditional messages
 */
const conditionalMessages = new Map<string, ConditionalMessage>();

/**
 * Register a conditional message
 */
export function registerConditionalMessage(message: ConditionalMessage): void {
  conditionalMessages.set(message.messageId, message);
}

/**
 * Get the appropriate message variant based on game state
 */
export function getConditionalMessage(
  messageId: string,
  state: GameState
): string {
  const message = conditionalMessages.get(messageId);
  
  if (!message) {
    return `[Missing conditional message: ${messageId}]`;
  }
  
  // Find first matching variant
  for (const variant of message.variants) {
    if (variant.condition(state)) {
      return variant.message;
    }
  }
  
  // Return default if no variant matches
  return message.defaultMessage;
}

/**
 * Get conditional room description
 */
export function getConditionalRoomDescription(
  roomId: string,
  state: GameState
): string | null {
  const messageId = `ROOM-DESC-${roomId}`;
  
  if (!conditionalMessages.has(messageId)) {
    return null;
  }
  
  return getConditionalMessage(messageId, state);
}

/**
 * Get conditional object description
 */
export function getConditionalObjectDescription(
  objectId: string,
  state: GameState
): string | null {
  const messageId = `OBJECT-DESC-${objectId}`;
  
  if (!conditionalMessages.has(messageId)) {
    return null;
  }
  
  return getConditionalMessage(messageId, state);
}

/**
 * Check if a conditional message exists
 */
export function hasConditionalMessage(messageId: string): boolean {
  return conditionalMessages.has(messageId);
}

/**
 * Clear all registered conditional messages (for testing)
 */
export function clearConditionalMessages(): void {
  conditionalMessages.clear();
}

/**
 * Get all registered message IDs (for testing/debugging)
 */
export function getRegisteredMessageIds(): string[] {
  return Array.from(conditionalMessages.keys());
}

/**
 * Initialize all conditional messages
 * This should be called during game initialization
 */
export function initializeConditionalMessages(): void {
  // WEST-OF-HOUSE conditional description
  registerConditionalMessage({
    messageId: 'ROOM-DESC-WEST-OF-HOUSE',
    variants: [
      {
        condition: (state) => state.getFlag('WON_FLAG'),
        message: 'You are standing in an open field west of a white house, with a boarded front door. A secret path leads southwest into the forest.'
      }
    ],
    defaultMessage: 'You are standing in an open field west of a white house, with a boarded front door.'
  });

  // EAST-OF-HOUSE conditional description (window state)
  registerConditionalMessage({
    messageId: 'ROOM-DESC-EAST-OF-HOUSE',
    variants: [
      {
        condition: (state) => {
          const window = state.getObject('KITCHEN-WINDOW');
          return window?.hasFlag(ObjectFlag.OPENBIT) || false;
        },
        message: 'You are behind the white house. A path leads into the forest to the east. In one corner of the house there is a small window which is open.'
      }
    ],
    defaultMessage: 'You are behind the white house. A path leads into the forest to the east. In one corner of the house there is a small window which is slightly ajar.'
  });

  // LIVING-ROOM conditional description (complex multi-state)
  registerConditionalMessage({
    messageId: 'ROOM-DESC-LIVING-ROOM',
    variants: [
      {
        // Magic flag set, rug moved, trap door open
        condition: (state) => {
          const magicFlag = state.getFlag('MAGIC_FLAG');
          const rugMoved = state.getGlobalVariable('RUG_MOVED') || false;
          const trapDoor = state.getObject('TRAP-DOOR');
          const trapDoorOpen = trapDoor?.hasFlag(ObjectFlag.OPENBIT) || false;
          return magicFlag && rugMoved && trapDoorOpen;
        },
        message: 'You are in the living room. There is a doorway to the east. To the west is a cyclops-shaped opening in an old wooden door, above which is some strange gothic lettering, a trophy case, and a rug lying beside an open trap door.'
      },
      {
        // Magic flag set, rug moved, trap door closed
        condition: (state) => {
          const magicFlag = state.getFlag('MAGIC_FLAG');
          const rugMoved = state.getGlobalVariable('RUG_MOVED') || false;
          const trapDoor = state.getObject('TRAP-DOOR');
          const trapDoorOpen = trapDoor?.hasFlag(ObjectFlag.OPENBIT) || false;
          return magicFlag && rugMoved && !trapDoorOpen;
        },
        message: 'You are in the living room. There is a doorway to the east. To the west is a cyclops-shaped opening in an old wooden door, above which is some strange gothic lettering, a trophy case, and a closed trap door at your feet.'
      },
      {
        // Magic flag set, rug not moved, trap door open
        condition: (state) => {
          const magicFlag = state.getFlag('MAGIC_FLAG');
          const rugMoved = state.getGlobalVariable('RUG_MOVED') || false;
          const trapDoor = state.getObject('TRAP-DOOR');
          const trapDoorOpen = trapDoor?.hasFlag(ObjectFlag.OPENBIT) || false;
          return magicFlag && !rugMoved && trapDoorOpen;
        },
        message: 'You are in the living room. There is a doorway to the east. To the west is a cyclops-shaped opening in an old wooden door, above which is some strange gothic lettering, a trophy case, and an open trap door at your feet.'
      },
      {
        // Magic flag set, rug not moved, trap door closed
        condition: (state) => {
          const magicFlag = state.getFlag('MAGIC_FLAG');
          return magicFlag;
        },
        message: 'You are in the living room. There is a doorway to the east. To the west is a cyclops-shaped opening in an old wooden door, above which is some strange gothic lettering, a trophy case, and a large oriental rug in the center of the room.'
      },
      {
        // No magic flag, rug moved, trap door open
        condition: (state) => {
          const rugMoved = state.getGlobalVariable('RUG_MOVED') || false;
          const trapDoor = state.getObject('TRAP-DOOR');
          const trapDoorOpen = trapDoor?.hasFlag(ObjectFlag.OPENBIT) || false;
          return rugMoved && trapDoorOpen;
        },
        message: 'You are in the living room. There is a doorway to the east, a wooden door with strange gothic lettering to the west, which appears to be nailed shut, a trophy case, and a rug lying beside an open trap door.'
      },
      {
        // No magic flag, rug moved, trap door closed
        condition: (state) => {
          const rugMoved = state.getGlobalVariable('RUG_MOVED') || false;
          return rugMoved;
        },
        message: 'You are in the living room. There is a doorway to the east, a wooden door with strange gothic lettering to the west, which appears to be nailed shut, a trophy case, and a closed trap door at your feet.'
      },
      {
        // No magic flag, rug not moved, trap door open
        condition: (state) => {
          const trapDoor = state.getObject('TRAP-DOOR');
          const trapDoorOpen = trapDoor?.hasFlag(ObjectFlag.OPENBIT) || false;
          return trapDoorOpen;
        },
        message: 'You are in the living room. There is a doorway to the east, a wooden door with strange gothic lettering to the west, which appears to be nailed shut, a trophy case, and an open trap door at your feet.'
      }
    ],
    defaultMessage: 'You are in the living room. There is a doorway to the east, a wooden door with strange gothic lettering to the west, which appears to be nailed shut, a trophy case, and a large oriental rug in the center of the room.'
  });
}
