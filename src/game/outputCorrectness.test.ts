/**
 * Output Correctness Property Tests
 * Feature: modern-zork-rewrite, Property 3: Output correctness
 * Validates: Requirements 2.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { createInitialGameState } from './factories/gameFactory.js';
import { GameState } from './state.js';
import { CommandExecutor } from '../engine/executor.js';
import { Parser } from '../parser/parser.js';
import { Lexer } from '../parser/lexer.js';
import { Vocabulary } from '../parser/vocabulary.js';

describe('Output Correctness - Property Tests', () => {
  let lexer: Lexer;
  let vocabulary: Vocabulary;
  let parser: Parser;
  let executor: CommandExecutor;

  beforeEach(() => {
    lexer = new Lexer();
    vocabulary = new Vocabulary();
    parser = new Parser();
    executor = new CommandExecutor();
  });

  /**
   * Helper function to process a command through the full pipeline
   */
  function processCommand(commandText: string, gameState: GameState): { success: boolean; output: string } {
    // Tokenize
    const tokens = lexer.tokenize(commandText);
    
    // Process tokens with vocabulary
    const processedTokens = tokens.map(token => ({
      ...token,
      word: vocabulary.expandAbbreviation(token.word),
      type: vocabulary.lookupWord(token.word),
    }));

    // Parse
    const availableObjects = gameState.getObjectsInCurrentRoom();
    const command = parser.parse(processedTokens, availableObjects);

    // Execute
    const result = executor.execute(command, gameState);

    return {
      success: result.success,
      output: result.message || ''
    };
  }

  // Feature: modern-zork-rewrite, Property 3: Output correctness
  it('should produce non-empty output for valid commands', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'look',
          'inventory',
          'score'
        ),
        (commandText) => {
          const freshState = createInitialGameState();
          const result = processCommand(commandText, freshState);
          
          // Property: Valid commands should produce non-empty output
          expect(result.output).toBeTruthy();
          expect(result.output.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: modern-zork-rewrite, Property 3: Output correctness
  it('should produce consistent output for identical game states', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'look',
          'inventory',
          'score'
        ),
        (commandText) => {
          // Create two identical game states
          const state1 = createInitialGameState();
          const state2 = createInitialGameState();
          
          const result1 = processCommand(commandText, state1);
          const result2 = processCommand(commandText, state2);
          
          // Property: Same command on identical states should produce identical output
          expect(result1.output).toEqual(result2.output);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: modern-zork-rewrite, Property 3: Output correctness
  it('should produce deterministic output for command sequences', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom(
            'look',
            'inventory',
            'score'
          ),
          { minLength: 1, maxLength: 5 }
        ),
        (commands) => {
          // Execute sequence twice
          const state1 = createInitialGameState();
          const state2 = createInitialGameState();
          
          const outputs1: string[] = [];
          const outputs2: string[] = [];
          
          for (const cmd of commands) {
            const result1 = processCommand(cmd, state1);
            const result2 = processCommand(cmd, state2);
            
            outputs1.push(result1.output);
            outputs2.push(result2.output);
          }
          
          // Property: Same command sequence should produce same output sequence
          expect(outputs1).toEqual(outputs2);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: modern-zork-rewrite, Property 3: Output correctness
  it('should produce contextually appropriate output for room descriptions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('look', 'l'),
        (commandText) => {
          const freshState = createInitialGameState();
          const result = processCommand(commandText, freshState);
          
          // Property: Room descriptions should contain room name
          const currentRoom = freshState.rooms.get(freshState.currentRoom);
          if (currentRoom) {
            expect(result.output.toLowerCase()).toContain(currentRoom.name.toLowerCase());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: modern-zork-rewrite, Property 3: Output correctness
  it('should produce appropriate output for inventory commands', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('inventory', 'i'),
        (commandText) => {
          const freshState = createInitialGameState();
          const result = processCommand(commandText, freshState);
          
          // Property: Inventory output should indicate empty or list items
          const hasItems = freshState.inventory.length > 0;
          if (hasItems) {
            // Should list items
            expect(result.output.length).toBeGreaterThan(20);
          } else {
            // Should indicate empty
            expect(result.output.toLowerCase()).toMatch(/empty|nothing|no items/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: modern-zork-rewrite, Property 3: Output correctness
  it('should produce output that reflects state changes', () => {
    const freshState = createInitialGameState();
    
    // Open mailbox and take leaflet
    processCommand('open mailbox', freshState);
    const takeResult = processCommand('take leaflet', freshState);
    
    // Property: Taking an object should produce output
    expect(takeResult.output).toBeTruthy();
    expect(takeResult.output.length).toBeGreaterThan(0);
    
    // If the take was successful, inventory should reflect it
    if (takeResult.success) {
      const invResult = processCommand('inventory', freshState);
      // Property: Inventory should now mention the leaflet
      expect(invResult.output.toLowerCase()).toContain('leaflet');
    }
  });

  // Feature: modern-zork-rewrite, Property 3: Output correctness
  it('should produce error output for invalid commands', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'take nonexistent',
          'examine invisible'
        ),
        (commandText) => {
          const freshState = createInitialGameState();
          const result = processCommand(commandText, freshState);
          
          // Property: Invalid commands should produce error output
          expect(result.output).toBeTruthy();
          expect(result.output.length).toBeGreaterThan(0);
          // Error messages should be informative
          expect(result.output.toLowerCase()).toMatch(/can't|cannot|don't|unable|not|no/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
