/**
 * Property-Based Tests for DifferenceClassifier
 * 
 * These tests verify universal properties that should hold for all valid inputs.
 * 
 * Feature: final-100-percent-parity
 * 
 * **Validates: Requirements 2.3, 5.1, 5.2, 5.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  classify,
  isYuksPoolMessage,
  isHoHumPoolMessage,
  isHellosPoolMessage,
  isRngPoolMessage,
  areBothFromSameRngPool,
  YUKS_POOL,
  HO_HUM_POOL,
  HELLOS_POOL,
  WHEEEEE_POOL,
  JUMPLOSS_POOL,
  DifferenceType,
  CommandContext
} from './differenceClassifier';

describe('DifferenceClassifier Property Tests', () => {
  /**
   * Generator for YUKS pool messages
   */
  const yuksMessageArb = fc.constantFrom(...YUKS_POOL);

  /**
   * Generator for HO-HUM pool messages (with object prefix)
   */
  const hoHumMessageArb = fc.tuple(
    fc.constantFrom('The sword', 'The lamp', 'The rope', 'The rock', 'Pushing the door'),
    fc.constantFrom(...HO_HUM_POOL)
  ).map(([prefix, suffix]) => `${prefix}${suffix}`);

  /**
   * Generator for HELLOS pool messages
   */
  const hellosMessageArb = fc.constantFrom(...HELLOS_POOL);

  /**
   * Generator for WHEEEEE pool messages
   */
  const wheeeeMessageArb = fc.constantFrom(...WHEEEEE_POOL);

  /**
   * Generator for JUMPLOSS pool messages
   */
  const jumplossMessageArb = fc.constantFrom(...JUMPLOSS_POOL);

  /**
   * Generator for any RNG pool message
   */
  const anyRngMessageArb = fc.oneof(
    yuksMessageArb,
    hoHumMessageArb,
    hellosMessageArb,
    wheeeeMessageArb,
    jumplossMessageArb
  );

  /**
   * Generator for non-RNG messages (standard game responses)
   */
  const nonRngMessageArb = fc.constantFrom(
    'Taken.',
    'Dropped.',
    'Opened.',
    'Closed.',
    "You can't go that way.",
    'West of House',
    'You are in a dark room.',
    'The door is locked.',
    'The lamp is now on.',
    'You are empty-handed.',
    'It is pitch black. You are likely to be eaten by a grue.',
    'There is a small mailbox here.',
    'You are standing in an open field west of a white house.'
  );

  /**
   * Generator for basic command context
   */
  const basicContextArb = fc.record({
    command: fc.constantFrom('take house', 'push rock', 'hello', 'jump', 'look', 'north'),
    commandIndex: fc.integer({ min: 0, max: 1000 })
  });

  /**
   * Feature: final-100-percent-parity, Property 5: RNG Pool Messages Classified Correctly
   * 
   * For all messages from the YUKS pool, when both TS and ZM outputs are from YUKS,
   * the classifier SHALL classify it as RNG_DIFFERENCE.
   * 
   * **Validates: Requirements 5.1**
   */
  it('Property 5a: YUKS pool differences are classified as RNG_DIFFERENCE', () => {
    fc.assert(
      fc.property(
        yuksMessageArb,
        yuksMessageArb,
        basicContextArb,
        (tsOutput, zmOutput, context) => {
          // Skip if outputs are identical (not a difference)
          if (tsOutput === zmOutput) {
            return true;
          }

          const result = classify(tsOutput, zmOutput, context);
          return result.classification === 'RNG_DIFFERENCE';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 5: RNG Pool Messages Classified Correctly
   * 
   * For all messages from the HO-HUM pool, when both TS and ZM outputs are from HO-HUM,
   * the classifier SHALL classify it as RNG_DIFFERENCE.
   * 
   * **Validates: Requirements 5.2**
   */
  it('Property 5b: HO-HUM pool differences are classified as RNG_DIFFERENCE', () => {
    fc.assert(
      fc.property(
        hoHumMessageArb,
        hoHumMessageArb,
        basicContextArb,
        (tsOutput, zmOutput, context) => {
          // Skip if outputs are identical (not a difference)
          if (tsOutput === zmOutput) {
            return true;
          }

          const result = classify(tsOutput, zmOutput, context);
          return result.classification === 'RNG_DIFFERENCE';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 5: RNG Pool Messages Classified Correctly
   * 
   * For all messages from the HELLOS pool, when both TS and ZM outputs are from HELLOS,
   * the classifier SHALL classify it as RNG_DIFFERENCE.
   * 
   * **Validates: Requirements 5.3**
   */
  it('Property 5c: HELLOS pool differences are classified as RNG_DIFFERENCE', () => {
    fc.assert(
      fc.property(
        hellosMessageArb,
        hellosMessageArb,
        basicContextArb,
        (tsOutput, zmOutput, context) => {
          // Skip if outputs are identical (not a difference)
          if (tsOutput === zmOutput) {
            return true;
          }

          const result = classify(tsOutput, zmOutput, context);
          return result.classification === 'RNG_DIFFERENCE';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 5: RNG Pool Messages Classified Correctly
   * 
   * For all messages from any RNG pool, when both outputs are from the same pool,
   * the classifier SHALL classify it as RNG_DIFFERENCE.
   * 
   * **Validates: Requirements 5.1, 5.2, 5.3**
   */
  it('Property 5d: Any same-pool RNG differences are classified as RNG_DIFFERENCE', () => {
    // Test each pool separately to ensure same-pool comparison
    const poolTests = [
      { name: 'YUKS', arb: yuksMessageArb },
      { name: 'HO_HUM', arb: hoHumMessageArb },
      { name: 'HELLOS', arb: hellosMessageArb },
      { name: 'WHEEEEE', arb: wheeeeMessageArb },
      { name: 'JUMPLOSS', arb: jumplossMessageArb }
    ];

    for (const pool of poolTests) {
      fc.assert(
        fc.property(
          pool.arb,
          pool.arb,
          basicContextArb,
          (tsOutput, zmOutput, context) => {
            // Skip if outputs are identical
            if (tsOutput === zmOutput) {
              return true;
            }

            const result = classify(tsOutput, zmOutput, context);
            return result.classification === 'RNG_DIFFERENCE';
          }
        ),
        { numRuns: 100 }
      );
    }
  });

  /**
   * Feature: final-100-percent-parity, Property 2: All Differences Get Classified
   * 
   * For all generated differences, the classifier SHALL assign exactly one
   * classification from {RNG_DIFFERENCE, STATE_DIVERGENCE, LOGIC_DIFFERENCE}.
   * 
   * **Validates: Requirements 2.3**
   */
  it('Property 2a: All differences receive exactly one classification', () => {
    const validClassifications: DifferenceType[] = [
      'RNG_DIFFERENCE',
      'STATE_DIVERGENCE',
      'LOGIC_DIFFERENCE'
    ];

    fc.assert(
      fc.property(
        fc.oneof(anyRngMessageArb, nonRngMessageArb),
        fc.oneof(anyRngMessageArb, nonRngMessageArb),
        basicContextArb,
        (tsOutput, zmOutput, context) => {
          const result = classify(tsOutput, zmOutput, context);

          // Classification must be one of the valid types
          if (!validClassifications.includes(result.classification)) {
            return false;
          }

          // Result must have all required fields
          if (
            result.commandIndex === undefined ||
            result.command === undefined ||
            result.tsOutput === undefined ||
            result.zmOutput === undefined ||
            result.reason === undefined
          ) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 2: All Differences Get Classified
   * 
   * For all differences with state divergence context, the classifier SHALL
   * classify them as STATE_DIVERGENCE or RNG_DIFFERENCE (not LOGIC_DIFFERENCE).
   * 
   * **Validates: Requirements 2.3**
   */
  it('Property 2b: State divergence context produces STATE_DIVERGENCE or RNG_DIFFERENCE', () => {
    const divergedContextArb = fc.record({
      command: fc.constantFrom('north', 'south', 'look', 'take lamp'),
      commandIndex: fc.integer({ min: 0, max: 1000 }),
      tsRoom: fc.constantFrom('West of House', 'Forest', 'Kitchen'),
      zmRoom: fc.constantFrom('Behind House', 'Clearing', 'Living Room'),
      hasStateDiverged: fc.constant(true)
    }).filter(ctx => ctx.tsRoom !== ctx.zmRoom);

    fc.assert(
      fc.property(
        nonRngMessageArb,
        nonRngMessageArb,
        divergedContextArb,
        (tsOutput, zmOutput, context) => {
          const result = classify(tsOutput, zmOutput, context);

          // With diverged state, should be STATE_DIVERGENCE or RNG_DIFFERENCE
          return (
            result.classification === 'STATE_DIVERGENCE' ||
            result.classification === 'RNG_DIFFERENCE'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 5: RNG Pool Messages Classified Correctly
   * 
   * isRngPoolMessage correctly identifies all RNG pool messages.
   * 
   * **Validates: Requirements 5.1, 5.2, 5.3**
   */
  it('Property 5e: isRngPoolMessage identifies all RNG pool messages', () => {
    fc.assert(
      fc.property(anyRngMessageArb, (message) => {
        return isRngPoolMessage(message) === true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 5: RNG Pool Messages Classified Correctly
   * 
   * isRngPoolMessage returns false for non-RNG messages.
   * 
   * **Validates: Requirements 5.1, 5.2, 5.3**
   */
  it('Property 5f: isRngPoolMessage returns false for non-RNG messages', () => {
    fc.assert(
      fc.property(nonRngMessageArb, (message) => {
        return isRngPoolMessage(message) === false;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 5: RNG Pool Messages Classified Correctly
   * 
   * areBothFromSameRngPool returns true only when both messages are from the same pool.
   * 
   * **Validates: Requirements 5.1, 5.2, 5.3**
   */
  it('Property 5g: areBothFromSameRngPool is symmetric', () => {
    fc.assert(
      fc.property(
        anyRngMessageArb,
        anyRngMessageArb,
        (msg1, msg2) => {
          const result1 = areBothFromSameRngPool(msg1, msg2);
          const result2 = areBothFromSameRngPool(msg2, msg1);
          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 2: All Differences Get Classified
   * 
   * Classification reason is always non-empty.
   * 
   * **Validates: Requirements 2.3**
   */
  it('Property 2c: Classification always includes a reason', () => {
    fc.assert(
      fc.property(
        fc.oneof(anyRngMessageArb, nonRngMessageArb),
        fc.oneof(anyRngMessageArb, nonRngMessageArb),
        basicContextArb,
        (tsOutput, zmOutput, context) => {
          const result = classify(tsOutput, zmOutput, context);
          return result.reason.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: final-100-percent-parity, Property 2: All Differences Get Classified
   * 
   * Non-RNG differences without state divergence are classified as LOGIC_DIFFERENCE.
   * 
   * **Validates: Requirements 2.3**
   */
  it('Property 2d: Non-RNG differences without divergence are LOGIC_DIFFERENCE', () => {
    const cleanContextArb = fc.record({
      command: fc.constantFrom('look', 'take lamp', 'open door'),
      commandIndex: fc.integer({ min: 0, max: 100 }),
      hasStateDiverged: fc.constant(false)
    });

    fc.assert(
      fc.property(
        nonRngMessageArb,
        nonRngMessageArb,
        cleanContextArb,
        (tsOutput, zmOutput, context) => {
          // Skip if outputs are identical
          if (tsOutput === zmOutput) {
            return true;
          }

          const result = classify(tsOutput, zmOutput, context);
          return result.classification === 'LOGIC_DIFFERENCE';
        }
      ),
      { numRuns: 100 }
    );
  });
});
