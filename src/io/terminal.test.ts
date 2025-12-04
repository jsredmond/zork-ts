/**
 * Terminal I/O Integration Tests
 * Tests the complete input/output cycle
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Terminal } from './terminal.js';

describe('Terminal', () => {
  let terminal: Terminal;

  beforeEach(() => {
    terminal = new Terminal();
  });

  afterEach(() => {
    if (terminal.isActive()) {
      terminal.close();
    }
  });

  describe('initialization', () => {
    it('should initialize terminal interface', () => {
      terminal.initialize();
      expect(terminal.isActive()).toBe(true);
    });

    it('should not be active before initialization', () => {
      expect(terminal.isActive()).toBe(false);
    });
  });

  describe('output methods', () => {
    beforeEach(() => {
      terminal.initialize();
    });

    it('should write text without newline', () => {
      // This test verifies the method exists and doesn't throw
      expect(() => terminal.write('test')).not.toThrow();
    });

    it('should write line with newline', () => {
      expect(() => terminal.writeLine('test line')).not.toThrow();
    });

    it('should write multiple lines', () => {
      const lines = ['line 1', 'line 2', 'line 3'];
      expect(() => terminal.writeLines(lines)).not.toThrow();
    });

    it('should clear screen', () => {
      expect(() => terminal.clear()).not.toThrow();
    });

    it('should show prompt', () => {
      expect(() => terminal.showPrompt()).not.toThrow();
    });
  });

  describe('lifecycle', () => {
    it('should close terminal', () => {
      terminal.initialize();
      expect(terminal.isActive()).toBe(true);
      
      terminal.close();
      expect(terminal.isActive()).toBe(false);
    });

    it('should handle multiple close calls', () => {
      terminal.initialize();
      terminal.close();
      
      expect(() => terminal.close()).not.toThrow();
      expect(terminal.isActive()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error when reading without initialization', () => {
      expect(() => {
        terminal.readLine(() => {});
      }).toThrow('Terminal not initialized');
    });
  });
});
