/**
 * Property-Based Tests for Ambiguity Resolution Consistency
 * 
 * These tests verify universal properties that should hold for all valid inputs.
 * 
 * Feature: achieve-99-percent-parity, Property 9: Ambiguity Resolution Consistency
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ParserFeedback } from '../parser/feedback';

describe('Ambiguity Resolution Property Tests', () => {
  const feedback = new ParserFeedback();

  // ============================================================================
  // PROPERTY 9: AMBIGUITY RESOLUTION CONSISTENCY
  // ============================================================================

  /**
   * Feature: achieve-99-percent-parity, Property 9: Ambiguity Resolution Consistency
   * 
   * For any ambiguous command, the disambiguation prompt SHALL match Z-Machine format exactly.
   * Two-object ambiguity SHALL use "Which X do you mean, the Y or the Z?" format.
   * Multi-object ambiguity SHALL use "Which X do you mean?" format.
   * 
   * **Validates: Requirements 8.1, 8.2, 8.3**
   */

  /**
   * Generator for object type names
   */
  const objectTypeArb = fc.constantFrom(
    'sword',
    'lamp',
    'key',
    'door',
    'button',
    'box',
    'book',
    'coin'
  );

  /**
   * Generator for candidate names
   */
  const candidateArb = fc.constantFrom(
    'rusty sword',
    'elvish sword',
    'brass lamp',
    'old lamp',
    'skeleton key',
    'golden key',
    'wooden door',
    'iron door',
    'red button',
    'blue button'
  );

  /**
   * Property 9a: Two-object ambiguity uses correct format
   * 
   * For any two candidates, the message SHALL follow the format
   * "Which X do you mean, the Y or the Z?"
   * 
   * **Validates: Requirements 8.1**
   */
  it('Property 9a: Two-object ambiguity uses correct format', () => {
    fc.assert(
      fc.property(objectTypeArb, candidateArb, candidateArb, (objectType, candidate1, candidate2) => {
        // Skip if candidates are the same
        if (candidate1 === candidate2) {
          return true;
        }

        const message = feedback.getAmbiguityError(objectType, [candidate1, candidate2]);
        
        // Message should follow exact format: "Which X do you mean, the Y or the Z?"
        const expectedPattern = /^Which .+ do you mean, the .+ or the .+\?$/;
        return expectedPattern.test(message);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9b: Two-object ambiguity contains both candidates
   * 
   * For any two candidates, the message SHALL contain both candidate names.
   * 
   * **Validates: Requirements 8.1**
   */
  it('Property 9b: Two-object ambiguity contains both candidates', () => {
    fc.assert(
      fc.property(objectTypeArb, candidateArb, candidateArb, (objectType, candidate1, candidate2) => {
        // Skip if candidates are the same
        if (candidate1 === candidate2) {
          return true;
        }

        const message = feedback.getAmbiguityError(objectType, [candidate1, candidate2]);
        
        // Message should contain both candidates
        return message.includes(candidate1) && message.includes(candidate2);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9c: Multi-object ambiguity (3+) uses correct format
   * 
   * For more than two candidates, the message SHALL list all candidates
   * with proper comma separation and "or" before the last one.
   * 
   * **Validates: Requirements 8.2**
   */
  it('Property 9c: Multi-object ambiguity (3+) uses correct format', () => {
    const threeCandidatesArb = fc.tuple(candidateArb, candidateArb, candidateArb)
      .filter(([a, b, c]) => a !== b && b !== c && a !== c);

    fc.assert(
      fc.property(objectTypeArb, threeCandidatesArb, (objectType, [c1, c2, c3]) => {
        const message = feedback.getAmbiguityError(objectType, [c1, c2, c3]);
        
        // Message should follow format with commas and "or"
        // "Which X do you mean, the Y, the Z, or the W?"
        const expectedPattern = /^Which .+ do you mean, the .+, the .+, or the .+\?$/;
        return expectedPattern.test(message);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9d: Multi-object ambiguity contains all candidates
   * 
   * For more than two candidates, the message SHALL contain all candidate names.
   * 
   * **Validates: Requirements 8.2**
   */
  it('Property 9d: Multi-object ambiguity contains all candidates', () => {
    const threeCandidatesArb = fc.tuple(candidateArb, candidateArb, candidateArb)
      .filter(([a, b, c]) => a !== b && b !== c && a !== c);

    fc.assert(
      fc.property(objectTypeArb, threeCandidatesArb, (objectType, [c1, c2, c3]) => {
        const message = feedback.getAmbiguityError(objectType, [c1, c2, c3]);
        
        // Message should contain all candidates
        return message.includes(c1) && message.includes(c2) && message.includes(c3);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9e: Zero candidates uses simple format
   * 
   * For zero candidates, the message SHALL use "Which X do you mean?" format.
   * 
   * **Validates: Requirements 8.2**
   */
  it('Property 9e: Zero candidates uses simple format', () => {
    fc.assert(
      fc.property(objectTypeArb, (objectType) => {
        const message = feedback.getAmbiguityError(objectType, []);
        
        // Message should follow simple format
        return message === `Which ${objectType} do you mean?`;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9f: One candidate uses correct format
   * 
   * For one candidate, the message SHALL use "Which X do you mean, the Y?" format.
   * 
   * **Validates: Requirements 8.1**
   */
  it('Property 9f: One candidate uses correct format', () => {
    fc.assert(
      fc.property(objectTypeArb, candidateArb, (objectType, candidate) => {
        const message = feedback.getAmbiguityError(objectType, [candidate]);
        
        // Message should follow format with single candidate
        return message === `Which ${objectType} do you mean, the ${candidate}?`;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9g: Ambiguity messages are deterministic
   * 
   * For any set of candidates, calling getAmbiguityError multiple times
   * SHALL produce identical results.
   * 
   * **Validates: Requirements 8.1, 8.2**
   */
  it('Property 9g: Ambiguity messages are deterministic', () => {
    const candidatesArb = fc.array(candidateArb, { minLength: 0, maxLength: 5 });

    fc.assert(
      fc.property(objectTypeArb, candidatesArb, (objectType, candidates) => {
        const message1 = feedback.getAmbiguityError(objectType, candidates);
        const message2 = feedback.getAmbiguityError(objectType, candidates);
        
        return message1 === message2;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9h: Ambiguity messages always end with question mark
   * 
   * For any set of candidates, the message SHALL end with a question mark.
   * 
   * **Validates: Requirements 8.1, 8.2**
   */
  it('Property 9h: Ambiguity messages always end with question mark', () => {
    const candidatesArb = fc.array(candidateArb, { minLength: 0, maxLength: 5 });

    fc.assert(
      fc.property(objectTypeArb, candidatesArb, (objectType, candidates) => {
        const message = feedback.getAmbiguityError(objectType, candidates);
        
        return message.endsWith('?');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9i: Ambiguity messages always start with "Which"
   * 
   * For any set of candidates, the message SHALL start with "Which".
   * 
   * **Validates: Requirements 8.1, 8.2**
   */
  it('Property 9i: Ambiguity messages always start with "Which"', () => {
    const candidatesArb = fc.array(candidateArb, { minLength: 0, maxLength: 5 });

    fc.assert(
      fc.property(objectTypeArb, candidatesArb, (objectType, candidates) => {
        const message = feedback.getAmbiguityError(objectType, candidates);
        
        return message.startsWith('Which');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9j: Ambiguity messages contain object type
   * 
   * For any set of candidates, the message SHALL contain the object type.
   * 
   * **Validates: Requirements 8.1, 8.2**
   */
  it('Property 9j: Ambiguity messages contain object type', () => {
    const candidatesArb = fc.array(candidateArb, { minLength: 0, maxLength: 5 });

    fc.assert(
      fc.property(objectTypeArb, candidatesArb, (objectType, candidates) => {
        const message = feedback.getAmbiguityError(objectType, candidates);
        
        return message.includes(objectType);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9k: Two candidates use "or" separator
   * 
   * For exactly two candidates, the message SHALL use "or" to separate them.
   * 
   * **Validates: Requirements 8.1**
   */
  it('Property 9k: Two candidates use "or" separator', () => {
    fc.assert(
      fc.property(objectTypeArb, candidateArb, candidateArb, (objectType, candidate1, candidate2) => {
        // Skip if candidates are the same
        if (candidate1 === candidate2) {
          return true;
        }

        const message = feedback.getAmbiguityError(objectType, [candidate1, candidate2]);
        
        // Message should contain " or " separator
        return message.includes(' or ');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9l: Three+ candidates use comma and "or" separators
   * 
   * For three or more candidates, the message SHALL use commas and "or".
   * 
   * **Validates: Requirements 8.2**
   */
  it('Property 9l: Three+ candidates use comma and "or" separators', () => {
    const threeCandidatesArb = fc.tuple(candidateArb, candidateArb, candidateArb)
      .filter(([a, b, c]) => a !== b && b !== c && a !== c);

    fc.assert(
      fc.property(objectTypeArb, threeCandidatesArb, (objectType, [c1, c2, c3]) => {
        const message = feedback.getAmbiguityError(objectType, [c1, c2, c3]);
        
        // Message should contain commas and "or"
        return message.includes(', ') && message.includes(', or ');
      }),
      { numRuns: 100 }
    );
  });
});
