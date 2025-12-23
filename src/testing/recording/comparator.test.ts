/**
 * Unit tests for TranscriptComparator
 * 
 * Tests normalization, similarity calculation, severity classification,
 * and parity score calculation.
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import { TranscriptComparator, createComparator } from './comparator';
import { Transcript, TranscriptEntry } from './types';

// Helper to create a transcript entry
function createEntry(
  index: number,
  command: string,
  output: string,
  turnNumber?: number
): TranscriptEntry {
  return {
    index,
    command,
    output,
    turnNumber: turnNumber ?? index,
  };
}

// Helper to create a transcript
function createTranscript(
  id: string,
  source: 'typescript' | 'z-machine',
  entries: TranscriptEntry[]
): Transcript {
  return {
    id,
    source,
    startTime: new Date(),
    endTime: new Date(),
    entries,
    metadata: {},
  };
}

describe('TranscriptComparator', () => {
  describe('stripGameHeader', () => {
    it('should remove ZORK I header line', () => {
      const comparator = new TranscriptComparator();
      
      const input = `ZORK I: The Great Underground Empire
Copyright (c) 1981, 1982, 1983 Infocom, Inc.
West of House`;
      
      const result = comparator.stripGameHeader(input);
      
      expect(result).toBe('West of House');
    });

    it('should remove copyright lines', () => {
      const comparator = new TranscriptComparator();
      
      const input = `Copyright (c) 1981, 1982, 1983 Infocom, Inc.
All rights reserved.
West of House`;
      
      const result = comparator.stripGameHeader(input);
      
      expect(result).toBe('West of House');
    });

    it('should remove Release and Serial number lines', () => {
      const comparator = new TranscriptComparator();
      
      const input = `Release 88 / Serial number 840726
West of House`;
      
      const result = comparator.stripGameHeader(input);
      
      expect(result).toBe('West of House');
    });

    it('should remove The Great Underground Empire line', () => {
      const comparator = new TranscriptComparator();
      
      const input = `The Great Underground Empire
West of House`;
      
      const result = comparator.stripGameHeader(input);
      
      expect(result).toBe('West of House');
    });

    it('should remove Infocom lines', () => {
      const comparator = new TranscriptComparator();
      
      const input = `Infocom interactive fiction
West of House`;
      
      const result = comparator.stripGameHeader(input);
      
      expect(result).toBe('West of House');
    });

    it('should preserve gameplay content after header', () => {
      const comparator = new TranscriptComparator();
      
      const input = `ZORK I: The Great Underground Empire
Copyright (c) 1981, 1982, 1983 Infocom, Inc.
Release 88 / Serial number 840726

West of House
You are standing in an open field west of a white house.
There is a small mailbox here.`;
      
      const result = comparator.stripGameHeader(input);
      
      expect(result).toContain('West of House');
      expect(result).toContain('You are standing in an open field');
      expect(result).toContain('There is a small mailbox here.');
    });

    it('should handle empty input', () => {
      const comparator = new TranscriptComparator();
      
      expect(comparator.stripGameHeader('')).toBe('');
    });

    it('should handle input with no header', () => {
      const comparator = new TranscriptComparator();
      
      const input = `West of House
You are standing in an open field.`;
      
      const result = comparator.stripGameHeader(input);
      
      expect(result).toBe(input);
    });

    it('should stop stripping after first non-header content', () => {
      const comparator = new TranscriptComparator();
      
      const input = `ZORK I: The Great Underground Empire
West of House
Copyright mentioned in game text should not be stripped.`;
      
      const result = comparator.stripGameHeader(input);
      
      expect(result).toContain('West of House');
      expect(result).toContain('Copyright mentioned in game text should not be stripped.');
    });
  });

  describe('stripStatusBar', () => {
    it('should remove status bar lines from output', () => {
      const comparator = new TranscriptComparator();
      
      const input = `West of House                                    Score: 0        Moves: 1
You are standing in an open field west of a white house.`;
      
      const result = comparator.stripStatusBar(input);
      
      expect(result).toBe('You are standing in an open field west of a white house.');
    });

    it('should handle negative scores', () => {
      const comparator = new TranscriptComparator();
      
      const input = `Cellar                                           Score: -10      Moves: 25
It is pitch black.`;
      
      const result = comparator.stripStatusBar(input);
      
      expect(result).toBe('It is pitch black.');
    });

    it('should preserve non-status-bar lines', () => {
      const comparator = new TranscriptComparator();
      
      const input = `You are in a forest.
There is a path to the north.
You can see a lamp here.`;
      
      const result = comparator.stripStatusBar(input);
      
      expect(result).toBe(input);
    });

    it('should handle multiple status bar lines', () => {
      const comparator = new TranscriptComparator();
      
      const input = `West of House                                    Score: 0        Moves: 1
You are standing in an open field.
North of House                                   Score: 0        Moves: 2
You are facing the north side of a white house.`;
      
      const result = comparator.stripStatusBar(input);
      
      expect(result).toBe(`You are standing in an open field.
You are facing the north side of a white house.`);
    });

    it('should handle empty input', () => {
      const comparator = new TranscriptComparator();
      
      expect(comparator.stripStatusBar('')).toBe('');
    });

    it('should not remove lines that mention Score or Moves in normal text', () => {
      const comparator = new TranscriptComparator();
      
      const input = `Your score is 10 points.
You have made 5 moves.`;
      
      const result = comparator.stripStatusBar(input);
      
      expect(result).toBe(input);
    });

    it('should handle status bar with varying whitespace', () => {
      const comparator = new TranscriptComparator();
      
      const input = `Living Room                    Score: 25   Moves: 100
There is a trophy case here.`;
      
      const result = comparator.stripStatusBar(input);
      
      expect(result).toBe('There is a trophy case here.');
    });
  });

  describe('normalizeLineWrapping', () => {
    it('should join lines that were wrapped mid-sentence', () => {
      const comparator = new TranscriptComparator();
      
      // Simulates Z-Machine wrapping at ~80 chars
      const input = `You are standing in an open field west of a white house, with a boarded front
door.`;
      
      const result = comparator.normalizeLineWrapping(input);
      
      expect(result).toBe('You are standing in an open field west of a white house, with a boarded front door.');
    });

    it('should preserve paragraph breaks (empty lines)', () => {
      const comparator = new TranscriptComparator();
      
      const input = `This is the first paragraph.

This is the second paragraph.`;
      
      const result = comparator.normalizeLineWrapping(input);
      
      expect(result).toBe(`This is the first paragraph.

This is the second paragraph.`);
    });

    it('should not join lines that end with sentence-ending punctuation', () => {
      const comparator = new TranscriptComparator();
      
      const input = `You are in a forest.
There is a path to the north.
You can see a lamp here.`;
      
      const result = comparator.normalizeLineWrapping(input);
      
      expect(result).toBe(`You are in a forest.
There is a path to the north.
You can see a lamp here.`);
    });

    it('should handle lines ending with exclamation marks', () => {
      const comparator = new TranscriptComparator();
      
      const input = `You win!
Congratulations!`;
      
      const result = comparator.normalizeLineWrapping(input);
      
      expect(result).toBe(`You win!
Congratulations!`);
    });

    it('should handle lines ending with question marks', () => {
      const comparator = new TranscriptComparator();
      
      const input = `Do you want to continue?
Press any key.`;
      
      const result = comparator.normalizeLineWrapping(input);
      
      expect(result).toBe(`Do you want to continue?
Press any key.`);
    });

    it('should handle lines ending with quotes', () => {
      const comparator = new TranscriptComparator();
      
      const input = `The sign says "Welcome"
You read it carefully.`;
      
      const result = comparator.normalizeLineWrapping(input);
      
      expect(result).toBe(`The sign says "Welcome"
You read it carefully.`);
    });

    it('should handle multiple wrapped lines in sequence', () => {
      const comparator = new TranscriptComparator();
      
      const input = `This is a very long sentence that has been wrapped across
multiple lines because the Z-Machine has a limited
display width.`;
      
      const result = comparator.normalizeLineWrapping(input);
      
      expect(result).toBe('This is a very long sentence that has been wrapped across multiple lines because the Z-Machine has a limited display width.');
    });

    it('should handle empty input', () => {
      const comparator = new TranscriptComparator();
      
      expect(comparator.normalizeLineWrapping('')).toBe('');
    });

    it('should handle single line input', () => {
      const comparator = new TranscriptComparator();
      
      expect(comparator.normalizeLineWrapping('Hello world.')).toBe('Hello world.');
    });

    it('should handle multiple paragraph breaks', () => {
      const comparator = new TranscriptComparator();
      
      const input = `First paragraph.

Second paragraph.

Third paragraph.`;
      
      const result = comparator.normalizeLineWrapping(input);
      
      expect(result).toBe(`First paragraph.

Second paragraph.

Third paragraph.`);
    });

    it('should handle mixed wrapped and non-wrapped content', () => {
      const comparator = new TranscriptComparator();
      
      const input = `West of House
You are standing in an open field west of a white house, with a boarded
front door.
There is a small mailbox here.`;
      
      const result = comparator.normalizeLineWrapping(input);
      
      // "West of House" doesn't end with punctuation, so it joins with next line
      // But the next line ends with "boarded" which doesn't end with punctuation
      // So it continues joining until we hit a period
      expect(result).toBe(`West of House You are standing in an open field west of a white house, with a boarded front door.
There is a small mailbox here.`);
    });

    it('should trim whitespace from lines before processing', () => {
      const comparator = new TranscriptComparator();
      
      const input = `  This is a line with leading spaces  
  and this continues the sentence.  `;
      
      const result = comparator.normalizeLineWrapping(input);
      
      expect(result).toBe('This is a line with leading spaces and this continues the sentence.');
    });
  });

  describe('normalizeOutput', () => {
    it('should normalize line endings', () => {
      const comparator = new TranscriptComparator();
      
      expect(comparator.normalizeOutput('hello\r\nworld')).toBe('hello\nworld');
      expect(comparator.normalizeOutput('hello\rworld')).toBe('hello\nworld');
      expect(comparator.normalizeOutput('hello\nworld')).toBe('hello\nworld');
    });

    it('should collapse multiple spaces', () => {
      const comparator = new TranscriptComparator();
      
      expect(comparator.normalizeOutput('hello   world')).toBe('hello world');
      expect(comparator.normalizeOutput('hello\t\tworld')).toBe('hello world');
    });

    it('should collapse multiple newlines', () => {
      const comparator = new TranscriptComparator();
      
      expect(comparator.normalizeOutput('hello\n\n\nworld')).toBe('hello\nworld');
    });


    it('should trim leading/trailing whitespace from lines', () => {
      const comparator = new TranscriptComparator();
      
      expect(comparator.normalizeOutput('  hello  \n  world  ')).toBe('hello\nworld');
    });

    it('should handle empty strings', () => {
      const comparator = new TranscriptComparator();
      
      expect(comparator.normalizeOutput('')).toBe('');
      expect(comparator.normalizeOutput('   ')).toBe('');
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      const comparator = new TranscriptComparator();
      
      expect(comparator.calculateSimilarity('hello', 'hello')).toBe(1);
      expect(comparator.calculateSimilarity('', '')).toBe(1);
    });

    it('should return 0 when one string is empty', () => {
      const comparator = new TranscriptComparator();
      
      expect(comparator.calculateSimilarity('hello', '')).toBe(0);
      expect(comparator.calculateSimilarity('', 'hello')).toBe(0);
    });

    it('should return high similarity for similar strings', () => {
      const comparator = new TranscriptComparator();
      
      // "hello" vs "hallo" - 1 character difference out of 5
      const similarity = comparator.calculateSimilarity('hello', 'hallo');
      expect(similarity).toBeGreaterThan(0.7);
      expect(similarity).toBeLessThan(1);
    });

    it('should return low similarity for very different strings', () => {
      const comparator = new TranscriptComparator();
      
      const similarity = comparator.calculateSimilarity('hello', 'xyz');
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('classifySeverity', () => {
    it('should classify formatting-only differences', () => {
      const comparator = new TranscriptComparator();
      
      const severity = comparator.classifySeverity(
        'hello  world',
        'hello world',
        0.95,
        comparator.getOptions()
      );
      expect(severity).toBe('formatting');
    });

    it('should classify minor differences for high similarity', () => {
      const comparator = new TranscriptComparator();
      
      const severity = comparator.classifySeverity(
        'You see a lamp here.',
        'You see a lantern here.',
        0.9,
        comparator.getOptions()
      );
      expect(severity).toBe('minor');
    });

    it('should classify major differences for medium similarity', () => {
      const comparator = new TranscriptComparator();
      
      const severity = comparator.classifySeverity(
        'You are in a forest.',
        'You are in a cave.',
        0.75,
        comparator.getOptions()
      );
      expect(severity).toBe('major');
    });

    it('should classify critical differences for low similarity', () => {
      const comparator = new TranscriptComparator();
      
      const severity = comparator.classifySeverity(
        'You win!',
        'Game over.',
        0.3,
        comparator.getOptions()
      );
      expect(severity).toBe('critical');
    });

    it('should classify known variations as minor', () => {
      const comparator = new TranscriptComparator({
        knownVariations: ['combat outcome'],
      });
      
      const severity = comparator.classifySeverity(
        'The troll hits you. combat outcome varies.',
        'The troll misses.',
        0.3,
        comparator.getOptions()
      );
      expect(severity).toBe('minor');
    });
  });


  describe('compare', () => {
    it('should identify exact matches', () => {
      const comparator = new TranscriptComparator();
      
      const transcriptA = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'West of House'),
        createEntry(1, 'inventory', 'You are empty-handed.'),
      ]);
      
      const transcriptB = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', 'West of House'),
        createEntry(1, 'inventory', 'You are empty-handed.'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      expect(report.exactMatches).toBe(2);
      expect(report.differences).toHaveLength(0);
      expect(report.parityScore).toBe(100);
    });

    it('should identify differences', () => {
      const comparator = new TranscriptComparator();
      
      const transcriptA = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'West of House'),
        createEntry(1, 'north', 'North of House'),
      ]);
      
      const transcriptB = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', 'West of House'),
        createEntry(1, 'north', 'You are north of the house.'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      expect(report.exactMatches).toBe(1);
      expect(report.differences.length).toBeGreaterThan(0);
      expect(report.differences[0].command).toBe('north');
    });

    it('should handle transcripts of different lengths', () => {
      const comparator = new TranscriptComparator();
      
      const transcriptA = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'West of House'),
        createEntry(1, 'north', 'North of House'),
        createEntry(2, 'south', 'West of House'),
      ]);
      
      const transcriptB = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', 'West of House'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      expect(report.totalCommands).toBe(3);
      expect(report.differences.length).toBe(2);
      expect(report.differences[0].severity).toBe('critical');
    });

    it('should calculate parity score correctly', () => {
      const comparator = new TranscriptComparator();
      
      const transcriptA = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'Room A'),
        createEntry(1, 'north', 'Room B'),
        createEntry(2, 'south', 'Room A'),
        createEntry(3, 'east', 'Room C'),
      ]);
      
      const transcriptB = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', 'Room A'),
        createEntry(1, 'north', 'Room B'),
        createEntry(2, 'south', 'Different Room'),
        createEntry(3, 'east', 'Room C'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      // 3 exact matches out of 4 commands = 75%
      expect(report.exactMatches).toBe(3);
      expect(report.parityScore).toBe(75);
    });

    it('should respect tolerance threshold for close matches', () => {
      const comparator = new TranscriptComparator({
        toleranceThreshold: 0.8,
      });
      
      // Use strings with very high similarity (only 1 char difference)
      const transcriptA = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'You are in a small room here.'),
      ]);
      
      const transcriptB = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', 'You are in a small room here!'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      // High similarity should count as close match (above 0.8 threshold)
      expect(report.closeMatches + report.exactMatches).toBeGreaterThan(0);
    });

    it('should include command in diff entries', () => {
      const comparator = new TranscriptComparator();
      
      const transcriptA = createTranscript('ts', 'typescript', [
        createEntry(0, 'examine lamp', 'A brass lamp.'),
      ]);
      
      const transcriptB = createTranscript('zm', 'z-machine', [
        createEntry(0, 'examine lamp', 'A brass lantern.'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      expect(report.differences[0].command).toBe('examine lamp');
      expect(report.differences[0].expected).toBe('A brass lamp.');
      expect(report.differences[0].actual).toBe('A brass lantern.');
    });

    it('should summarize differences by severity', () => {
      const comparator = new TranscriptComparator();
      
      const transcriptA = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'Room  A'),  // formatting diff
        createEntry(1, 'north', 'Completely different output'),
      ]);
      
      const transcriptB = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', 'Room A'),
        createEntry(1, 'north', 'Something else entirely'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      expect(report.summary).toBeDefined();
      expect(typeof report.summary.critical).toBe('number');
      expect(typeof report.summary.major).toBe('number');
      expect(typeof report.summary.minor).toBe('number');
      expect(typeof report.summary.formatting).toBe('number');
    });
  });

  describe('createComparator factory', () => {
    it('should create a comparator with default options', () => {
      const comparator = createComparator();
      
      expect(comparator).toBeInstanceOf(TranscriptComparator);
      expect(comparator.getOptions().normalizeWhitespace).toBe(true);
    });

    it('should create a comparator with custom options', () => {
      const comparator = createComparator({
        toleranceThreshold: 0.8,
        ignoreCaseInMessages: true,
      });
      
      expect(comparator.getOptions().toleranceThreshold).toBe(0.8);
      expect(comparator.getOptions().ignoreCaseInMessages).toBe(true);
    });
  });

  describe('compare with normalization options', () => {
    it('should strip status bar when stripStatusBar option is enabled', () => {
      const comparator = new TranscriptComparator({
        stripStatusBar: true,
      });
      
      // Z-Machine output includes status bar, TypeScript doesn't
      const transcriptA = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', `West of House                                    Score: 0        Moves: 1
You are standing in an open field.`),
      ]);
      
      const transcriptB = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'You are standing in an open field.'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      // Should match after stripping status bar
      expect(report.exactMatches).toBe(1);
      expect(report.differences).toHaveLength(0);
      expect(report.parityScore).toBe(100);
    });

    it('should not strip status bar when stripStatusBar option is disabled', () => {
      const comparator = new TranscriptComparator({
        stripStatusBar: false,
      });
      
      const transcriptA = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', `West of House                                    Score: 0        Moves: 1
You are standing in an open field.`),
      ]);
      
      const transcriptB = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'You are standing in an open field.'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      // Should NOT match because status bar is not stripped
      expect(report.exactMatches).toBe(0);
      expect(report.differences.length).toBeGreaterThan(0);
    });

    it('should normalize line wrapping when normalizeLineWrapping option is enabled', () => {
      const comparator = new TranscriptComparator({
        normalizeLineWrapping: true,
      });
      
      // Z-Machine wraps at ~80 chars, TypeScript doesn't
      const transcriptA = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', `You are standing in an open field west of a white house, with a boarded
front door.`),
      ]);
      
      const transcriptB = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'You are standing in an open field west of a white house, with a boarded front door.'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      // Should match after normalizing line wrapping
      expect(report.exactMatches).toBe(1);
      expect(report.differences).toHaveLength(0);
      expect(report.parityScore).toBe(100);
    });

    it('should not normalize line wrapping when normalizeLineWrapping option is disabled', () => {
      const comparator = new TranscriptComparator({
        normalizeLineWrapping: false,
        normalizeWhitespace: false, // Also disable whitespace normalization
      });
      
      const transcriptA = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', `You are standing in an open field west of a white house, with a boarded
front door.`),
      ]);
      
      const transcriptB = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'You are standing in an open field west of a white house, with a boarded front door.'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      // Should NOT match because line wrapping is not normalized
      expect(report.exactMatches).toBe(0);
      expect(report.differences.length).toBeGreaterThan(0);
    });

    it('should apply both stripStatusBar and normalizeLineWrapping together', () => {
      const comparator = new TranscriptComparator({
        stripStatusBar: true,
        normalizeLineWrapping: true,
      });
      
      // Z-Machine output with status bar AND line wrapping
      const transcriptA = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', `West of House                                    Score: 0        Moves: 1
You are standing in an open field west of a white house, with a boarded
front door.`),
      ]);
      
      // TypeScript output without status bar and without line wrapping
      const transcriptB = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'You are standing in an open field west of a white house, with a boarded front door.'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      // Should match after both normalizations
      expect(report.exactMatches).toBe(1);
      expect(report.differences).toHaveLength(0);
      expect(report.parityScore).toBe(100);
    });

    it('should have stripStatusBar and normalizeLineWrapping disabled by default', () => {
      const comparator = new TranscriptComparator();
      const options = comparator.getOptions();
      
      expect(options.stripStatusBar).toBe(false);
      expect(options.normalizeLineWrapping).toBe(false);
      expect(options.stripGameHeader).toBe(false);
    });

    it('should strip game header when stripGameHeader option is enabled', () => {
      const comparator = new TranscriptComparator({
        stripGameHeader: true,
      });
      
      // Z-Machine output includes game header, TypeScript doesn't
      const transcriptA = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', `ZORK I: The Great Underground Empire
Copyright (c) 1981, 1982, 1983 Infocom, Inc.
West of House`),
      ]);
      
      const transcriptB = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'West of House'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      // Should match after stripping game header
      expect(report.exactMatches).toBe(1);
      expect(report.differences).toHaveLength(0);
      expect(report.parityScore).toBe(100);
    });

    it('should not strip game header when stripGameHeader option is disabled', () => {
      const comparator = new TranscriptComparator({
        stripGameHeader: false,
      });
      
      const transcriptA = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', `ZORK I: The Great Underground Empire
West of House`),
      ]);
      
      const transcriptB = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'West of House'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      // Should NOT match because header is not stripped
      expect(report.exactMatches).toBe(0);
      expect(report.differences.length).toBeGreaterThan(0);
    });

    it('should apply all normalization options together', () => {
      const comparator = new TranscriptComparator({
        stripStatusBar: true,
        normalizeLineWrapping: true,
        stripGameHeader: true,
      });
      
      // Z-Machine output with header, status bar, AND line wrapping
      const transcriptA = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', `ZORK I: The Great Underground Empire
Copyright (c) 1981, 1982, 1983 Infocom, Inc.
West of House                                    Score: 0        Moves: 1
You are standing in an open field west of a white house, with a boarded
front door.`),
      ]);
      
      // TypeScript output without header, status bar, and without line wrapping
      const transcriptB = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'You are standing in an open field west of a white house, with a boarded front door.'),
      ]);
      
      const report = comparator.compare(transcriptA, transcriptB);
      
      // Should match after all normalizations
      expect(report.exactMatches).toBe(1);
      expect(report.differences).toHaveLength(0);
      expect(report.parityScore).toBe(100);
    });
  });
});

describe('Enhanced Normalization Property Tests', () => {
  describe('Property 1: Song Bird Message Filtering', () => {
    it('should filter song bird messages from any transcript', () => {
      const comparator = new TranscriptComparator({
        filterSongBirdMessages: true,
      });
      
      // Property: For any transcript containing song bird messages,
      // filtering should remove them completely
      const testCases = [
        {
          input: 'You hear in the distance the chirping of a song bird.\nWest of House',
          expectedContent: 'West of House'
        },
        {
          input: 'West of House\nYou hear in the distance the chirping of a song bird.',
          expectedContent: 'West of House'
        },
        {
          input: 'You hear in the distance the chirping of a song bird.\nYou hear in the distance the chirping of a song bird.\nWest of House',
          expectedContent: 'West of House'
        },
        {
          input: 'Normal text\nYou hear in the distance the chirping of a song bird.\nMore normal text',
          expectedContent: 'Normal text'
        },
      ];
      
      for (const testCase of testCases) {
        const filtered = comparator.filterSongBirdMessages(testCase.input);
        
        // Property: Song bird messages should be completely removed
        expect(filtered).not.toContain('You hear in the distance the chirping of a song bird.');
        
        // Property: Other content should be preserved
        expect(filtered).toContain(testCase.expectedContent);
      }
    });

    it('should achieve higher parity when song bird messages are filtered', () => {
      // Property: Filtering song bird messages should improve parity scores
      // when one transcript has them and the other doesn't
      
      const transcriptWithSongBird = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', 'West of House\nYou hear in the distance the chirping of a song bird.'),
      ]);
      
      const transcriptWithoutSongBird = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'West of House'),
      ]);
      
      // Without filtering
      const comparatorNoFilter = new TranscriptComparator({
        filterSongBirdMessages: false,
      });
      const reportNoFilter = comparatorNoFilter.compare(transcriptWithSongBird, transcriptWithoutSongBird);
      
      // With filtering
      const comparatorWithFilter = new TranscriptComparator({
        filterSongBirdMessages: true,
      });
      const reportWithFilter = comparatorWithFilter.compare(transcriptWithSongBird, transcriptWithoutSongBird);
      
      // Property: Filtering should improve parity score
      expect(reportWithFilter.parityScore).toBeGreaterThan(reportNoFilter.parityScore);
      
      // **Validates: Requirements 2.1**
    });
  });

  describe('Property 2: Enhanced Normalization Effectiveness', () => {
    it('should improve parity scores when enhanced normalization is applied', () => {
      // Property: For any pair of transcripts with acceptable differences,
      // enhanced normalization should improve parity scores
      
      const transcriptA = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', `ZORK I: The Great Underground Empire
West of House                                    Score: 0        Moves: 1
You hear in the distance the chirping of a song bird.
You are standing in an open field.
Using normal formatting.`),
        createEntry(1, 'inventory', `You can't see any items here!`),
      ]);
      
      const transcriptB = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'You are standing in an open field.'),
        createEntry(1, 'inventory', 'OBJECT_NOT_VISIBLE'),
      ]);
      
      // Without enhanced normalization
      const basicComparator = new TranscriptComparator({
        stripStatusBar: false,
        stripGameHeader: false,
        filterSongBirdMessages: false,
        filterLoadingMessages: false,
        normalizeErrorMessages: false,
      });
      const basicReport = basicComparator.compare(transcriptA, transcriptB);
      
      // With enhanced normalization
      const enhancedComparator = new TranscriptComparator({
        stripStatusBar: true,
        stripGameHeader: true,
        filterSongBirdMessages: true,
        filterLoadingMessages: true,
        normalizeErrorMessages: true,
      });
      const enhancedReport = enhancedComparator.compare(transcriptA, transcriptB);
      
      // Property: Enhanced normalization should improve parity
      expect(enhancedReport.parityScore).toBeGreaterThan(basicReport.parityScore);
      
      // Property: Enhanced normalization should reduce differences
      expect(enhancedReport.differences.length).toBeLessThanOrEqual(basicReport.differences.length);
      
      // **Validates: Requirements 2.4**
    });

    it('should preserve core content differences while filtering acceptable ones', () => {
      // Property: Enhanced normalization should filter acceptable differences
      // but preserve actual content differences
      
      const transcriptA = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', 'You hear in the distance the chirping of a song bird.\nYou are in a forest.'),
        createEntry(1, 'north', 'You are in a different room entirely.'), // Real content difference
      ]);
      
      const transcriptB = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'You are in a forest.'),
        createEntry(1, 'north', 'You are in a cave.'), // Real content difference
      ]);
      
      const enhancedComparator = new TranscriptComparator({
        filterSongBirdMessages: true,
        filterAtmosphericMessages: true,
      });
      const report = enhancedComparator.compare(transcriptA, transcriptB);
      
      // Property: Should have exact match for first command (after filtering)
      expect(report.exactMatches).toBeGreaterThanOrEqual(1);
      
      // Property: Should still detect real content difference in second command
      const realDifference = report.differences.find(d => d.command === 'north');
      expect(realDifference).toBeDefined();
      expect(realDifference?.severity).not.toBe('formatting');
      
      // **Validates: Requirements 2.4**
    });

    it('should handle all enhanced normalization options together', () => {
      // Property: All enhanced normalization options should work together
      // without interfering with each other
      
      const complexTranscript = createTranscript('zm', 'z-machine', [
        createEntry(0, 'look', `ZORK I: The Great Underground Empire
Loading zork1.z3.
West of House                                    Score: 0        Moves: 1
You hear in the distance the chirping of a song bird.
You are standing in an open field.
Using normal formatting.`),
        createEntry(1, 'take lamp', `You can't see any lamp here!`),
        createEntry(2, 'north', `You can't go that way.`),
      ]);
      
      const cleanTranscript = createTranscript('ts', 'typescript', [
        createEntry(0, 'look', 'You are standing in an open field.'),
        createEntry(1, 'take lamp', 'OBJECT_NOT_VISIBLE'),
        createEntry(2, 'north', 'INVALID_DIRECTION'),
      ]);
      
      const fullyEnhancedComparator = new TranscriptComparator({
        stripStatusBar: true,
        stripGameHeader: true,
        filterSongBirdMessages: true,
        filterAtmosphericMessages: true,
        filterLoadingMessages: true,
        normalizeErrorMessages: true,
        strictContentOnly: true,
      });
      
      const report = fullyEnhancedComparator.compare(complexTranscript, cleanTranscript);
      
      // Property: Should achieve high parity with all enhancements
      expect(report.parityScore).toBeGreaterThan(90);
      
      // Property: Should have mostly exact matches
      expect(report.exactMatches).toBeGreaterThanOrEqual(2);
      
      // **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    });
  });

  describe('Enhanced Normalization Methods', () => {
    it('should filter atmospheric messages correctly', () => {
      const comparator = new TranscriptComparator();
      
      const testCases = [
        'You hear a distant sound.\nWest of House',
        'You can hear footsteps.\nNorth of House',
        'The wind howls.\nForest',
        'A gentle breeze blows.\nClearing',
      ];
      
      for (const testCase of testCases) {
        const filtered = comparator.filterAtmosphericMessages(testCase);
        
        // Should remove atmospheric messages
        expect(filtered).not.toMatch(/You hear.*?\./);
        expect(filtered).not.toMatch(/You can hear.*?\./);
        expect(filtered).not.toMatch(/The wind.*?\./);
        expect(filtered).not.toMatch(/A gentle breeze.*?\./);
        
        // Should preserve location names
        expect(filtered).toMatch(/(West of House|North of House|Forest|Clearing)/);
      }
    });

    it('should normalize error messages correctly', () => {
      const comparator = new TranscriptComparator();
      
      const errorVariations = [
        "You can't see any lamp here!",
        "I don't see any lamp here.",
        "There is no lamp here.",
        "You can't go that way.",
        "You can't go north.",
        "I don't understand that.",
        'I don\'t know the word "xyzzy".',
      ];
      
      for (const error of errorVariations) {
        const normalized = comparator.normalizeErrorMessages(error);
        
        // Should normalize to standard tokens
        expect(normalized).toMatch(/(OBJECT_NOT_VISIBLE|INVALID_DIRECTION|PARSE_ERROR)/);
      }
    });

    it('should filter loading messages correctly', () => {
      const comparator = new TranscriptComparator();
      
      const loadingMessages = [
        'Using normal formatting.\nWest of House',
        'Loading zork1.z3.\nGame starts',
        'Restore failed.\nContinuing',
        'Save failed.\nTry again',
      ];
      
      for (const message of loadingMessages) {
        const filtered = comparator.filterLoadingMessages(message);
        
        // Should remove loading messages
        expect(filtered).not.toContain('Using normal formatting.');
        expect(filtered).not.toContain('Loading zork1.z3.');
        expect(filtered).not.toContain('Restore failed.');
        expect(filtered).not.toContain('Save failed.');
        
        // Should preserve game content
        expect(filtered).toMatch(/(West of House|Game starts|Continuing|Try again)/);
      }
    });

    it('should apply strict content filtering comprehensively', () => {
      const comparator = new TranscriptComparator();
      
      const noisyContent = `Loading zork1.z3.
You hear in the distance the chirping of a song bird.
West of House
You can't see any lamp here!
[System message]
Time: 1.23s`;
      
      const filtered = comparator.applyStrictContentFilter(noisyContent);
      
      // Should remove all noise
      expect(filtered).not.toContain('Loading');
      expect(filtered).not.toContain('You hear');
      expect(filtered).not.toContain('[System message]');
      expect(filtered).not.toContain('Time:');
      
      // Should preserve core content
      expect(filtered).toContain('West of House');
      expect(filtered).toContain('OBJECT_NOT_VISIBLE');
    });
  });
});
