/**
 * StatusBarNormalizer Property Tests
 * 
 * Property 3: Status Bar Formatting Consistency
 * Tests that for any game state, status bar formatting matches Z-Machine exactly
 * 
 * Property 6: Status Bar Normalization Round-Trip
 * Tests that normalizing output removes status bars while preserving content,
 * and that normalization is idempotent
 * 
 * Validates: Requirements 4.1, 4.2, 4.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { StatusBarNormalizer } from './StatusBarNormalizer.js';

describe('StatusBarNormalizer', () => {
  describe('Property 6: Status Bar Normalization Round-Trip', () => {
    /**
     * Property 6a: Idempotent Normalization
     * For any output, normalizing twice should produce the same result as normalizing once
     * 
     * **Feature: achieve-99-percent-parity, Property 6: Status Bar Normalization Round-Trip**
     * **Validates: Requirements 4.1, 4.2, 4.3**
     */
    it('should be idempotent - normalizing twice equals normalizing once', () => {
      const normalizer = new StatusBarNormalizer();

      fc.assert(
        fc.property(
          // Generate random output that may or may not contain status bars
          fc.oneof(
            // Clean output without status bars
            fc.string({ minLength: 1, maxLength: 200 }).filter(s => 
              !s.includes('Score:') && !s.includes('Moves:')
            ),
            // Output with status bar contamination
            fc.tuple(
              fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('\n') && s.trim().length > 0),
              fc.integer({ min: -99, max: 999 }),
              fc.integer({ min: 0, max: 9999 }),
              fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('Score:') && !s.includes('Moves:'))
            ).map(([room, score, moves, content]) => {
              const statusBar = normalizer.formatStatusBarExactly(room.trim(), score, moves);
              return `${statusBar}\n\n${content}`;
            })
          ),
          (output) => {
            const idempotenceResult = normalizer.verifyIdempotence(output);
            
            expect(idempotenceResult.isIdempotent).toBe(true);
            expect(idempotenceResult.firstPass).toBe(idempotenceResult.secondPass);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6b: Content Preservation
     * For any output with status bar contamination, normalization should preserve all non-status-bar content
     * 
     * **Feature: achieve-99-percent-parity, Property 6: Status Bar Normalization Round-Trip**
     * **Validates: Requirements 4.1, 4.2, 4.3**
     */
    it('should preserve all non-status-bar content after normalization', () => {
      const normalizer = new StatusBarNormalizer();

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('\n') && s.trim().length > 0),
          fc.integer({ min: -99, max: 999 }),
          fc.integer({ min: 0, max: 9999 }),
          fc.array(
            fc.string({ minLength: 5, maxLength: 50 }).filter(s => 
              !s.includes('Score:') && !s.includes('Moves:') && s.trim().length > 0
            ),
            { minLength: 1, maxLength: 5 }
          ),
          (room, score, moves, contentLines) => {
            const statusBar = normalizer.formatStatusBarExactly(room.trim(), score, moves);
            const content = contentLines.join('\n');
            const contaminatedOutput = `${statusBar}\n\n${content}`;
            
            const result = normalizer.normalizeStatusBarOutput(contaminatedOutput);
            const preservation = normalizer.validateContentPreservation(contaminatedOutput, result.normalizedOutput);
            
            expect(preservation.preserved).toBe(true);
            expect(preservation.missingContent).toHaveLength(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6c: Complete Status Bar Removal
     * For any output containing status bars, normalization should remove ALL status bar lines
     * 
     * **Feature: achieve-99-percent-parity, Property 6: Status Bar Normalization Round-Trip**
     * **Validates: Requirements 4.1, 4.2, 4.3**
     */
    it('should remove all status bar lines from any output', () => {
      const normalizer = new StatusBarNormalizer();

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              room: fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('\n') && s.trim().length > 0),
              score: fc.integer({ min: -99, max: 999 }),
              moves: fc.integer({ min: 1, max: 9999 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.string({ minLength: 5, maxLength: 50 }).filter(s => !s.includes('Score:') && !s.includes('Moves:')),
          (statusBars, content) => {
            // Create output with multiple status bars interspersed with content
            const lines: string[] = [];
            for (const sb of statusBars) {
              lines.push(normalizer.formatStatusBarExactly(sb.room.trim(), sb.score, sb.moves));
              lines.push(content);
            }
            const multiStatusOutput = lines.join('\n');
            
            const result = normalizer.normalizeStatusBarOutput(multiStatusOutput);
            
            // Verify no status bars remain
            expect(normalizer.hasStatusBarContamination(result.normalizedOutput)).toBe(false);
            expect(result.normalizedOutput).not.toMatch(/Score:\s*-?\d+/i);
            expect(result.normalizedOutput).not.toMatch(/Moves:\s*\d+/i);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6d: Edge Case Handling - Negative Scores
     * For any status bar with negative score, detection and removal should work correctly
     * 
     * **Feature: achieve-99-percent-parity, Property 6: Status Bar Normalization Round-Trip**
     * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
     */
    it('should handle negative scores correctly', () => {
      const normalizer = new StatusBarNormalizer();

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('\n') && s.trim().length > 0),
          fc.integer({ min: -999, max: -1 }), // Negative scores only
          fc.integer({ min: 1, max: 9999 }),
          fc.string({ minLength: 5, maxLength: 50 }).filter(s => !s.includes('Score:') && !s.includes('Moves:')),
          (room, negativeScore, moves, content) => {
            const statusBar = normalizer.formatStatusBarExactly(room.trim(), negativeScore, moves);
            const contaminatedOutput = `${statusBar}\n\n${content}`;
            
            // Detection should work
            const detection = normalizer.detectStatusBar(statusBar);
            expect(detection.hasStatusBar).toBe(true);
            expect(detection.score).toBe(negativeScore);
            
            // Normalization should remove it
            const result = normalizer.normalizeStatusBarOutput(contaminatedOutput);
            expect(result.statusBarRemoved).toBe(true);
            expect(result.normalizedOutput).not.toContain('Score:');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6e: Edge Case Handling - Long Room Names
     * For any room name exceeding 49 characters, it should be truncated correctly
     * 
     * **Feature: achieve-99-percent-parity, Property 6: Status Bar Normalization Round-Trip**
     * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
     */
    it('should handle long room names by truncating to 49 characters', () => {
      const normalizer = new StatusBarNormalizer();

      fc.assert(
        fc.property(
          fc.string({ minLength: 50, maxLength: 100 }).filter(s => !s.includes('\n') && s.trim().length > 0),
          fc.integer({ min: 0, max: 999 }),
          fc.integer({ min: 1, max: 9999 }),
          (longRoom, score, moves) => {
            const statusBar = normalizer.formatStatusBarExactly(longRoom.trim(), score, moves);
            
            // Room part should be exactly 49 characters
            const roomPart = statusBar.split('Score:')[0];
            expect(roomPart.length).toBe(49);
            
            // Detection should still work
            const detection = normalizer.detectStatusBar(statusBar);
            expect(detection.hasStatusBar).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  describe('Property 3: Status Bar Formatting Consistency', () => {
    /**
     * Property: Status bar detection is accurate
     * For any string containing a valid status bar pattern, detection should succeed
     */
    it('should accurately detect status bars in any valid format', () => {
      const normalizer = new StatusBarNormalizer();

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 40 }).filter(s => !s.includes('\n') && s.trim().length > 0),
          fc.integer({ min: -99, max: 999 }),
          fc.integer({ min: 0, max: 9999 }),
          (roomName, score, moves) => {
            // Create a valid status bar
            const statusBar = normalizer.formatStatusBarExactly(roomName.trim(), score, moves);
            
            // Detection should find it
            const detection = normalizer.detectStatusBar(statusBar);
            expect(detection.hasStatusBar).toBe(true);
            expect(detection.score).toBe(score);
            expect(detection.moves).toBe(moves);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Status bar removal is complete
     * For any output with status bar contamination, normalization removes all status bars
     */
    it('should completely remove status bar contamination from any output', () => {
      const normalizer = new StatusBarNormalizer();

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('\n') && s.trim().length > 0),
          fc.integer({ min: 0, max: 350 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('Score:') && !s.includes('Moves:')),
          (roomName, score, moves, content) => {
            // Create contaminated output
            const statusBar = normalizer.formatStatusBarExactly(roomName.trim(), score, moves);
            const contaminatedOutput = `${statusBar}\n\n${content}`;
            
            // Normalize should remove status bar
            const result = normalizer.normalizeStatusBarOutput(contaminatedOutput);
            
            expect(result.statusBarRemoved).toBe(true);
            expect(result.normalizedOutput).not.toContain('Score:');
            expect(result.normalizedOutput).not.toContain('Moves:');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Clean output remains unchanged
     * For any output without status bars, normalization should not alter content
     */
    it('should not alter output that has no status bar contamination', () => {
      const normalizer = new StatusBarNormalizer();

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => 
            !s.includes('Score:') && !s.includes('Moves:')
          ),
          (cleanOutput) => {
            const result = normalizer.normalizeStatusBarOutput(cleanOutput);
            
            expect(result.statusBarRemoved).toBe(false);
            expect(result.detectedStatusBars).toHaveLength(0);
            // Content should be preserved (may have leading newlines trimmed)
            expect(result.normalizedOutput.trim()).toBe(cleanOutput.trim());
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Normalized outputs match when only status bar differs
     * If TS has status bar and ZM doesn't, they should match after normalization
     */
    it('should make outputs match when only status bar differs', () => {
      const normalizer = new StatusBarNormalizer();

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('\n') && s.trim().length > 0),
          fc.integer({ min: 0, max: 350 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.string({ minLength: 5, maxLength: 100 }).filter(s => 
            !s.includes('Score:') && !s.includes('Moves:') && s.trim().length > 0
          ),
          (roomName, score, moves, gameContent) => {
            const statusBar = normalizer.formatStatusBarExactly(roomName.trim(), score, moves);
            
            // TS output with status bar
            const tsOutput = `${statusBar}\n\n${gameContent}`;
            // ZM output without status bar
            const zmOutput = gameContent;
            
            // After normalization, they should match
            const comparison = normalizer.getComparisonDetails(tsOutput, zmOutput);
            
            expect(comparison.tsStatusBarsRemoved).toBe(1);
            expect(comparison.zmStatusBarsRemoved).toBe(0);
            expect(comparison.match).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Status bar formatting matches Z-Machine exactly
     * Generated status bars should follow Z-Machine format precisely
     */
    it('should format status bars to match Z-Machine format exactly', () => {
      const normalizer = new StatusBarNormalizer();

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 40 }).filter(s => !s.includes('\n') && s.trim().length > 0),
          fc.integer({ min: 0, max: 350 }),
          fc.integer({ min: 1, max: 9999 }),
          (roomName, score, moves) => {
            const statusBar = normalizer.formatStatusBarExactly(roomName.trim(), score, moves);
            
            // Should contain Score: and Moves: with proper formatting
            expect(statusBar).toContain(`Score: ${score}`);
            expect(statusBar).toContain(`Moves: ${moves}`);
            
            // Should have 8 spaces between Score section and Moves section
            expect(statusBar).toMatch(/Score: -?\d+\s{8}Moves: \d+/);
            
            // Room name should be padded to 49 characters
            const roomPart = statusBar.split('Score:')[0];
            expect(roomPart.length).toBe(49);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Multiple status bars are all removed
     * If output has multiple status bars, all should be removed
     */
    it('should remove all status bars when multiple are present', () => {
      const normalizer = new StatusBarNormalizer();

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              room: fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('\n') && s.trim().length > 0),
              score: fc.integer({ min: 0, max: 350 }),
              moves: fc.integer({ min: 1, max: 100 })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          fc.string({ minLength: 5, maxLength: 50 }).filter(s => !s.includes('Score:') && !s.includes('Moves:')),
          (statusBars, content) => {
            // Create output with multiple status bars
            const lines: string[] = [];
            for (const sb of statusBars) {
              lines.push(normalizer.formatStatusBarExactly(sb.room.trim(), sb.score, sb.moves));
              lines.push(content);
            }
            const multiStatusOutput = lines.join('\n');
            
            const result = normalizer.normalizeStatusBarOutput(multiStatusOutput);
            
            expect(result.statusBarRemoved).toBe(true);
            expect(result.detectedStatusBars.length).toBe(statusBars.length);
            expect(result.normalizedOutput).not.toContain('Score:');
            expect(result.normalizedOutput).not.toContain('Moves:');
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should detect standard Z-Machine status bar format', () => {
      const normalizer = new StatusBarNormalizer();
      
      const statusBar = 'West of House                                    Score: 0        Moves: 1';
      const detection = normalizer.detectStatusBar(statusBar);
      
      expect(detection.hasStatusBar).toBe(true);
      expect(detection.roomName).toBe('West of House');
      expect(detection.score).toBe(0);
      expect(detection.moves).toBe(1);
    });

    it('should detect status bar with negative score', () => {
      const normalizer = new StatusBarNormalizer();
      
      const statusBar = 'Cellar                                           Score: -10      Moves: 25';
      const detection = normalizer.detectStatusBar(statusBar);
      
      expect(detection.hasStatusBar).toBe(true);
      expect(detection.score).toBe(-10);
      expect(detection.moves).toBe(25);
    });

    it('should not detect regular game text as status bar', () => {
      const normalizer = new StatusBarNormalizer();
      
      const gameText = 'You are standing in an open field west of a white house.';
      const detection = normalizer.detectStatusBar(gameText);
      
      expect(detection.hasStatusBar).toBe(false);
    });

    it('should normalize contaminated output correctly', () => {
      const normalizer = new StatusBarNormalizer();
      
      const contaminated = `North of House                                   Score: 0        Moves: 1

That sentence isn't one I recognize.`;
      
      const result = normalizer.normalizeStatusBarOutput(contaminated);
      
      expect(result.statusBarRemoved).toBe(true);
      expect(result.normalizedOutput).toBe("That sentence isn't one I recognize.");
    });

    it('should use static normalize method correctly', () => {
      const contaminated = `Forest                                           Score: 10       Moves: 5

You are in a forest.`;
      
      const normalized = StatusBarNormalizer.normalize(contaminated);
      
      expect(normalized).toBe('You are in a forest.');
    });

    it('should validate status bar format correctly', () => {
      const normalizer = new StatusBarNormalizer();
      
      const validStatusBar = normalizer.formatStatusBarExactly('West of House', 0, 1);
      const validation = normalizer.validateStatusBarFormat(validStatusBar);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should report invalid status bar format', () => {
      const normalizer = new StatusBarNormalizer();
      
      const invalidStatusBar = 'This is not a status bar';
      const validation = normalizer.validateStatusBarFormat(invalidStatusBar);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it('should verify idempotence correctly', () => {
      const normalizer = new StatusBarNormalizer();
      
      const contaminated = `West of House                                    Score: 0        Moves: 1

You are standing in an open field.`;
      
      const idempotenceResult = normalizer.verifyIdempotence(contaminated);
      
      expect(idempotenceResult.isIdempotent).toBe(true);
      expect(idempotenceResult.firstPass).toBe(idempotenceResult.secondPass);
    });

    it('should validate content preservation correctly', () => {
      const normalizer = new StatusBarNormalizer();
      
      const original = `Forest                                           Score: 10       Moves: 5

You are in a forest.
There is a path to the north.`;
      
      const result = normalizer.normalizeStatusBarOutput(original);
      const preservation = normalizer.validateContentPreservation(original, result.normalizedOutput);
      
      expect(preservation.preserved).toBe(true);
      expect(preservation.missingContent).toHaveLength(0);
      expect(preservation.extraContent).toHaveLength(0);
    });

    it('should handle malformed status bar with tabs', () => {
      const normalizer = new StatusBarNormalizer();
      
      const malformedStatusBar = 'West of House\tScore: 0\tMoves: 1';
      const detection = normalizer.detectStatusBar(malformedStatusBar);
      
      expect(detection.hasStatusBar).toBe(true);
    });

    it('should handle status bar with very large negative score', () => {
      const normalizer = new StatusBarNormalizer();
      
      // Score should be clamped to -999
      const statusBar = normalizer.formatStatusBarExactly('Cellar', -5000, 25);
      const detection = normalizer.detectStatusBar(statusBar);
      
      expect(detection.hasStatusBar).toBe(true);
      expect(detection.score).toBe(-999); // Clamped
    });

    it('should handle status bar with very long room name', () => {
      const normalizer = new StatusBarNormalizer();
      
      const longRoomName = 'This is a very long room name that exceeds the maximum allowed length';
      const statusBar = normalizer.formatStatusBarExactly(longRoomName, 0, 1);
      
      // Room part should be exactly 49 characters
      const roomPart = statusBar.split('Score:')[0];
      expect(roomPart.length).toBe(49);
      
      const detection = normalizer.detectStatusBar(statusBar);
      expect(detection.hasStatusBar).toBe(true);
    });

    it('should use normalizeIdempotent for guaranteed stable output', () => {
      const normalizer = new StatusBarNormalizer();
      
      const contaminated = `West of House                                    Score: 0        Moves: 1

You are standing in an open field.`;
      
      const result = normalizer.normalizeIdempotent(contaminated);
      
      expect(result.statusBarRemoved).toBe(true);
      expect(result.normalizedOutput).toBe('You are standing in an open field.');
      
      // Verify the result is stable
      const secondPass = normalizer.normalizeStatusBarOutput(result.normalizedOutput);
      expect(secondPass.normalizedOutput).toBe(result.normalizedOutput);
    });
  });
});
