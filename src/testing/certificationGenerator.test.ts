/**
 * Unit tests for CertificationGenerator
 * 
 * Tests markdown output format, required sections, and version information.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CertificationGenerator,
  createCertificationGenerator,
  VersionInfo,
} from './certificationGenerator.js';
import { ParityResults } from './exhaustiveParityValidator.js';
import { ClassifiedDifference } from './differenceClassifier.js';

/**
 * Create mock parity results for testing
 */
function createMockParityResults(options: {
  passed?: boolean;
  logicDifferences?: number;
  rngDifferences?: number;
  stateDivergences?: number;
  totalTests?: number;
}): ParityResults {
  const {
    passed = true,
    logicDifferences = 0,
    rngDifferences = 5,
    stateDivergences = 2,
    totalTests = 3,
  } = options;

  const seedResults = new Map<number, {
    seed: number;
    totalCommands: number;
    matchingResponses: number;
    differences: ClassifiedDifference[];
    parityPercentage: number;
    executionTime: number;
    success: boolean;
  }>();

  // Create mock seed results
  const seeds = [12345, 67890, 54321].slice(0, totalTests);
  for (const seed of seeds) {
    const differences: ClassifiedDifference[] = [];
    
    // Add RNG differences
    for (let i = 0; i < Math.ceil(rngDifferences / totalTests); i++) {
      differences.push({
        commandIndex: i,
        command: 'hello',
        tsOutput: 'Hello.',
        zmOutput: 'Good day.',
        classification: 'RNG_DIFFERENCE',
        reason: 'Both outputs are from the HELLOS RNG pool',
      });
    }

    // Add state divergences
    for (let i = 0; i < Math.ceil(stateDivergences / totalTests); i++) {
      differences.push({
        commandIndex: i + 10,
        command: 'north',
        tsOutput: "You can't go that way.",
        zmOutput: 'Kitchen',
        classification: 'STATE_DIVERGENCE',
        reason: 'Game states have diverged due to accumulated RNG effects',
      });
    }

    // Add logic differences
    for (let i = 0; i < Math.ceil(logicDifferences / totalTests); i++) {
      differences.push({
        commandIndex: i + 20,
        command: 'examine sword',
        tsOutput: 'A shiny sword.',
        zmOutput: 'A gleaming sword.',
        classification: 'LOGIC_DIFFERENCE',
        reason: 'Difference cannot be attributed to RNG or state divergence',
      });
    }

    seedResults.set(seed, {
      seed,
      totalCommands: 100,
      matchingResponses: 100 - differences.length,
      differences,
      parityPercentage: ((100 - differences.length) / 100) * 100,
      executionTime: 1000,
      success: true,
    });
  }

  return {
    totalTests,
    totalDifferences: rngDifferences + stateDivergences + logicDifferences,
    rngDifferences,
    stateDivergences,
    logicDifferences,
    seedResults,
    overallParityPercentage: 95.5,
    totalExecutionTime: 3000,
    passed,
    summary: passed ? 'All tests passed' : 'Tests failed',
  };
}

