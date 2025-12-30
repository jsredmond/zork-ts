/**
 * Property-Based Tests for AtmosphericMessageAligner
 * 
 * These tests verify universal properties that should hold for all valid inputs.
 * 
 * Feature: achieve-99-percent-parity, Property 7: Deterministic Random Events (atmospheric portion)
 * 
 * **Validates: Requirements 6.1, 6.3, 6.4**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  // Probability constants
  FOREST_MESSAGE_PROBABILITY,
  UNDERGROUND_MESSAGE_PROBABILITY,
  THIEF_ANNOUNCEMENT_PROBABILITY,
  // Message definitions
  FOREST_BIRD_MESSAGE,
  ATMOSPHERIC_MESSAGES,
  // Location detection
  FOREST_ROOMS,
  SURFACE_ROOMS,
  isForestRoom,
  isUndergroundRoom,
  // Deterministic generation
  setAtmosphericSeed,
  getAtmosphericSeed,
  getAtmosphericRandom,
  getMessageForSeed,
  generateAtmosphericMessage,
  isMessageValidForRoom,
  // Class
  AtmosphericMessageAligner,
  // Utility functions
  filterAtmosphericMessages,
  containsAtmosphericMessage,
  extractAtmosphericMessage
} from './AtmosphericMessageAligner';

describe('AtmosphericMessageAligner Property Tests', () => {
  /**
   * Generator for valid seeds
   */
  const seedArb = fc.integer({ min: 1, max: 2147483646 });

  /**
   * Generator for move counts
   */
  const moveCountArb = fc.integer({ min: 0, max: 1000 });

  /**
   * Generator for forest room IDs
   */
  const forestRoomArb = fc.constantFrom(...FOREST_ROOMS);

  /**
   * Generator for non-forest room IDs
   */
  const nonForestRoomArb = fc.constantFrom(
    'WEST-OF-HOUSE',
    'LIVING-ROOM',
    'CELLAR',
    'TROLL-ROOM',
    'MAZE-1'
  );

  /**
   * Generator for any room ID
   */
  const anyRoomArb = fc.oneof(forestRoomArb, nonForestRoomArb);

  // Reset seed before each test
  beforeEach(() => {
    setAtmosphericSeed(12345);
  });

  // ============================================================================
  // PROPERTY 7: DETERMINISTIC RANDOM EVENTS (ATMOSPHERIC PORTION)
  // ============================================================================

  /**
   * Feature: achieve-99-percent-parity, Property 7: Deterministic Random Events
   * 
   * For any fixed random seed, the sequence of atmospheric messages SHALL be identical
   * across multiple runs.
   * 
   * **Validates: Requirements 6.1, 6.3, 6.4**
   */
  it('Property 7a: Same seed produces identical random sequences for atmospheric messages', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        // Generate sequence with seed
        setAtmosphericSeed(seed);
        const sequence1: number[] = [];
        for (let i = 0; i < 100; i++) {
          sequence1.push(getAtmosphericRandom());
        }

        // Generate sequence again with same seed
        setAtmosphericSeed(seed);
        const sequence2: number[] = [];
        for (let i = 0; i < 100; i++) {
          sequence2.push(getAtmosphericRandom());
        }

        // Sequences should be identical
        for (let i = 0; i < 100; i++) {
          if (sequence1[i] !== sequence2[i]) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: achieve-99-percent-parity, Property 7: Deterministic Random Events
   * 
   * Different seeds produce different sequences.
   * 
   * **Validates: Requirements 6.3**
   */
  it('Property 7b: Different seeds produce different atmospheric sequences', () => {
    fc.assert(
      fc.property(seedArb, seedArb, (seed1, seed2) => {
        // Skip if seeds are the same
        if (seed1 === seed2) {
          return true;
        }

        // Generate sequence with seed1
        setAtmosphericSeed(seed1);
        const sequence1: number[] = [];
        for (let i = 0; i < 10; i++) {
          sequence1.push(getAtmosphericRandom());
        }

        // Generate sequence with seed2
        setAtmosphericSeed(seed2);
        const sequence2: number[] = [];
        for (let i = 0; i < 10; i++) {
          sequence2.push(getAtmosphericRandom());
        }

        // At least one value should differ
        let allSame = true;
        for (let i = 0; i < 10; i++) {
          if (sequence1[i] !== sequence2[i]) {
            allSame = false;
            break;
          }
        }
        return !allSame;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: achieve-99-percent-parity, Property 7: Deterministic Random Events
   * 
   * Random values are always in range [0, 1).
   * 
   * **Validates: Requirements 6.3**
   */
  it('Property 7c: Atmospheric random values are in valid range', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        setAtmosphericSeed(seed);
        
        for (let i = 0; i < 100; i++) {
          const value = getAtmosphericRandom();
          if (value < 0 || value >= 1) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: achieve-99-percent-parity, Property 7: Deterministic Random Events
   * 
   * getMessageForSeed is deterministic for same seed, room, and move count.
   * 
   * **Validates: Requirements 6.1, 6.3, 6.4**
   */
  it('Property 7d: getMessageForSeed is deterministic', () => {
    fc.assert(
      fc.property(seedArb, forestRoomArb, moveCountArb, (seed, roomId, moveCount) => {
        // First call
        const message1 = getMessageForSeed(roomId, seed, moveCount);

        // Second call with same parameters
        const message2 = getMessageForSeed(roomId, seed, moveCount);

        // Results should be identical
        return message1 === message2;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: achieve-99-percent-parity, Property 7: Deterministic Random Events
   * 
   * AtmosphericMessageAligner class produces deterministic results.
   * 
   * **Validates: Requirements 6.1, 6.3, 6.4**
   */
  it('Property 7e: AtmosphericMessageAligner is deterministic', () => {
    fc.assert(
      fc.property(seedArb, forestRoomArb, (seed, roomId) => {
        // First aligner
        const aligner1 = new AtmosphericMessageAligner(seed);
        const messages1: (string | null)[] = [];
        for (let i = 0; i < 20; i++) {
          aligner1.setMoveCount(i);
          messages1.push(aligner1.generateMessage(roomId));
        }

        // Second aligner with same seed
        const aligner2 = new AtmosphericMessageAligner(seed);
        const messages2: (string | null)[] = [];
        for (let i = 0; i < 20; i++) {
          aligner2.setMoveCount(i);
          messages2.push(aligner2.generateMessage(roomId));
        }

        // Results should be identical
        for (let i = 0; i < 20; i++) {
          if (messages1[i] !== messages2[i]) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // LOCATION-SPECIFIC MESSAGE RULES
  // ============================================================================

  /**
   * Feature: achieve-99-percent-parity, Property 7: Deterministic Random Events
   * 
   * Forest messages only appear in forest rooms.
   * 
   * **Validates: Requirements 6.4**
   */
  it('Property 7f: Forest messages only appear in forest rooms', () => {
    fc.assert(
      fc.property(nonForestRoomArb, (roomId) => {
        // Forest bird message should not be valid for non-forest rooms
        return !isMessageValidForRoom(FOREST_BIRD_MESSAGE, roomId);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: achieve-99-percent-parity, Property 7: Deterministic Random Events
   * 
   * Forest messages can appear in forest rooms.
   * 
   * **Validates: Requirements 6.4**
   */
  it('Property 7g: Forest messages can appear in forest rooms', () => {
    fc.assert(
      fc.property(forestRoomArb, (roomId) => {
        // Forest bird message should be valid for forest rooms
        return isMessageValidForRoom(FOREST_BIRD_MESSAGE, roomId);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Non-forest rooms never generate forest atmospheric messages.
   * 
   * **Validates: Requirements 6.4**
   */
  it('Non-forest rooms never generate forest messages', () => {
    fc.assert(
      fc.property(seedArb, nonForestRoomArb, moveCountArb, (seed, roomId, moveCount) => {
        const message = getMessageForSeed(roomId, seed, moveCount);
        // Should never get the forest bird message in non-forest rooms
        return message !== FOREST_BIRD_MESSAGE.text;
      }),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROBABILITY CONSTANT VALIDATION
  // ============================================================================

  /**
   * All probability constants are in valid range [0, 1].
   */
  it('All probability constants are in valid range', () => {
    const probabilities = [
      FOREST_MESSAGE_PROBABILITY,
      UNDERGROUND_MESSAGE_PROBABILITY,
      THIEF_ANNOUNCEMENT_PROBABILITY
    ];

    for (const prob of probabilities) {
      expect(prob).toBeGreaterThanOrEqual(0);
      expect(prob).toBeLessThanOrEqual(1);
    }
  });

  /**
   * Probability constants match ZIL source values.
   */
  it('Probability constants match ZIL source values', () => {
    // Forest message probability from ZIL: <PROB 15>
    expect(FOREST_MESSAGE_PROBABILITY).toBe(0.15);
    
    // Underground has no atmospheric messages in original
    expect(UNDERGROUND_MESSAGE_PROBABILITY).toBe(0.0);
    
    // Thief announcement from ZIL: <PROB 40>
    expect(THIEF_ANNOUNCEMENT_PROBABILITY).toBe(0.40);
  });

  // ============================================================================
  // MESSAGE TEXT VALIDATION
  // ============================================================================

  /**
   * Forest bird message text matches Z-Machine exactly.
   */
  it('Forest bird message text matches Z-Machine exactly', () => {
    expect(FOREST_BIRD_MESSAGE.text).toBe(
      'You hear in the distance the chirping of a song bird.'
    );
  });

  /**
   * All atmospheric messages have valid structure.
   */
  it('All atmospheric messages have valid structure', () => {
    for (const message of ATMOSPHERIC_MESSAGES) {
      expect(message.id).toBeTruthy();
      expect(message.text).toBeTruthy();
      expect(message.probability).toBeGreaterThanOrEqual(0);
      expect(message.probability).toBeLessThanOrEqual(1);
      expect(['forest', 'underground', 'any']).toContain(message.locationType);
    }
  });

  // ============================================================================
  // LOCATION DETECTION PROPERTIES
  // ============================================================================

  /**
   * isForestRoom correctly identifies forest rooms.
   */
  it('isForestRoom correctly identifies forest rooms', () => {
    fc.assert(
      fc.property(forestRoomArb, (roomId) => {
        return isForestRoom(roomId) === true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * isForestRoom correctly rejects non-forest rooms.
   */
  it('isForestRoom correctly rejects non-forest rooms', () => {
    fc.assert(
      fc.property(nonForestRoomArb, (roomId) => {
        return isForestRoom(roomId) === false;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Forest rooms are surface rooms.
   */
  it('Forest rooms are surface rooms', () => {
    for (const roomId of FOREST_ROOMS) {
      expect(SURFACE_ROOMS).toContain(roomId);
    }
  });

  /**
   * isUndergroundRoom is inverse of surface room membership.
   */
  it('isUndergroundRoom is inverse of surface room membership', () => {
    // Surface rooms should not be underground
    for (const roomId of SURFACE_ROOMS) {
      expect(isUndergroundRoom(roomId)).toBe(false);
    }
    
    // Non-surface rooms should be underground
    const undergroundRooms = ['CELLAR', 'TROLL-ROOM', 'MAZE-1', 'TREASURE-ROOM'];
    for (const roomId of undergroundRooms) {
      expect(isUndergroundRoom(roomId)).toBe(true);
    }
  });

  // ============================================================================
  // UTILITY FUNCTION PROPERTIES
  // ============================================================================

  /**
   * filterAtmosphericMessages removes known messages.
   */
  it('filterAtmosphericMessages removes known messages', () => {
    const outputWithMessage = `Some text.\n${FOREST_BIRD_MESSAGE.text}\nMore text.`;
    const filtered = filterAtmosphericMessages(outputWithMessage);
    
    expect(filtered).not.toContain(FOREST_BIRD_MESSAGE.text);
    expect(filtered).toContain('Some text.');
    expect(filtered).toContain('More text.');
  });

  /**
   * filterAtmosphericMessages preserves output without messages.
   */
  it('filterAtmosphericMessages preserves output without messages', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !containsAtmosphericMessage(s)),
        (output) => {
          const filtered = filterAtmosphericMessages(output);
          // Should be essentially the same (just trimmed)
          return filtered === output.trim();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * containsAtmosphericMessage detects messages correctly.
   */
  it('containsAtmosphericMessage detects messages correctly', () => {
    // Should detect forest bird message
    expect(containsAtmosphericMessage(FOREST_BIRD_MESSAGE.text)).toBe(true);
    expect(containsAtmosphericMessage(`Prefix ${FOREST_BIRD_MESSAGE.text} suffix`)).toBe(true);
    
    // Should not detect in unrelated text
    expect(containsAtmosphericMessage('Just some random text.')).toBe(false);
  });

  /**
   * extractAtmosphericMessage extracts correct message.
   */
  it('extractAtmosphericMessage extracts correct message', () => {
    const outputWithMessage = `Some text.\n${FOREST_BIRD_MESSAGE.text}\nMore text.`;
    const extracted = extractAtmosphericMessage(outputWithMessage);
    
    expect(extracted).toBe(FOREST_BIRD_MESSAGE);
  });

  /**
   * extractAtmosphericMessage returns null for no message.
   */
  it('extractAtmosphericMessage returns null for no message', () => {
    const outputWithoutMessage = 'Just some random text without atmospheric messages.';
    const extracted = extractAtmosphericMessage(outputWithoutMessage);
    
    expect(extracted).toBeNull();
  });

  // ============================================================================
  // ALIGNER CLASS PROPERTIES
  // ============================================================================

  /**
   * AtmosphericMessageAligner seed management is consistent.
   */
  it('AtmosphericMessageAligner seed management is consistent', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const aligner = new AtmosphericMessageAligner(seed);
        return aligner.getSeed() === seed;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * AtmosphericMessageAligner setSeed updates seed correctly.
   */
  it('AtmosphericMessageAligner setSeed updates seed correctly', () => {
    fc.assert(
      fc.property(seedArb, seedArb, (seed1, seed2) => {
        const aligner = new AtmosphericMessageAligner(seed1);
        aligner.setSeed(seed2);
        return aligner.getSeed() === seed2;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * AtmosphericMessageAligner move count management is consistent.
   */
  it('AtmosphericMessageAligner move count management is consistent', () => {
    fc.assert(
      fc.property(moveCountArb, (moveCount) => {
        const aligner = new AtmosphericMessageAligner();
        aligner.setMoveCount(moveCount);
        return aligner.getMoveCount() === moveCount;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * AtmosphericMessageAligner incrementMoveCount works correctly.
   */
  it('AtmosphericMessageAligner incrementMoveCount works correctly', () => {
    fc.assert(
      fc.property(moveCountArb, (initialCount) => {
        const aligner = new AtmosphericMessageAligner();
        aligner.setMoveCount(initialCount);
        aligner.incrementMoveCount();
        return aligner.getMoveCount() === initialCount + 1;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * AtmosphericMessageAligner suppress works correctly.
   */
  it('AtmosphericMessageAligner suppress works correctly', () => {
    const aligner = new AtmosphericMessageAligner();
    
    expect(aligner.isSuppressed()).toBe(false);
    
    aligner.suppress(true);
    expect(aligner.isSuppressed()).toBe(true);
    
    aligner.suppress(false);
    expect(aligner.isSuppressed()).toBe(false);
  });

  /**
   * AtmosphericMessageAligner suppressed mode returns null.
   */
  it('AtmosphericMessageAligner suppressed mode returns null', () => {
    fc.assert(
      fc.property(seedArb, forestRoomArb, (seed, roomId) => {
        const aligner = new AtmosphericMessageAligner(seed);
        aligner.suppress(true);
        
        // Should always return null when suppressed
        for (let i = 0; i < 100; i++) {
          aligner.setMoveCount(i);
          if (aligner.generateMessage(roomId) !== null) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * AtmosphericMessageAligner reset works correctly.
   */
  it('AtmosphericMessageAligner reset works correctly', () => {
    fc.assert(
      fc.property(seedArb, seedArb, (seed1, seed2) => {
        const aligner = new AtmosphericMessageAligner(seed1);
        aligner.setMoveCount(100);
        
        // Reset with new seed
        aligner.reset(seed2);
        
        return aligner.getSeed() === seed2 && aligner.getMoveCount() === 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * AtmosphericMessageAligner reset without seed preserves original seed.
   */
  it('AtmosphericMessageAligner reset without seed preserves original seed', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const aligner = new AtmosphericMessageAligner(seed);
        aligner.setMoveCount(100);
        
        // Reset without new seed
        aligner.reset();
        
        return aligner.getSeed() === seed && aligner.getMoveCount() === 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * AtmosphericMessageAligner getPossibleMessages returns correct messages for forest rooms.
   */
  it('AtmosphericMessageAligner getPossibleMessages returns correct messages for forest rooms', () => {
    fc.assert(
      fc.property(forestRoomArb, (roomId) => {
        const aligner = new AtmosphericMessageAligner();
        const possible = aligner.getPossibleMessages(roomId);
        
        // Should include forest bird message
        return possible.some(msg => msg.id === 'forest-bird');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * AtmosphericMessageAligner getPossibleMessages returns empty for non-forest rooms.
   */
  it('AtmosphericMessageAligner getPossibleMessages returns empty for non-forest rooms', () => {
    fc.assert(
      fc.property(nonForestRoomArb, (roomId) => {
        const aligner = new AtmosphericMessageAligner();
        const possible = aligner.getPossibleMessages(roomId);
        
        // Should be empty for non-forest rooms (no underground messages in original)
        return possible.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * AtmosphericMessageAligner canHaveMessages is consistent with getPossibleMessages.
   */
  it('AtmosphericMessageAligner canHaveMessages is consistent with getPossibleMessages', () => {
    fc.assert(
      fc.property(anyRoomArb, (roomId) => {
        const aligner = new AtmosphericMessageAligner();
        const possible = aligner.getPossibleMessages(roomId);
        const canHave = aligner.canHaveMessages(roomId);
        
        return canHave === (possible.length > 0);
      }),
      { numRuns: 100 }
    );
  });
});
