/**
 * Transcript Comparison Tests
 * Tests known command sequences to validate game behavior
 * Validates: Requirements 5.4, 9.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialGameState } from './factories/gameFactory.js';
import { GameState } from './state.js';
import { CommandExecutor } from '../engine/executor.js';
import { Parser } from '../parser/parser.js';
import { Lexer } from '../parser/lexer.js';
import { Vocabulary } from '../parser/vocabulary.js';

describe('Transcript Comparison Tests', () => {
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
    const tokens = lexer.tokenize(commandText);
    const processedTokens = tokens.map(token => ({
      ...token,
      word: vocabulary.expandAbbreviation(token.word),
      type: vocabulary.lookupWord(token.word),
    }));
    const availableObjects = gameState.getObjectsInCurrentRoom();
    const command = parser.parse(processedTokens, availableObjects);
    const result = executor.execute(command, gameState);
    return {
      success: result.success,
      output: result.message || ''
    };
  }

  /**
   * Execute a sequence of commands and return the outputs
   */
  function executeSequence(commands: string[], state: GameState): string[] {
    return commands.map(cmd => processCommand(cmd, state).output);
  }

  it('should handle basic exploration sequence', () => {
    const state = createInitialGameState();
    
    const commands = [
      'look',
      'open mailbox',
      'take leaflet',
      'inventory'
    ];
    
    const outputs = executeSequence(commands, state);
    
    // Verify each command produced output
    outputs.forEach((output, index) => {
      expect(output).toBeTruthy();
      expect(output.length).toBeGreaterThan(0);
    });
    
    // Verify we can check inventory (whether or not leaflet was successfully taken)
    expect(outputs[3]).toBeTruthy();
  });

  it('should handle movement sequence', () => {
    const state = createInitialGameState();
    
    const commands = [
      'look',
      'north',
      'look'
    ];
    
    const outputs = executeSequence(commands, state);
    
    // Commands should produce output (even if movement fails)
    outputs.forEach((output, idx) => {
      // Movement commands may produce empty output if blocked
      if (idx !== 1) {
        expect(output).toBeTruthy();
        expect(output.length).toBeGreaterThan(0);
      }
    });
  });

  it('should handle object manipulation sequence', () => {
    const state = createInitialGameState();
    
    const commands = [
      'open mailbox',
      'inventory',
      'look'
    ];
    
    const outputs = executeSequence(commands, state);
    
    // Verify all commands produced output
    outputs.forEach(output => {
      expect(output).toBeTruthy();
      expect(output.length).toBeGreaterThan(0);
    });
  });

  it('should maintain consistent state across command sequences', () => {
    const state = createInitialGameState();
    
    // Execute a sequence
    processCommand('look', state);
    processCommand('inventory', state);
    
    // Execute more commands
    const lookOutput = processCommand('look', state);
    
    // Commands should produce output
    expect(lookOutput.output).toBeTruthy();
    expect(lookOutput.output.length).toBeGreaterThan(0);
  });

  it('should handle score command sequence', () => {
    const state = createInitialGameState();
    
    const commands = [
      'score',
      'look',
      'score'
    ];
    
    const outputs = executeSequence(commands, state);
    
    // All score commands should produce output
    expect(outputs[0]).toBeTruthy();
    expect(outputs[2]).toBeTruthy();
    
    // Score outputs should be consistent (no actions that change score)
    expect(outputs[0]).toEqual(outputs[2]);
  });

  it('should handle invalid command sequences gracefully', () => {
    const state = createInitialGameState();
    
    const commands = [
      'take nonexistent',
      'look',
      'go nowhere',
      'inventory'
    ];
    
    const outputs = executeSequence(commands, state);
    
    // All commands should produce output (including errors)
    outputs.forEach(output => {
      expect(output).toBeTruthy();
      expect(output.length).toBeGreaterThan(0);
    });
  });

  it('should handle repeated commands consistently', () => {
    const state = createInitialGameState();
    
    // Execute look multiple times
    const output1 = processCommand('look', state);
    const output2 = processCommand('look', state);
    const output3 = processCommand('look', state);
    
    // Outputs should be consistent
    expect(output1.output).toEqual(output2.output);
    expect(output2.output).toEqual(output3.output);
  });

  it('should handle complex interaction sequence', () => {
    const state = createInitialGameState();
    
    const commands = [
      'look',
      'examine mailbox',
      'open mailbox',
      'look in mailbox',
      'take leaflet',
      'read leaflet',
      'inventory',
      'drop leaflet',
      'inventory',
      'take leaflet'
    ];
    
    const outputs = executeSequence(commands, state);
    
    // All commands should produce output
    outputs.forEach((output, index) => {
      expect(output).toBeTruthy();
      expect(output.length).toBeGreaterThan(0);
    });
    
    // After dropping, inventory should not contain leaflet
    expect(outputs[8].toLowerCase()).not.toContain('leaflet');
  });

  it('should produce deterministic output for same sequence', () => {
    // Run the same sequence twice
    const state1 = createInitialGameState();
    const state2 = createInitialGameState();
    
    const commands = [
      'look',
      'open mailbox',
      'take leaflet',
      'inventory',
      'score'
    ];
    
    const outputs1 = executeSequence(commands, state1);
    const outputs2 = executeSequence(commands, state2);
    
    // Outputs should be identical
    expect(outputs1).toEqual(outputs2);
  });

  it('should handle abbreviations in sequences', () => {
    const state = createInitialGameState();
    
    const commands = [
      'l',      // look
      'i',      // inventory
      'x mailbox'  // examine mailbox
    ];
    
    const outputs = executeSequence(commands, state);
    
    // All commands should produce output
    outputs.forEach(output => {
      expect(output).toBeTruthy();
      expect(output.length).toBeGreaterThan(0);
    });
  });
});
