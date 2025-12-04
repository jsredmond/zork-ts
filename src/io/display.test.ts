/**
 * Display Formatting Tests
 * Tests output formatting functionality
 */

import { describe, it, expect } from 'vitest';
import { Display } from './display.js';
import { RoomImpl, Direction } from '../game/rooms.js';
import { GameObjectImpl } from '../game/objects.js';
import { RoomFlag, ObjectFlag } from '../game/data/flags.js';

describe('Display', () => {
  let display: Display;

  beforeEach(() => {
    display = new Display();
  });

  describe('formatRoom', () => {
    it('should format room with name and description', () => {
      const room = new RoomImpl({
        id: 'TEST-ROOM',
        name: 'Test Room',
        description: 'This is a test room.',
        flags: [RoomFlag.ONBIT],
      });

      const formatted = display.formatRoom(room, true);
      
      expect(formatted).toContain('Test Room');
      expect(formatted).toContain('This is a test room.');
    });

    it('should format unvisited room with full description', () => {
      const room = new RoomImpl({
        id: 'TEST-ROOM',
        name: 'Test Room',
        description: 'This is a test room.',
        visited: false,
        flags: [RoomFlag.ONBIT],
      });

      const formatted = display.formatRoom(room, false);
      
      expect(formatted).toContain('Test Room');
      expect(formatted).toContain('This is a test room.');
    });
  });

  describe('formatObjectList', () => {
    it('should format list of objects', () => {
      const objects = [
        new GameObjectImpl({
          id: 'OBJ1',
          name: 'sword',
          description: 'A sharp sword',
          flags: [ObjectFlag.TAKEBIT],
        }),
        new GameObjectImpl({
          id: 'OBJ2',
          name: 'lamp',
          description: 'A brass lamp',
          flags: [ObjectFlag.TAKEBIT],
        }),
      ];

      const formatted = display.formatObjectList(objects);
      
      expect(formatted).toContain('sword');
      expect(formatted).toContain('lamp');
    });

    it('should return empty string for empty list', () => {
      const formatted = display.formatObjectList([]);
      expect(formatted).toBe('');
    });
  });

  describe('formatInventory', () => {
    it('should format inventory with objects', () => {
      const objects = [
        new GameObjectImpl({
          id: 'OBJ1',
          name: 'sword',
          description: 'A sharp sword',
          flags: [ObjectFlag.TAKEBIT],
        }),
      ];

      const formatted = display.formatInventory(objects);
      
      expect(formatted).toContain('You are carrying:');
      expect(formatted).toContain('sword');
    });

    it('should show empty-handed message for empty inventory', () => {
      const formatted = display.formatInventory([]);
      expect(formatted).toBe('You are empty-handed.');
    });
  });

  describe('formatMessage', () => {
    it('should format message', () => {
      const message = 'Test message';
      const formatted = display.formatMessage(message);
      expect(formatted).toBe(message);
    });
  });

  describe('formatTitle', () => {
    it('should format game title', () => {
      const formatted = display.formatTitle();
      
      expect(formatted).toContain('ZORK I');
      expect(formatted).toContain('Great Underground Empire');
    });
  });

  describe('formatScore', () => {
    it('should format score with rank', () => {
      const formatted = display.formatScore(100, 50, 350);
      
      expect(formatted).toContain('100');
      expect(formatted).toContain('350');
      expect(formatted).toContain('50');
      expect(formatted).toContain('moves');
    });

    it('should show appropriate rank for score', () => {
      const formatted = display.formatScore(0, 1, 350);
      expect(formatted).toContain('Beginner');
    });
  });

  describe('wrapText', () => {
    it('should wrap long text to specified width', () => {
      const longText = 'This is a very long line of text that should be wrapped to multiple lines when it exceeds the specified width';
      const wrapped = display.wrapText(longText, 40);
      
      const lines = wrapped.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      
      // Check that no line exceeds the width
      lines.forEach(line => {
        expect(line.length).toBeLessThanOrEqual(40);
      });
    });

    it('should not wrap short text', () => {
      const shortText = 'Short text';
      const wrapped = display.wrapText(shortText, 80);
      
      expect(wrapped).toBe(shortText);
    });
  });
});
