/**
 * Main entry point for Zork I rewrite
 */

import { Terminal } from './io/terminal.js';
import { Display } from './io/display.js';
import { Lexer } from './parser/lexer.js';
import { Vocabulary } from './parser/vocabulary.js';
import { Parser } from './parser/parser.js';
import { CommandExecutor } from './engine/executor.js';
import { GameState } from './game/state.js';
import { GameObjectImpl } from './game/objects.js';
import { RoomImpl, Direction } from './game/rooms.js';
import { ROOMS } from './game/data/rooms.js';
import { OBJECTS } from './game/data/objects.js';
import { ObjectFlag, RoomFlag } from './game/data/flags.js';

/**
 * Initialize game objects from data
 */
function initializeObjects(): Map<string, GameObjectImpl> {
  const objects = new Map<string, GameObjectImpl>();

  for (const [id, data] of Object.entries(OBJECTS)) {
    const flags: ObjectFlag[] = data.flags.map(f => f as ObjectFlag);
    
    const obj = new GameObjectImpl({
      id: data.id,
      name: data.name,
      synonyms: data.synonyms,
      adjectives: data.adjectives,
      description: data.description,
      location: data.initialLocation,
      flags,
      capacity: data.capacity,
      size: data.size,
      value: data.value,
    });

    objects.set(id, obj);
  }

  return objects;
}

/**
 * Initialize game rooms from data
 */
function initializeRooms(): Map<string, RoomImpl> {
  const rooms = new Map<string, RoomImpl>();

  for (const [id, data] of Object.entries(ROOMS)) {
    const exits = new Map();
    
    // Convert exit data to Exit objects
    for (const exit of data.exits) {
      if (exit.destination) {
        const direction = exit.direction as Direction;
        exits.set(direction, {
          destination: exit.destination,
          message: exit.message,
        });
      }
    }

    const flags: RoomFlag[] = data.flags.map(f => f as RoomFlag);

    const room = new RoomImpl({
      id: data.id,
      name: data.name,
      description: data.longDescription || data.description,
      exits,
      flags,
    });

    rooms.set(id, room);
  }

  return rooms;
}

/**
 * Place objects in their initial locations
 */
function placeObjects(objects: Map<string, GameObjectImpl>, rooms: Map<string, RoomImpl>): void {
  for (const obj of objects.values()) {
    if (obj.location && obj.location !== 'LOCAL-GLOBALS' && obj.location !== 'GLOBAL-OBJECTS') {
      const room = rooms.get(obj.location);
      if (room) {
        room.addObject(obj.id);
      }
    }
  }
}

/**
 * Get available objects for parsing (in current room and inventory)
 */
function getAvailableObjects(state: GameState): GameObjectImpl[] {
  const available: GameObjectImpl[] = [];

  // Add inventory objects
  for (const objId of state.inventory) {
    const obj = state.getObject(objId);
    if (obj) {
      available.push(obj as GameObjectImpl);
    }
  }

  // Add objects in current room
  const room = state.getCurrentRoom();
  if (room) {
    for (const objId of room.objects) {
      const obj = state.getObject(objId);
      if (obj) {
        available.push(obj as GameObjectImpl);
      }
    }
  }

  return available;
}

/**
 * Main game loop
 */
async function gameLoop(): Promise<void> {
  const terminal = new Terminal();
  const display = new Display();
  const lexer = new Lexer();
  const vocabulary = new Vocabulary();
  const parser = new Parser();
  const executor = new CommandExecutor();

  // Initialize game
  terminal.initialize();
  
  // Display title
  terminal.writeLine(display.formatTitle());

  // Initialize game world
  const objects = initializeObjects();
  const rooms = initializeRooms();
  placeObjects(objects, rooms);

  // Create initial game state
  const state = GameState.createInitialState(objects, rooms);

  // Display initial room
  const startRoom = state.getCurrentRoom();
  if (startRoom) {
    terminal.writeLine(display.formatRoom(startRoom, true));
    
    // Show objects in room
    const roomObjects = state.getObjectsInCurrentRoom();
    if (roomObjects.length > 0) {
      terminal.writeLine(display.formatObjectList(roomObjects));
    }
  }

  terminal.writeLine('');

  // Game loop
  const processCommand = (input: string) => {
    if (!input || input.trim().length === 0) {
      terminal.showPrompt();
      return;
    }

    // Handle QUIT command
    if (input.trim().toLowerCase() === 'quit' || input.trim().toLowerCase() === 'q') {
      terminal.writeLine('Thanks for playing!');
      terminal.close();
      process.exit(0);
      return;
    }

    // Tokenize input
    const tokens = lexer.tokenize(input);

    // Expand abbreviations and assign token types
    const processedTokens = tokens.map(token => {
      const expanded = vocabulary.expandAbbreviation(token.word);
      const type = vocabulary.lookupWord(expanded);
      return {
        ...token,
        word: expanded,
        type,
      };
    });

    // Parse command
    const availableObjects = getAvailableObjects(state);
    const command = parser.parse(processedTokens, availableObjects);

    // Execute command
    const result = executor.execute(command, state);

    // Display result
    terminal.writeLine(display.formatMessage(result.message));

    // If movement was successful, show new room
    if (result.success && 'verb' in command) {
      const verb = command.verb?.toUpperCase();
      const movementVerbs = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'UP', 'DOWN', 'IN', 'OUT', 'N', 'S', 'E', 'W', 'U', 'D', 'GO', 'NE', 'NW', 'SE', 'SW'];
      
      if (movementVerbs.includes(verb)) {
        const currentRoom = state.getCurrentRoom();
        if (currentRoom) {
          terminal.writeLine('');
          terminal.writeLine(display.formatRoom(currentRoom, true));
          
          // Show objects in room
          const roomObjects = state.getObjectsInCurrentRoom();
          if (roomObjects.length > 0) {
            terminal.writeLine(display.formatObjectList(roomObjects));
          }
        }
      }

      // If LOOK command, show room
      if (verb === 'LOOK' || verb === 'L') {
        const currentRoom = state.getCurrentRoom();
        if (currentRoom) {
          terminal.writeLine('');
          terminal.writeLine(display.formatRoom(currentRoom, true));
          
          // Show objects in room
          const roomObjects = state.getObjectsInCurrentRoom();
          if (roomObjects.length > 0) {
            terminal.writeLine(display.formatObjectList(roomObjects));
          }
        }
      }
    }

    terminal.writeLine('');
    terminal.showPrompt();
  };

  // Start the game loop
  const readInput = () => {
    if (!terminal.isActive()) {
      return;
    }

    terminal.readLine((input) => {
      processCommand(input);
      
      // Continue reading input
      if (terminal.isActive()) {
        readInput();
      }
    });
  };

  terminal.showPrompt();
  readInput();
}

// Start the game
gameLoop().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
