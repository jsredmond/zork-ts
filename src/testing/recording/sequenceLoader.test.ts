/**
 * Unit tests for CommandSequenceLoader
 * 
 * Tests basic file parsing, comment handling, include resolution,
 * and error reporting for invalid files.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CommandSequenceLoader, SequenceParseError } from './sequenceLoader';

describe('CommandSequenceLoader', () => {
  let loader: CommandSequenceLoader;
  let tempDir: string;

  beforeEach(() => {
    loader = new CommandSequenceLoader();
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seq-loader-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  // Helper to create a test file
  function createTestFile(filename: string, content: string): string {
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  describe('basic file parsing', () => {
    it('should parse a simple command file', () => {
      const filePath = createTestFile('simple.txt', 'look\ninventory\ngo north');
      
      const sequence = loader.load(filePath);
      
      expect(sequence.commands).toEqual(['look', 'inventory', 'go north']);
      expect(sequence.id).toBe('simple');
      expect(sequence.name).toBe('simple');
    });

    it('should handle empty lines', () => {
      const filePath = createTestFile('with-empty.txt', 'look\n\ninventory\n\n\ngo north');
      
      const sequence = loader.load(filePath);
      
      expect(sequence.commands).toEqual(['look', 'inventory', 'go north']);
    });

    it('should trim whitespace from commands', () => {
      const filePath = createTestFile('whitespace.txt', '  look  \n\tinventory\t\n  go north  ');
      
      const sequence = loader.load(filePath);
      
      expect(sequence.commands).toEqual(['look', 'inventory', 'go north']);
    });

    it('should handle Windows line endings (CRLF)', () => {
      const filePath = createTestFile('crlf.txt', 'look\r\ninventory\r\ngo north');
      
      const sequence = loader.load(filePath);
      
      expect(sequence.commands).toEqual(['look', 'inventory', 'go north']);
    });

    it('should handle empty files', () => {
      const filePath = createTestFile('empty.txt', '');
      
      const sequence = loader.load(filePath);
      
      expect(sequence.commands).toEqual([]);
    });

    it('should throw error for non-existent file', () => {
      expect(() => loader.load('/nonexistent/file.txt'))
        .toThrow(SequenceParseError);
    });
  });

  describe('comment handling', () => {
    it('should ignore lines starting with #', () => {
      const filePath = createTestFile('comments.txt', 
        '# This is a comment\nlook\n# Another comment\ninventory');
      
      const sequence = loader.load(filePath);
      
      expect(sequence.commands).toEqual(['look', 'inventory']);
    });

    it('should handle comments with leading whitespace', () => {
      const filePath = createTestFile('indented-comments.txt', 
        '  # Indented comment\nlook\n\t# Tab comment\ninventory');
      
      const sequence = loader.load(filePath);
      
      expect(sequence.commands).toEqual(['look', 'inventory']);
    });

    it('should parse metadata comments (#!key: value)', () => {
      const filePath = createTestFile('metadata.txt', 
        '#!name: Test Sequence\n#!description: A test\nlook\ninventory');
      
      const sequence = loader.load(filePath);
      
      expect(sequence.name).toBe('Test Sequence');
      expect(sequence.description).toBe('A test');
      expect(sequence.commands).toEqual(['look', 'inventory']);
    });

    it('should handle metadata with extra whitespace', () => {
      const filePath = createTestFile('metadata-ws.txt', 
        '#!  name  :  Spaced Name  \nlook');
      
      const sequence = loader.load(filePath);
      
      expect(sequence.name).toBe('Spaced Name');
    });

    it('should store custom metadata', () => {
      const filePath = createTestFile('custom-meta.txt', 
        '#!author: Test Author\n#!version: 1.0\nlook');
      
      const sequence = loader.load(filePath);
      
      expect(sequence.metadata?.author).toBe('Test Author');
      expect(sequence.metadata?.version).toBe('1.0');
    });
  });

  describe('include resolution', () => {
    it('should resolve @include directives', () => {
      createTestFile('common.txt', 'look\ninventory');
      const mainPath = createTestFile('main.txt', '@include common.txt\ngo north');
      
      const sequence = loader.load(mainPath);
      
      expect(sequence.commands).toEqual(['look', 'inventory', 'go north']);
    });

    it('should resolve nested includes', () => {
      createTestFile('base.txt', 'look');
      createTestFile('middle.txt', '@include base.txt\ninventory');
      const mainPath = createTestFile('main.txt', '@include middle.txt\ngo north');
      
      const sequence = loader.load(mainPath);
      
      expect(sequence.commands).toEqual(['look', 'inventory', 'go north']);
    });

    it('should resolve includes with relative paths', () => {
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir);
      fs.writeFileSync(path.join(subDir, 'sub.txt'), 'inventory');
      const mainPath = createTestFile('main.txt', 'look\n@include subdir/sub.txt\ngo north');
      
      const sequence = loader.load(mainPath);
      
      expect(sequence.commands).toEqual(['look', 'inventory', 'go north']);
    });

    it('should detect circular includes', () => {
      createTestFile('a.txt', '@include b.txt');
      createTestFile('b.txt', '@include a.txt');
      
      expect(() => loader.load(path.join(tempDir, 'a.txt')))
        .toThrow(/Circular include/);
    });

    it('should enforce maximum include depth', () => {
      // Create a chain of includes
      for (let i = 0; i < 15; i++) {
        const content = i < 14 ? `@include file${i + 1}.txt` : 'look';
        createTestFile(`file${i}.txt`, content);
      }
      
      expect(() => loader.load(path.join(tempDir, 'file0.txt'), { maxIncludeDepth: 5 }))
        .toThrow(/Maximum include depth/);
    });

    it('should throw error for missing included file', () => {
      const mainPath = createTestFile('main.txt', '@include nonexistent.txt');
      
      expect(() => loader.load(mainPath))
        .toThrow(/Included file not found/);
    });

    it('should throw error for empty @include path', () => {
      const mainPath = createTestFile('main.txt', '@include ');
      
      expect(() => loader.load(mainPath))
        .toThrow(/Missing file path/);
    });
  });

  describe('error reporting', () => {
    it('should include file path in error', () => {
      const filePath = path.join(tempDir, 'nonexistent.txt');
      
      try {
        loader.load(filePath);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(SequenceParseError);
        expect((e as SequenceParseError).filePath).toContain('nonexistent.txt');
      }
    });

    it('should include line number for include errors', () => {
      const mainPath = createTestFile('main.txt', 'look\ninventory\n@include missing.txt');
      
      try {
        loader.load(mainPath);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(SequenceParseError);
        expect((e as SequenceParseError).lineNumber).toBe(3);
      }
    });
  });

  describe('loadDirectory', () => {
    it('should load all .txt files from a directory', () => {
      createTestFile('a.txt', 'look');
      createTestFile('b.txt', 'inventory');
      createTestFile('c.txt', 'go north');
      createTestFile('not-a-sequence.md', 'ignored');
      
      const sequences = loader.loadDirectory(tempDir);
      
      expect(sequences).toHaveLength(3);
      expect(sequences.map(s => s.id).sort()).toEqual(['a', 'b', 'c']);
    });

    it('should throw error for non-existent directory', () => {
      expect(() => loader.loadDirectory('/nonexistent/dir'))
        .toThrow(SequenceParseError);
    });

    it('should throw error when path is a file', () => {
      const filePath = createTestFile('file.txt', 'look');
      
      expect(() => loader.loadDirectory(filePath))
        .toThrow(/not a directory/);
    });
  });

  describe('serialize', () => {
    it('should serialize commands to file format', () => {
      const sequence = {
        id: 'test',
        name: 'test',
        commands: ['look', 'inventory', 'go north']
      };
      
      const content = loader.serialize(sequence);
      
      expect(content).toBe('look\ninventory\ngo north');
    });

    it('should include metadata in serialized output', () => {
      const sequence = {
        id: 'test',
        name: 'Test Sequence',
        description: 'A test sequence',
        commands: ['look']
      };
      
      const content = loader.serialize(sequence);
      
      expect(content).toContain('#!name: Test Sequence');
      expect(content).toContain('#!description: A test sequence');
      expect(content).toContain('look');
    });

    it('should not include name metadata if same as id', () => {
      const sequence = {
        id: 'test',
        name: 'test',
        commands: ['look']
      };
      
      const content = loader.serialize(sequence);
      
      expect(content).not.toContain('#!name');
      expect(content).toBe('look');
    });
  });

  describe('parseString', () => {
    it('should parse commands from a string', () => {
      const content = 'look\ninventory\ngo north';
      
      const sequence = loader.parseString(content, 'test');
      
      expect(sequence.commands).toEqual(['look', 'inventory', 'go north']);
      expect(sequence.id).toBe('test');
    });

    it('should handle comments in string parsing', () => {
      const content = '# Comment\nlook\n# Another\ninventory';
      
      const sequence = loader.parseString(content);
      
      expect(sequence.commands).toEqual(['look', 'inventory']);
    });

    it('should throw error for @include in string parsing', () => {
      const content = 'look\n@include other.txt';
      
      expect(() => loader.parseString(content))
        .toThrow(/@include directive not supported/);
    });
  });
});
