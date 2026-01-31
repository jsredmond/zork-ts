/**
 * Property-Based Tests for Vocabulary Comparator Set Operations
 *
 * These tests verify that the set operations used in vocabulary comparison
 * are mathematically correct. They use fast-check to generate random sets
 * and verify that set difference, intersection, and union operations
 * satisfy their mathematical properties.
 *
 * Feature: vocabulary-completeness-audit
 *
 * **Validates: Requirements 4.1, 4.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { setDifference, setIntersection, setUnion } from './comparator';

describe('Vocabulary Comparator Property Tests', () => {
  /**
   * Generator for random sets of strings.
   * Generates sets with 0-50 elements, each element being a lowercase word.
   */
  const stringSetArb = fc
    .array(fc.string({ minLength: 1, maxLength: 20 }).map((s) => s.toLowerCase()), {
      minLength: 0,
      maxLength: 50,
    })
    .map((arr) => new Set(arr));

  /**
   * Generator for random sets of vocabulary-like words.
   * Uses a more realistic word pattern (lowercase letters only).
   */
  const vocabularySetArb = fc
    .array(
      fc.stringMatching(/^[a-z]{1,15}$/),
      { minLength: 0, maxLength: 50 }
    )
    .map((arr) => new Set(arr));

  /**
   * Feature: vocabulary-completeness-audit
   * Property 3: Vocabulary Comparison Set Difference
   *
   * *For any* two vocabulary sets A and B, the comparison function must correctly compute:
   * - `missingInB = A - B` (words in A but not in B)
   * - `extraInB = B - A` (words in B but not in A)
   *
   * The union of `missingInB`, `extraInB`, and `A ∩ B` must equal `A ∪ B`.
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it('Property 3: Set difference, intersection, and union partition correctly', () => {
    fc.assert(
      fc.property(vocabularySetArb, vocabularySetArb, (setA: Set<string>, setB: Set<string>) => {
        // Compute set operations
        const missingInB = setDifference(setA, setB); // A - B
        const extraInB = setDifference(setB, setA); // B - A
        const intersection = setIntersection(setA, setB); // A ∩ B
        const union = setUnion(setA, setB); // A ∪ B

        // Property: The union of (A - B), (B - A), and (A ∩ B) must equal (A ∪ B)
        const reconstructedUnion = setUnion(setUnion(missingInB, extraInB), intersection);

        // Check that reconstructed union equals the actual union
        if (reconstructedUnion.size !== union.size) {
          return false;
        }

        for (const element of union) {
          if (!reconstructedUnion.has(element)) {
            return false;
          }
        }

        for (const element of reconstructedUnion) {
          if (!union.has(element)) {
            return false;
          }
        }

        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Property 3a: Set difference correctness - missingInB contains only elements from A not in B
   *
   * For any element x in (A - B):
   * - x must be in A
   * - x must NOT be in B
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it('Property 3a: Set difference (A - B) contains only elements in A but not in B', () => {
    fc.assert(
      fc.property(vocabularySetArb, vocabularySetArb, (setA: Set<string>, setB: Set<string>) => {
        const difference = setDifference(setA, setB);

        // Every element in the difference must be in A
        for (const element of difference) {
          if (!setA.has(element)) {
            return false;
          }
        }

        // No element in the difference should be in B
        for (const element of difference) {
          if (setB.has(element)) {
            return false;
          }
        }

        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Property 3b: Set difference completeness - all elements in A not in B are in (A - B)
   *
   * For any element x in A where x is not in B:
   * - x must be in (A - B)
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it('Property 3b: Set difference (A - B) contains all elements in A that are not in B', () => {
    fc.assert(
      fc.property(vocabularySetArb, vocabularySetArb, (setA: Set<string>, setB: Set<string>) => {
        const difference = setDifference(setA, setB);

        // Every element in A that is not in B must be in the difference
        for (const element of setA) {
          if (!setB.has(element)) {
            if (!difference.has(element)) {
              return false;
            }
          }
        }

        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Property 3c: Set intersection correctness - intersection contains only common elements
   *
   * For any element x in (A ∩ B):
   * - x must be in A
   * - x must be in B
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it('Property 3c: Set intersection (A ∩ B) contains only elements in both A and B', () => {
    fc.assert(
      fc.property(vocabularySetArb, vocabularySetArb, (setA: Set<string>, setB: Set<string>) => {
        const intersection = setIntersection(setA, setB);

        // Every element in the intersection must be in both A and B
        for (const element of intersection) {
          if (!setA.has(element) || !setB.has(element)) {
            return false;
          }
        }

        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Property 3d: Set union correctness - union contains all elements from both sets
   *
   * For any element x in (A ∪ B):
   * - x must be in A OR x must be in B
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it('Property 3d: Set union (A ∪ B) contains all elements from A and B', () => {
    fc.assert(
      fc.property(vocabularySetArb, vocabularySetArb, (setA: Set<string>, setB: Set<string>) => {
        const union = setUnion(setA, setB);

        // Every element in the union must be in A or B
        for (const element of union) {
          if (!setA.has(element) && !setB.has(element)) {
            return false;
          }
        }

        // Every element in A must be in the union
        for (const element of setA) {
          if (!union.has(element)) {
            return false;
          }
        }

        // Every element in B must be in the union
        for (const element of setB) {
          if (!union.has(element)) {
            return false;
          }
        }

        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Property 3e: Disjoint partition property
   *
   * The sets (A - B), (B - A), and (A ∩ B) must be pairwise disjoint.
   * No element should appear in more than one of these sets.
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it('Property 3e: (A - B), (B - A), and (A ∩ B) are pairwise disjoint', () => {
    fc.assert(
      fc.property(vocabularySetArb, vocabularySetArb, (setA: Set<string>, setB: Set<string>) => {
        const aMinusB = setDifference(setA, setB);
        const bMinusA = setDifference(setB, setA);
        const intersection = setIntersection(setA, setB);

        // (A - B) and (B - A) must be disjoint
        for (const element of aMinusB) {
          if (bMinusA.has(element)) {
            return false;
          }
        }

        // (A - B) and (A ∩ B) must be disjoint
        for (const element of aMinusB) {
          if (intersection.has(element)) {
            return false;
          }
        }

        // (B - A) and (A ∩ B) must be disjoint
        for (const element of bMinusA) {
          if (intersection.has(element)) {
            return false;
          }
        }

        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Property 3f: Size relationship property
   *
   * |A ∪ B| = |A - B| + |B - A| + |A ∩ B|
   *
   * The size of the union equals the sum of the sizes of the three disjoint partitions.
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it('Property 3f: |A ∪ B| = |A - B| + |B - A| + |A ∩ B|', () => {
    fc.assert(
      fc.property(vocabularySetArb, vocabularySetArb, (setA: Set<string>, setB: Set<string>) => {
        const aMinusB = setDifference(setA, setB);
        const bMinusA = setDifference(setB, setA);
        const intersection = setIntersection(setA, setB);
        const union = setUnion(setA, setB);

        // The size relationship must hold
        const expectedUnionSize = aMinusB.size + bMinusA.size + intersection.size;
        return union.size === expectedUnionSize;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Edge case: Empty sets
   *
   * Verify that set operations work correctly with empty sets.
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it('Edge case: Set operations with empty sets', () => {
    const emptySet = new Set<string>();
    const nonEmptySet = new Set(['a', 'b', 'c']);

    // Empty - Empty = Empty
    expect(setDifference(emptySet, emptySet).size).toBe(0);

    // NonEmpty - Empty = NonEmpty
    const diffNonEmptyEmpty = setDifference(nonEmptySet, emptySet);
    expect(diffNonEmptyEmpty.size).toBe(nonEmptySet.size);
    for (const element of nonEmptySet) {
      expect(diffNonEmptyEmpty.has(element)).toBe(true);
    }

    // Empty - NonEmpty = Empty
    expect(setDifference(emptySet, nonEmptySet).size).toBe(0);

    // Empty ∩ NonEmpty = Empty
    expect(setIntersection(emptySet, nonEmptySet).size).toBe(0);

    // Empty ∪ NonEmpty = NonEmpty
    const unionEmptyNonEmpty = setUnion(emptySet, nonEmptySet);
    expect(unionEmptyNonEmpty.size).toBe(nonEmptySet.size);
    for (const element of nonEmptySet) {
      expect(unionEmptyNonEmpty.has(element)).toBe(true);
    }
  });

  /**
   * Edge case: Identical sets
   *
   * Verify that set operations work correctly when both sets are identical.
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it('Edge case: Set operations with identical sets', () => {
    fc.assert(
      fc.property(vocabularySetArb, (setA: Set<string>) => {
        // Create a copy of setA
        const setB = new Set(setA);

        // A - A = Empty
        const difference = setDifference(setA, setB);
        if (difference.size !== 0) {
          return false;
        }

        // A ∩ A = A
        const intersection = setIntersection(setA, setB);
        if (intersection.size !== setA.size) {
          return false;
        }
        for (const element of setA) {
          if (!intersection.has(element)) {
            return false;
          }
        }

        // A ∪ A = A
        const union = setUnion(setA, setB);
        if (union.size !== setA.size) {
          return false;
        }
        for (const element of setA) {
          if (!union.has(element)) {
            return false;
          }
        }

        return true;
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Edge case: Completely disjoint sets
   *
   * Verify that set operations work correctly when sets have no common elements.
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it('Edge case: Set operations with disjoint sets', () => {
    // Create two disjoint sets
    const setA = new Set(['a', 'b', 'c']);
    const setB = new Set(['x', 'y', 'z']);

    // A - B = A (since no overlap)
    const aMinusB = setDifference(setA, setB);
    expect(aMinusB.size).toBe(setA.size);
    for (const element of setA) {
      expect(aMinusB.has(element)).toBe(true);
    }

    // B - A = B (since no overlap)
    const bMinusA = setDifference(setB, setA);
    expect(bMinusA.size).toBe(setB.size);
    for (const element of setB) {
      expect(bMinusA.has(element)).toBe(true);
    }

    // A ∩ B = Empty (since no overlap)
    const intersection = setIntersection(setA, setB);
    expect(intersection.size).toBe(0);

    // A ∪ B = A + B (since no overlap)
    const union = setUnion(setA, setB);
    expect(union.size).toBe(setA.size + setB.size);
  });

  /**
   * Meta-test: Verify property test configuration
   */
  it('Meta: Property tests run with sufficient iterations', () => {
    // This test verifies that our property tests are configured correctly
    // by checking that we can generate diverse sets
    let uniqueSets = 0;
    const seenSizes = new Set<number>();

    fc.assert(
      fc.property(vocabularySetArb, (set: Set<string>) => {
        uniqueSets++;
        seenSizes.add(set.size);
        return true;
      }),
      {
        numRuns: 100,
      }
    );

    // We should see a variety of set sizes
    expect(seenSizes.size).toBeGreaterThan(5);
    console.log(`Generated ${uniqueSets} sets with ${seenSizes.size} different sizes`);
  });
});
