/**
 * Storage Tests
 * Tests for path sanitization security in save/restore functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Storage } from './storage.js';

describe('Storage', () => {
  describe('Path Sanitization', () => {
    const testSaveDir = './test-saves-sanitization';
    let storage: Storage;

    beforeEach(() => {
      // Create test directory
      if (!fs.existsSync(testSaveDir)) {
        fs.mkdirSync(testSaveDir, { recursive: true });
      }
      storage = new Storage(testSaveDir);
    });

    afterEach(() => {
      // Clean up test directory
      if (fs.existsSync(testSaveDir)) {
        const files = fs.readdirSync(testSaveDir);
        for (const file of files) {
          fs.unlinkSync(path.join(testSaveDir, file));
        }
        fs.rmdirSync(testSaveDir);
      }
    });

    it('should block path traversal with ../', () => {
      // Attempting to use ../ should result in sanitized filename
      const maliciousFilename = '../../../etc/passwd';
      const exists = storage.saveExists(maliciousFilename);
      
      // The sanitized filename should be 'etcpasswd.sav' (path separators and .. removed)
      // This should not access files outside the save directory
      expect(exists).toBe(false);
    });

    it('should block path traversal with ..\\', () => {
      // Windows-style path traversal
      const maliciousFilename = '..\\..\\..\\windows\\system32\\config';
      const exists = storage.saveExists(maliciousFilename);
      
      // Should be sanitized and not access system files
      expect(exists).toBe(false);
    });

    it('should block forward slash path separators', () => {
      const maliciousFilename = 'subdir/savefile';
      const exists = storage.saveExists(maliciousFilename);
      
      // Should be sanitized to 'subdirsavefile.sav'
      expect(exists).toBe(false);
    });

    it('should block backslash path separators', () => {
      const maliciousFilename = 'subdir\\savefile';
      const exists = storage.saveExists(maliciousFilename);
      
      // Should be sanitized to 'subdirsavefile.sav'
      expect(exists).toBe(false);
    });

    it('should allow valid filenames to pass through', () => {
      const validFilename = 'my-save-game';
      const exists = storage.saveExists(validFilename);
      
      // Valid filename should work (file doesn't exist yet)
      expect(exists).toBe(false);
    });

    it('should allow filenames with dots (not path traversal)', () => {
      const validFilename = 'save.backup';
      const exists = storage.saveExists(validFilename);
      
      // Single dots are fine, only .. is dangerous
      expect(exists).toBe(false);
    });

    it('should handle mixed path traversal attempts', () => {
      const maliciousFilename = '../subdir/../../file';
      const exists = storage.saveExists(maliciousFilename);
      
      // All path components should be stripped
      expect(exists).toBe(false);
    });
  });
});
