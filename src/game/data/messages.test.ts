/**
 * Property-based tests for generic message exactness
 * Feature: complete-text-accuracy, Property 1: Message text exactness (generic subset)
 * Validates: Requirements 4.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  REFUSAL_MESSAGES,
  INEFFECTIVE_ACTION_MESSAGES,
  HELLO_MESSAGES,
  SILLY_ACTION_MESSAGES,
  JUMP_FAILURE_MESSAGES,
  HUMOROUS_RESPONSES,
  PARSER_FEEDBACK,
  pickRandomMessage,
  getRefusalMessage,
  getIneffectiveActionMessage,
  getHelloMessage,
  getSillyActionMessage,
  getJumpFailureMessage,
  getHumorousResponse,
  getParserFeedback,
  getRotatedMessage,
  resetMessageRotation
} from './messages.js';

describe('Generic Message Exactness', () => {
  /**
   * Property 1: Message text exactness (generic subset)
   * For any generic message type, the returned message should match exactly
   * one of the original ZIL messages for that category
   */
  
  describe('Refusal Messages (YUKS)', () => {
    it('should return exact messages from ZIL YUKS table', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 99 }),
          () => {
            const message = getRefusalMessage();
            expect(REFUSAL_MESSAGES).toContain(message);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match exact ZIL text', () => {
      const expectedMessages = [
        "A valiant attempt.",
        "You can't be serious.",
        "An interesting idea...",
        "What a concept!"
      ];
      
      expect(REFUSAL_MESSAGES).toEqual(expectedMessages);
    });
  });

  describe('Ineffective Action Messages (HO-HUM)', () => {
    it('should return exact suffixes from ZIL HO-HUM table', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (objectName) => {
            const message = getIneffectiveActionMessage(objectName);
            const hasSuffix = INEFFECTIVE_ACTION_MESSAGES.some(suffix => 
              message.endsWith(suffix)
            );
            expect(hasSuffix).toBe(true);
            expect(message.startsWith(objectName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match exact ZIL suffixes', () => {
      const expectedSuffixes = [
        " doesn't seem to work.",
        " isn't notably helpful.",
        " has no effect."
      ];
      
      expect(INEFFECTIVE_ACTION_MESSAGES).toEqual(expectedSuffixes);
    });
  });

  describe('Hello Messages (HELLOS)', () => {
    it('should return exact messages from ZIL HELLOS table', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 99 }),
          () => {
            const message = getHelloMessage();
            expect(HELLO_MESSAGES).toContain(message);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match exact ZIL text', () => {
      const expectedMessages = [
        "Hello.",
        "Good day.",
        "Nice weather we've been having lately.",
        "Goodbye."
      ];
      
      expect(HELLO_MESSAGES).toEqual(expectedMessages);
    });
  });

  describe('Silly Action Messages (WHEEEEE)', () => {
    it('should return exact messages from ZIL WHEEEEE table', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 99 }),
          () => {
            const message = getSillyActionMessage();
            expect(SILLY_ACTION_MESSAGES).toContain(message);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match exact ZIL text', () => {
      const expectedMessages = [
        "Very good. Now you can go to the second grade.",
        "Are you enjoying yourself?",
        "Wheeeeeeeeee!!!!!",
        "Do you expect me to applaud?"
      ];
      
      expect(SILLY_ACTION_MESSAGES).toEqual(expectedMessages);
    });
  });

  describe('Jump Failure Messages (JUMPLOSS)', () => {
    it('should return exact messages from ZIL JUMPLOSS table', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 99 }),
          () => {
            const message = getJumpFailureMessage();
            expect(JUMP_FAILURE_MESSAGES).toContain(message);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match exact ZIL text', () => {
      const expectedMessages = [
        "You should have looked before you leaped.",
        "In the movies, your life would be passing before your eyes.",
        "Geronimo..."
      ];
      
      expect(JUMP_FAILURE_MESSAGES).toEqual(expectedMessages);
    });
  });

  describe('Humorous Responses', () => {
    it('should return exact messages from ZIL verb routines', () => {
      const testCases = [
        { action: 'ADVENT', expected: 'A hollow voice says "Fool."' },
        { action: 'BUG', expected: "Bug? Not in a flawless program like this! (Cough, cough)." },
        { action: 'CHOMP', expected: 'Preposterous!' },
        { action: 'EXORCISE', expected: 'What a bizarre concept!' },
        { action: 'FROBOZZ', expected: 'The FROBOZZ Corporation created, owns, and operates this dungeon.' },
        { action: 'KISS', expected: "I'd sooner kiss a pig." },
        { action: 'WIN', expected: 'Naturally!' },
        { action: 'YELL', expected: 'Aaaarrrrgggghhhh!' },
        { action: 'ZORK', expected: 'At your service!' }
      ];

      testCases.forEach(({ action, expected }) => {
        const message = getHumorousResponse(action);
        expect(message).toBe(expected);
      });
    });

    it('should handle placeholder replacement correctly', () => {
      const message = getHumorousResponse('HELLO_TO_OBJECT', { object: 'lamp' });
      expect(message).toBe("It's a well known fact that only schizophrenics say \"Hello\" to a lamp.");
    });
  });

  describe('Parser Feedback Variations', () => {
    it('should return messages from defined variations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('AMBIGUOUS', 'NOT_HERE', 'DONT_HAVE', 'CANT_SEE', 'DONT_UNDERSTAND', 'NO_VERB'),
          (feedbackType) => {
            const message = getParserFeedback(feedbackType);
            expect(typeof message).toBe('string');
            expect(message.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle placeholder replacement', () => {
      const message = getParserFeedback('AMBIGUOUS', { object: 'lamp' });
      expect(message).toContain('lamp');
    });
  });

  describe('Message Rotation (PICK-ONE)', () => {
    it('should cycle through all messages in order', () => {
      const messages = ['First', 'Second', 'Third'];
      const context = 'test-rotation';
      
      resetMessageRotation(context);
      
      // Should cycle through all messages
      expect(getRotatedMessage(context, messages)).toBe('First');
      expect(getRotatedMessage(context, messages)).toBe('Second');
      expect(getRotatedMessage(context, messages)).toBe('Third');
      expect(getRotatedMessage(context, messages)).toBe('First'); // Wraps around
    });

    it('should maintain separate rotation state for different contexts', () => {
      const messages = ['A', 'B', 'C'];
      const context1 = 'context-1';
      const context2 = 'context-2';
      
      resetMessageRotation(context1);
      resetMessageRotation(context2);
      
      expect(getRotatedMessage(context1, messages)).toBe('A');
      expect(getRotatedMessage(context2, messages)).toBe('A');
      expect(getRotatedMessage(context1, messages)).toBe('B');
      expect(getRotatedMessage(context2, messages)).toBe('B');
    });

    it('should handle single message arrays', () => {
      const messages = ['Only'];
      const context = 'single-message';
      
      resetMessageRotation(context);
      
      expect(getRotatedMessage(context, messages)).toBe('Only');
      expect(getRotatedMessage(context, messages)).toBe('Only');
    });

    it('should handle empty arrays', () => {
      const messages: string[] = [];
      const context = 'empty';
      
      expect(getRotatedMessage(context, messages)).toBe('');
    });
  });

  describe('Random Message Selection', () => {
    it('should always return a message from the provided array', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
          (messages) => {
            const selected = pickRandomMessage(messages);
            expect(messages).toContain(selected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should eventually select all messages given enough iterations', () => {
      const messages = ['A', 'B', 'C', 'D', 'E'];
      const selected = new Set<string>();
      
      // Run enough times to likely hit all messages
      for (let i = 0; i < 100; i++) {
        selected.add(pickRandomMessage(messages));
      }
      
      // Should have selected most or all messages
      expect(selected.size).toBeGreaterThanOrEqual(3);
    });
  });
});
