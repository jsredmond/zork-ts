/**
 * Unit tests for DifferenceClassifier
 * 
 * Tests the classification of differences between TypeScript and Z-Machine outputs
 * into RNG_DIFFERENCE, STATE_DIVERGENCE, or LOGIC_DIFFERENCE categories.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DifferenceClassifier,
  createDifferenceClassifier,
  classify,
  isYuksPoolMessage,
  isHoHumPoolMessage,
  isHellosPoolMessage,
  isWheeeePoolMessage,
  isJumplossPoolMessage,
  isRngPoolMessage,
  areBothFromSameRngPool,
  isStateDivergence,
  YUKS_POOL,
  HO_HUM_POOL,
  HELLOS_POOL,
  WHEEEEE_POOL,
  JUMPLOSS_POOL,
  CommandContext
} from './differenceClassifier';

describe('DifferenceClassifier', () => {
  let classifier: DifferenceClassifier;

  beforeEach(() => {
    classifier = createDifferenceClassifier();
  });

  describe('YUKS pool message detection', () => {
    // Requirements: 5.1
    it('should detect all YUKS pool messages', () => {
      for (const message of YUKS_POOL) {
        expect(isYuksPoolMessage(message)).toBe(true);
      }
    });

    it('should detect YUKS messages with surrounding text', () => {
      expect(isYuksPoolMessage('  A valiant attempt.  ')).toBe(true);
      expect(isYuksPoolMessage("You can't be serious.")).toBe(true);
    });

    it('should not detect non-YUKS messages', () => {
      expect(isYuksPoolMessage('Hello.')).toBe(false);
      expect(isYuksPoolMessage('Taken.')).toBe(false);
      expect(isYuksPoolMessage("You can't go that way.")).toBe(false);
    });
  });

  describe('HO-HUM pool message detection', () => {
    // Requirements: 5.2
    it('should detect all HO-HUM pool messages', () => {
      for (const suffix of HO_HUM_POOL) {
        const message = `The sword${suffix}`;
        expect(isHoHumPoolMessage(message)).toBe(true);
      }
    });

    it('should detect HO-HUM messages with various object names', () => {
      expect(isHoHumPoolMessage("The lamp doesn't seem to work.")).toBe(true);
      expect(isHoHumPoolMessage("The rope isn't notably helpful.")).toBe(true);
      expect(isHoHumPoolMessage('Pushing the rock has no effect.')).toBe(true);
    });

    it('should not detect non-HO-HUM messages', () => {
      expect(isHoHumPoolMessage('Hello.')).toBe(false);
      expect(isHoHumPoolMessage('A valiant attempt.')).toBe(false);
    });
  });

  describe('HELLOS pool message detection', () => {
    // Requirements: 5.3
    it('should detect all HELLOS pool messages', () => {
      for (const message of HELLOS_POOL) {
        expect(isHellosPoolMessage(message)).toBe(true);
      }
    });

    it('should detect HELLOS messages with whitespace', () => {
      expect(isHellosPoolMessage('  Hello.  ')).toBe(true);
      expect(isHellosPoolMessage('Good day.')).toBe(true);
    });

    it('should not detect non-HELLOS messages', () => {
      expect(isHellosPoolMessage('A valiant attempt.')).toBe(false);
      expect(isHellosPoolMessage('Taken.')).toBe(false);
    });
  });

  describe('WHEEEEE pool message detection', () => {
    it('should detect all WHEEEEE pool messages', () => {
      for (const message of WHEEEEE_POOL) {
        expect(isWheeeePoolMessage(message)).toBe(true);
      }
    });
  });

  describe('JUMPLOSS pool message detection', () => {
    it('should detect all JUMPLOSS pool messages', () => {
      for (const message of JUMPLOSS_POOL) {
        expect(isJumplossPoolMessage(message)).toBe(true);
      }
    });
  });

  describe('isRngPoolMessage', () => {
    it('should detect messages from any RNG pool', () => {
      expect(isRngPoolMessage('A valiant attempt.')).toBe(true);
      expect(isRngPoolMessage("The sword doesn't seem to work.")).toBe(true);
      expect(isRngPoolMessage('Hello.')).toBe(true);
      expect(isRngPoolMessage('Wheeeeeeeeee!!!!!')).toBe(true);
      expect(isRngPoolMessage('Geronimo...')).toBe(true);
    });

    it('should not detect non-RNG messages', () => {
      expect(isRngPoolMessage('Taken.')).toBe(false);
      expect(isRngPoolMessage("You can't go that way.")).toBe(false);
      expect(isRngPoolMessage('West of House')).toBe(false);
    });
  });

  describe('areBothFromSameRngPool', () => {
    it('should return true when both are from YUKS pool', () => {
      expect(areBothFromSameRngPool(
        'A valiant attempt.',
        "You can't be serious."
      )).toBe(true);
    });

    it('should return true when both are from HO-HUM pool', () => {
      expect(areBothFromSameRngPool(
        "The sword doesn't seem to work.",
        "The sword isn't notably helpful."
      )).toBe(true);
    });

    it('should return true when both are from HELLOS pool', () => {
      expect(areBothFromSameRngPool(
        'Hello.',
        'Good day.'
      )).toBe(true);
    });

    it('should return false when from different pools', () => {
      expect(areBothFromSameRngPool(
        'A valiant attempt.',
        'Hello.'
      )).toBe(false);
    });

    it('should return false when neither is from RNG pool', () => {
      expect(areBothFromSameRngPool(
        'Taken.',
        'Dropped.'
      )).toBe(false);
    });
  });

  describe('state divergence detection', () => {
    // Requirements: 5.4
    it('should detect state divergence when rooms differ', () => {
      const context: CommandContext = {
        command: 'north',
        commandIndex: 10,
        tsRoom: 'West of House',
        zmRoom: 'Forest'
      };
      expect(isStateDivergence(context)).toBe(true);
    });

    it('should detect state divergence when explicitly marked', () => {
      const context: CommandContext = {
        command: 'look',
        commandIndex: 5,
        hasStateDiverged: true
      };
      expect(isStateDivergence(context)).toBe(true);
    });

    it('should detect state divergence after many RNG differences', () => {
      const previousDifferences = [
        { commandIndex: 1, command: 'push rock', tsOutput: '', zmOutput: '', classification: 'RNG_DIFFERENCE' as const, reason: '' },
        { commandIndex: 2, command: 'push rock', tsOutput: '', zmOutput: '', classification: 'RNG_DIFFERENCE' as const, reason: '' },
        { commandIndex: 3, command: 'push rock', tsOutput: '', zmOutput: '', classification: 'RNG_DIFFERENCE' as const, reason: '' },
        { commandIndex: 4, command: 'push rock', tsOutput: '', zmOutput: '', classification: 'RNG_DIFFERENCE' as const, reason: '' }
      ];
      const context: CommandContext = {
        command: 'look',
        commandIndex: 5,
        previousDifferences
      };
      expect(isStateDivergence(context)).toBe(true);
    });

    it('should not detect state divergence when rooms are same', () => {
      const context: CommandContext = {
        command: 'look',
        commandIndex: 5,
        tsRoom: 'West of House',
        zmRoom: 'West of House'
      };
      expect(isStateDivergence(context)).toBe(false);
    });
  });

  describe('classify function', () => {
    it('should classify RNG differences from YUKS pool', () => {
      const result = classify(
        'A valiant attempt.',
        "You can't be serious.",
        { command: 'take house', commandIndex: 5 }
      );
      expect(result.classification).toBe('RNG_DIFFERENCE');
      expect(result.reason).toContain('YUKS');
    });

    it('should classify RNG differences from HO-HUM pool', () => {
      const result = classify(
        "The sword doesn't seem to work.",
        "The sword isn't notably helpful.",
        { command: 'push sword', commandIndex: 5 }
      );
      expect(result.classification).toBe('RNG_DIFFERENCE');
      expect(result.reason).toContain('HO_HUM');
    });

    it('should classify RNG differences from HELLOS pool', () => {
      const result = classify(
        'Hello.',
        'Good day.',
        { command: 'hello', commandIndex: 5 }
      );
      expect(result.classification).toBe('RNG_DIFFERENCE');
      expect(result.reason).toContain('HELLOS');
    });

    it('should classify state divergence when rooms differ', () => {
      const result = classify(
        "You can't go that way.",
        'Forest',
        {
          command: 'north',
          commandIndex: 10,
          tsRoom: 'West of House',
          zmRoom: 'Forest'
        }
      );
      expect(result.classification).toBe('STATE_DIVERGENCE');
    });

    it('should classify logic differences when no RNG or state divergence', () => {
      // Requirements: 5.5
      const result = classify(
        'The lamp is now on.',
        'The lantern is now lit.',
        { command: 'turn on lamp', commandIndex: 5 }
      );
      expect(result.classification).toBe('LOGIC_DIFFERENCE');
      expect(result.reason).toContain('cannot be attributed');
    });
  });

  describe('DifferenceClassifier class', () => {
    it('should track differences over time', () => {
      classifier.classifyDifference(
        'A valiant attempt.',
        "You can't be serious.",
        'take house',
        1
      );
      classifier.classifyDifference(
        'Hello.',
        'Good day.',
        'hello',
        2
      );

      const differences = classifier.getDifferences();
      expect(differences).toHaveLength(2);
      expect(differences[0].classification).toBe('RNG_DIFFERENCE');
      expect(differences[1].classification).toBe('RNG_DIFFERENCE');
    });

    it('should track state divergence', () => {
      // First, add some RNG differences
      for (let i = 0; i < 5; i++) {
        classifier.classifyDifference(
          'A valiant attempt.',
          "You can't be serious.",
          'take house',
          i
        );
      }

      // Now classify something that might be state divergence
      const result = classifier.classifyDifference(
        "You can't go that way.",
        'Forest',
        'north',
        6,
        'West of House',
        'Forest'
      );

      expect(result.classification).toBe('STATE_DIVERGENCE');
    });

    it('should provide difference counts', () => {
      classifier.classifyDifference('A valiant attempt.', "You can't be serious.", 'take house', 1);
      classifier.classifyDifference('Hello.', 'Good day.', 'hello', 2);
      classifier.classifyDifference('Taken.', 'Got it.', 'take lamp', 3);

      const counts = classifier.getDifferenceCounts();
      expect(counts.RNG_DIFFERENCE).toBe(2);
      expect(counts.LOGIC_DIFFERENCE).toBe(1);
    });

    it('should reset state', () => {
      classifier.classifyDifference('A valiant attempt.', "You can't be serious.", 'take house', 1);
      classifier.reset();

      expect(classifier.getDifferences()).toHaveLength(0);
      expect(classifier.getDifferenceCounts().RNG_DIFFERENCE).toBe(0);
    });

    it('should expose pool detection methods', () => {
      expect(classifier.isYuksPoolMessage('A valiant attempt.')).toBe(true);
      expect(classifier.isHoHumPoolMessage("The sword doesn't seem to work.")).toBe(true);
      expect(classifier.isHellosPoolMessage('Hello.')).toBe(true);
    });
  });

  describe('fallback to LOGIC_DIFFERENCE', () => {
    // Requirements: 5.5
    it('should classify unrecognized differences as LOGIC_DIFFERENCE', () => {
      const result = classify(
        'You are in a dark room.',
        'You are in a dimly lit room.',
        { command: 'look', commandIndex: 5 }
      );
      expect(result.classification).toBe('LOGIC_DIFFERENCE');
    });

    it('should classify mismatched content as LOGIC_DIFFERENCE', () => {
      const result = classify(
        'The door opens.',
        'The door is locked.',
        { command: 'open door', commandIndex: 5 }
      );
      expect(result.classification).toBe('LOGIC_DIFFERENCE');
    });
  });
});
