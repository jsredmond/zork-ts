/**
 * Integration Tests for I/O and Game Loop
 * Tests the complete input/output cycle with parser and executor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Lexer } from '../parser/lexer.js';
import { Vocabulary } from '../parser/vocabulary.js';
import { Parser } from '../parser/parser.js';
import { CommandExecutor } from '../engine/executor.js';
import { GameState } from '../game/state.js';
import { GameObjectImpl } from '../game/objects.js';
import { RoomImpl, Direction } from '../game/rooms.js';
import { Display } from './display.js';
import { ObjectFlag, RoomFlag } from '../game/data/flags.js';

describe('I/O Integration Tests', () => {
  let lexer: Lexer;
  let vocabulary: Vocabulary;
  let parser: Parser;
  let executor: CommandExecutor;
  let display: Display;
  let state: GameState;

  beforeEach(() => {
    lexer = new Lexer();
    vocabulary = new Vocabulary();
    parser = new Parser();
    executor = new CommandExecutor();
    display = new Display();

    // Create a simple test world
    const rooms = new Map<string, RoomImpl>();
    const testRoom = new RoomImpl({
      id: 'TEST-ROOM',
      name: 'Test Room',
      description: 'A simple test room.',
      flags: [RoomFlag.ONBIT],
    });
    
    const northRoom = new RoomImpl({
      id: 'NORTH-ROOM',
      name: 'North Room',
      description: 'A room to the north.',
      flags: [RoomFlag.ONBIT],
    });

    testRoom.setExit(Direction.NORTH, { destination: 'NORTH-ROOM' });
    northRoom.setExit(Direction.SOUTH, { destination: 'TEST-ROOM' });

    rooms.set('TEST-ROOM', testRoom);
    rooms.set('NORTH-ROOM', northRoom);

    const objects = new Map<string, GameObjectImpl>();
    const sword = new GameObjectImpl({
      id: 'SWORD',
      name: 'sword',
      synonyms: ['BLADE'],
      adjectives: ['SHARP'],
      description: 'A sharp sword.',
      location: 'TEST-ROOM',
      flags: [ObjectFlag.TAKEBIT],
      size: 10,
    });

    objects.set('SWORD', sword);
    testRoom.addObject('SWORD');

    state = new GameState({
      currentRoom: 'TEST-ROOM',
      objects,
      rooms,
      inventory: [],
      score: 0,
      moves: 0,
    });
  });

  describe('complete input/output cycle', () => {
    it('should process LOOK command through full pipeline', () => {
      // Tokenize
      const tokens = lexer.tokenize('look');
      
      // Process tokens with vocabulary
      const processedTokens = tokens.map(token => ({
        ...token,
        word: vocabulary.expandAbbreviation(token.word),
        type: vocabulary.lookupWord(token.word),
      }));

      // Parse
      const availableObjects = state.getObjectsInCurrentRoom();
      const command = parser.parse(processedTokens, availableObjects);

      // Execute
      const result = executor.execute(command, state);

      // Format output
      const message = display.formatMessage(result.message);

      expect(result.success).toBe(true);
      expect(message).toBeTruthy();
    });

    it('should process TAKE command through full pipeline', () => {
      const tokens = lexer.tokenize('take sword');
      
      const processedTokens = tokens.map(token => ({
        ...token,
        word: vocabulary.expandAbbreviation(token.word),
        type: vocabulary.lookupWord(token.word),
      }));

      const availableObjects = state.getObjectsInCurrentRoom();
      const command = parser.parse(processedTokens, availableObjects);
      const result = executor.execute(command, state);

      expect(result.success).toBe(true);
      expect(state.isInInventory('SWORD')).toBe(true);
    });

    it('should process INVENTORY command through full pipeline', () => {
      // First take the sword
      state.moveObject('SWORD', 'PLAYER');

      // Then check inventory
      const tokens = lexer.tokenize('inventory');
      
      const processedTokens = tokens.map(token => ({
        ...token,
        word: vocabulary.expandAbbreviation(token.word),
        type: vocabulary.lookupWord(token.word),
      }));

      const availableObjects = [
        ...state.getObjectsInCurrentRoom(),
        ...state.getInventoryObjects(),
      ];
      const command = parser.parse(processedTokens, availableObjects);
      const result = executor.execute(command, state);

      const formatted = display.formatMessage(result.message);

      expect(result.success).toBe(true);
      expect(formatted).toContain('sword');
    });

    it('should process movement command through full pipeline', () => {
      const tokens = lexer.tokenize('north');
      
      const processedTokens = tokens.map(token => ({
        ...token,
        word: vocabulary.expandAbbreviation(token.word),
        type: vocabulary.lookupWord(token.word),
      }));

      const availableObjects = state.getObjectsInCurrentRoom();
      const command = parser.parse(processedTokens, availableObjects);
      const result = executor.execute(command, state);

      expect(result.success).toBe(true);
      expect(state.currentRoom).toBe('NORTH-ROOM');
    });

    it('should handle abbreviations in full pipeline', () => {
      // Test 'i' for inventory
      const tokens = lexer.tokenize('i');
      
      const processedTokens = tokens.map(token => ({
        ...token,
        word: vocabulary.expandAbbreviation(token.word),
        type: vocabulary.lookupWord(vocabulary.expandAbbreviation(token.word)),
      }));

      const availableObjects = state.getObjectsInCurrentRoom();
      const command = parser.parse(processedTokens, availableObjects);
      const result = executor.execute(command, state);

      expect(result.success).toBe(true);
    });

    it('should handle invalid commands gracefully', () => {
      const tokens = lexer.tokenize('xyzzy');
      
      const processedTokens = tokens.map(token => ({
        ...token,
        word: vocabulary.expandAbbreviation(token.word),
        type: vocabulary.lookupWord(token.word),
      }));

      const availableObjects = state.getObjectsInCurrentRoom();
      const command = parser.parse(processedTokens, availableObjects);
      const result = executor.execute(command, state);

      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });
  });

  describe('game loop simulation', () => {
    it('should handle sequence of commands', () => {
      const commands = [
        'look',
        'take sword',
        'inventory',
        'north',
        'south',
      ];

      for (const input of commands) {
        const tokens = lexer.tokenize(input);
        
        const processedTokens = tokens.map(token => ({
          ...token,
          word: vocabulary.expandAbbreviation(token.word),
          type: vocabulary.lookupWord(vocabulary.expandAbbreviation(token.word)),
        }));

        const availableObjects = [
          ...state.getObjectsInCurrentRoom(),
          ...state.getInventoryObjects(),
        ];
        
        const command = parser.parse(processedTokens, availableObjects);
        const result = executor.execute(command, state);

        // All commands should execute without throwing
        expect(result).toBeDefined();
        // Message may be empty for some commands, just check it's defined
        expect(result.message).toBeDefined();
      }

      // Verify final state
      expect(state.isInInventory('SWORD')).toBe(true);
      expect(state.currentRoom).toBe('TEST-ROOM');
    });

    it('should maintain state consistency across commands', () => {
      // Take sword
      let tokens = lexer.tokenize('take sword');
      let processedTokens = tokens.map(token => ({
        ...token,
        word: vocabulary.expandAbbreviation(token.word),
        type: vocabulary.lookupWord(token.word),
      }));
      let availableObjects = [
        ...state.getObjectsInCurrentRoom(),
        ...state.getInventoryObjects(),
      ];
      let command = parser.parse(processedTokens, availableObjects);
      executor.execute(command, state);

      expect(state.isInInventory('SWORD')).toBe(true);

      // Drop sword
      tokens = lexer.tokenize('drop sword');
      processedTokens = tokens.map(token => ({
        ...token,
        word: vocabulary.expandAbbreviation(token.word),
        type: vocabulary.lookupWord(token.word),
      }));
      availableObjects = [
        ...state.getObjectsInCurrentRoom(),
        ...state.getInventoryObjects(),
      ];
      command = parser.parse(processedTokens, availableObjects);
      executor.execute(command, state);

      expect(state.isInInventory('SWORD')).toBe(false);
      
      const room = state.getCurrentRoom();
      expect(room?.objects).toContain('SWORD');
    });
  });
});