describe('CertificationGenerator', () => {
  let generator: CertificationGenerator;
  let mockVersionInfo: VersionInfo;

  beforeEach(() => {
    generator = createCertificationGenerator();
    mockVersionInfo = {
      packageVersion: '1.0.0',
      nodeVersion: 'v20.10.0',
    };
  });

  describe('generate()', () => {
    it('should generate valid markdown output', () => {
      const results = createMockParityResults({ passed: true });
      const certification = generator.generate(results, mockVersionInfo);

      // Should be a non-empty string
      expect(certification).toBeTruthy();
      expect(typeof certification).toBe('string');
      
      // Should start with a markdown header
      expect(certification).toMatch(/^# /);
    });

    it('should include all required sections for passed certification', () => {
      const results = createMockParityResults({ passed: true });
      const certification = generator.generate(results, mockVersionInfo);

      // Requirement 6.1: Generate certification document
      expect(certification).toContain('# Zork I TypeScript Implementation - Parity Certification');
      
      // Executive Summary
      expect(certification).toContain('## Executive Summary');
      expect(certification).toContain('CERTIFICATION: 100% LOGIC PARITY ACHIEVED');

      // Requirement 6.2: Test results from all seeds
      expect(certification).toContain('## Test Results by Seed');
      expect(certification).toContain('Total Seeds Tested:');

      // Requirement 6.3: Difference classification breakdown
      expect(certification).toContain('## Difference Classification Breakdown');
      expect(certification).toContain('RNG Differences');
      expect(certification).toContain('State Divergences');
      expect(certification).toContain('Logic Differences');

      // Requirement 6.4: Timestamp and version information
      expect(certification).toContain('## Version Information');
      expect(certification).toContain('Package Version');
      expect(certification).toContain('Certification Date');
      expect(certification).toContain('Certification ID');

      // Requirement 6.5: Zero logic differences confirmation
      expect(certification).toContain('## Logic Difference Confirmation');
      expect(certification).toContain('Zero Logic Differences Confirmed');
    });

    it('should include failed certification message when logic differences exist', () => {
      const results = createMockParityResults({ 
        passed: false, 
        logicDifferences: 3 
      });
      const certification = generator.generate(results, mockVersionInfo);

      expect(certification).toContain('CERTIFICATION FAILED');
      expect(certification).toContain('Logic Differences Detected');
      expect(certification).toContain('3 logic difference(s)');
    });

    it('should include seed results table', () => {
      const results = createMockParityResults({ passed: true, totalTests: 3 });
      const certification = generator.generate(results, mockVersionInfo);

      // Should have table headers
      expect(certification).toContain('| Seed |');
      expect(certification).toContain('| Commands |');
      expect(certification).toContain('| Parity % |');
      
      // Should include seed numbers
      expect(certification).toContain('12345');
      expect(certification).toContain('67890');
      expect(certification).toContain('54321');
    });

    it('should include classification breakdown with counts', () => {
      const results = createMockParityResults({
        passed: true,
        rngDifferences: 10,
        stateDivergences: 5,
        logicDifferences: 0,
      });
      const certification = generator.generate(results, mockVersionInfo);

      expect(certification).toContain('| RNG Differences |');
      expect(certification).toContain('| State Divergences |');
      expect(certification).toContain('| Logic Differences |');
      expect(certification).toContain('**Total Differences:** 15');
    });
  });

  describe('timestamp and version inclusion', () => {
    it('should include timestamp in certification', () => {
      const results = createMockParityResults({ passed: true });
      const certification = generator.generate(results, mockVersionInfo);

      // Should have Generated timestamp
      expect(certification).toContain('**Generated:**');
      
      // Should have Certification Date in version section
      expect(certification).toContain('Certification Date');
    });

    it('should include version information', () => {
      const results = createMockParityResults({ passed: true });
      const certification = generator.generate(results, mockVersionInfo);

      expect(certification).toContain('1.0.0');
      expect(certification).toContain('v20.10.0');
    });

    it('should generate unique certification ID', () => {
      const results = createMockParityResults({ passed: true });
      const certification = generator.generate(results, mockVersionInfo);

      // Should contain certification ID pattern
      expect(certification).toMatch(/ZORK-PARITY-\d+\.\d+\.\d+-\d{8}-\d{6}/);
    });

    it('should include TypeScript version when provided', () => {
      const versionWithTs: VersionInfo = {
        ...mockVersionInfo,
        typescriptVersion: '5.3.0',
      };
      const results = createMockParityResults({ passed: true });
      const certification = generator.generate(results, versionWithTs);

      expect(certification).toContain('TypeScript Version');
      expect(certification).toContain('5.3.0');
    });
  });

  describe('markdown format validation', () => {
    it('should use proper markdown headers', () => {
      const results = createMockParityResults({ passed: true });
      const certification = generator.generate(results, mockVersionInfo);

      // Should have h1 header
      expect(certification).toMatch(/^# /m);
      
      // Should have h2 headers for sections
      expect(certification).toMatch(/^## Executive Summary$/m);
      expect(certification).toMatch(/^## Test Results by Seed$/m);
      expect(certification).toMatch(/^## Difference Classification Breakdown$/m);
      expect(certification).toMatch(/^## Logic Difference Confirmation$/m);
      expect(certification).toMatch(/^## Version Information$/m);
    });

    it('should use proper markdown tables', () => {
      const results = createMockParityResults({ passed: true });
      const certification = generator.generate(results, mockVersionInfo);

      // Tables should have header separator row
      expect(certification).toMatch(/\|[-|]+\|/);
    });

    it('should include methodology section', () => {
      const results = createMockParityResults({ passed: true });
      const certification = generator.generate(results, mockVersionInfo);

      expect(certification).toContain('## Methodology');
      expect(certification).toContain('Multi-Seed Testing');
      expect(certification).toContain('Extended Sequences');
      expect(certification).toContain('Difference Classification');
    });
  });

  describe('options handling', () => {
    it('should use custom title when provided', () => {
      const customGenerator = createCertificationGenerator({
        title: 'Custom Certification Title',
      });
      const results = createMockParityResults({ passed: true });
      const certification = customGenerator.generate(results, mockVersionInfo);

      expect(certification).toContain('# Custom Certification Title');
    });

    it('should include notes when provided', () => {
      const customGenerator = createCertificationGenerator({
        notes: ['Note 1', 'Note 2'],
      });
      const results = createMockParityResults({ passed: true });
      const certification = customGenerator.generate(results, mockVersionInfo);

      expect(certification).toContain('## Additional Notes');
      expect(certification).toContain('Note 1');
      expect(certification).toContain('Note 2');
    });

    it('should respect includeDetailedResults option', () => {
      const noDetailsGenerator = createCertificationGenerator({
        includeDetailedResults: false,
      });
      const results = createMockParityResults({ passed: true });
      const certification = noDetailsGenerator.generate(results, mockVersionInfo);

      // Should not have detailed seed results table
      expect(certification).not.toContain('### Detailed Seed Results');
    });
  });

  describe('edge cases', () => {
    it('should handle zero differences', () => {
      const results = createMockParityResults({
        passed: true,
        rngDifferences: 0,
        stateDivergences: 0,
        logicDifferences: 0,
      });
      const certification = generator.generate(results, mockVersionInfo);

      expect(certification).toContain('**Total Differences:** 0');
      expect(certification).toContain('Zero Logic Differences Confirmed');
    });

    it('should handle single seed test', () => {
      const results = createMockParityResults({
        passed: true,
        totalTests: 1,
      });
      const certification = generator.generate(results, mockVersionInfo);

      expect(certification).toContain('**Total Seeds Tested:** 1');
    });

    it('should truncate long output strings', () => {
      const results = createMockParityResults({
        passed: false,
        logicDifferences: 1,
      });
      
      // Modify the difference to have long output
      const seedResult = results.seedResults.get(12345);
      if (seedResult) {
        const logicDiff = seedResult.differences.find(
          d => d.classification === 'LOGIC_DIFFERENCE'
        );
        if (logicDiff) {
          logicDiff.tsOutput = 'A'.repeat(200);
          logicDiff.zmOutput = 'B'.repeat(200);
        }
      }

      const certification = generator.generate(results, mockVersionInfo);
      
      // Should contain truncated output with ellipsis
      expect(certification).toContain('...');
    });
  });
});
