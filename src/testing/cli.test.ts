/**
 * Tests for CLI interface
 */

import { describe, it, expect } from 'vitest';
import { parseTestOptions } from './cli';
import { TestOptions } from './types';

describe('CLI', () => {
  describe('parseTestOptions', () => {
    it('should parse room test option', () => {
      const options = parseTestOptions(['--rooms']);
      expect(options.testRooms).toBe(true);
    });

    it('should parse object test option', () => {
      const options = parseTestOptions(['--objects']);
      expect(options.testObjects).toBe(true);
    });

    it('should parse puzzle test option', () => {
      const options = parseTestOptions(['--puzzles']);
      expect(options.testPuzzles).toBe(true);
    });

    it('should parse NPC test option', () => {
      const options = parseTestOptions(['--npcs']);
      expect(options.testNPCs).toBe(true);
    });

    it('should parse edge case test option', () => {
      const options = parseTestOptions(['--edge-cases']);
      expect(options.testEdgeCases).toBe(true);
    });

    it('should parse max tests option', () => {
      const options = parseTestOptions(['--max', '100']);
      expect(options.maxTests).toBe(100);
    });

    it('should parse room filter option', () => {
      const options = parseTestOptions(['--room-filter', 'ROOM1,ROOM2,ROOM3']);
      expect(options.roomFilter).toEqual(['ROOM1', 'ROOM2', 'ROOM3']);
    });

    it('should parse object filter option', () => {
      const options = parseTestOptions(['--object-filter', 'OBJ1,OBJ2']);
      expect(options.objectFilter).toEqual(['OBJ1', 'OBJ2']);
    });

    it('should parse multiple options', () => {
      const options = parseTestOptions([
        '--rooms',
        '--objects',
        '--max',
        '50',
        '--room-filter',
        'ROOM1,ROOM2'
      ]);
      expect(options.testRooms).toBe(true);
      expect(options.testObjects).toBe(true);
      expect(options.maxTests).toBe(50);
      expect(options.roomFilter).toEqual(['ROOM1', 'ROOM2']);
    });

    it('should default to rooms and objects if no options specified', () => {
      const options = parseTestOptions([]);
      expect(options.testRooms).toBe(true);
      expect(options.testObjects).toBe(true);
    });

    it('should not default if specific test types are specified', () => {
      const options = parseTestOptions(['--puzzles']);
      expect(options.testRooms).toBeUndefined();
      expect(options.testObjects).toBeUndefined();
      expect(options.testPuzzles).toBe(true);
    });
  });
});
