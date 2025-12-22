/**
 * Unit tests for ReportGenerator
 * 
 * Tests report generation in all formats (text, JSON, markdown, HTML)
 * for both single diff reports and batch results.
 * 
 * Requirements: 4.3, 4.4
 */

import { describe, it, expect } from 'vitest';
import { ReportGenerator, createReportGenerator } from './reportGenerator.js';
import { DiffReport } from './types.js';
import { DetailedBatchResult } from './batchRunner.js';

describe('ReportGenerator', () => {
  let generator: ReportGenerator;

  const createMockDiffReport = (): DiffReport => ({
    transcriptA: 'zm-test-001',
    transcriptB: 'ts-test-001',
    totalCommands: 10,
    exactMatches: 7,
    closeMatches: 1,
    differences: [
      {
        index: 3,
        command: 'look',
        expected: 'West of House\nYou are standing in an open field.',
        actual: 'West of House\nYou are in an open field.',
        similarity: 0.85,
        severity: 'minor',
        category: 'room description'
      },
      {
        index: 7,
        command: 'take sword',
        expected: 'Taken.',
        actual: 'You pick up the sword.',
        similarity: 0.3,
        severity: 'major',
        category: 'object manipulation'
      }
    ],
    parityScore: 80,
    summary: {
      critical: 0,
      major: 1,
      minor: 1,
      formatting: 0
    }
  });

  const createMockBatchResult = (): DetailedBatchResult => ({
    sequences: [
      { id: 'seq1', name: 'Basic Exploration', parityScore: 95, diffCount: 1, executionTime: 100 },
      { id: 'seq2', name: 'Object Manipulation', parityScore: 75, diffCount: 5, executionTime: 150 },
      { id: 'seq3', name: 'Combat Test', parityScore: 60, diffCount: 8, executionTime: 200 }
    ],
    aggregateParityScore: 76.67,
    totalDifferences: 14,
    worstSequences: ['seq3', 'seq2'],
    detailedResults: [
      { id: 'seq1', name: 'Basic Exploration', parityScore: 95, diffCount: 1, executionTime: 100, success: true },
      { id: 'seq2', name: 'Object Manipulation', parityScore: 75, diffCount: 5, executionTime: 150, success: true },
      { id: 'seq3', name: 'Combat Test', parityScore: 60, diffCount: 8, executionTime: 200, success: true, error: undefined }
    ],
    totalExecutionTime: 450,
    successCount: 3,
    failureCount: 0
  });

  beforeEach(() => {
    generator = new ReportGenerator();
  });

  describe('generate (single report)', () => {
    describe('text format', () => {
      it('should generate plain text report', () => {
        const report = createMockDiffReport();
        const output = generator.generate(report, 'text');

        expect(output).toContain('TRANSCRIPT COMPARISON REPORT');
        expect(output).toContain('zm-test-001');
        expect(output).toContain('ts-test-001');
        expect(output).toContain('Total Commands:  10');
        expect(output).toContain('Exact Matches:   7');
        expect(output).toContain('Parity Score:    80.00%');
        expect(output).toContain('Critical:   0');
        expect(output).toContain('Major:      1');
        expect(output).toContain('Minor:      1');
      });

      it('should include differences in text report', () => {
        const report = createMockDiffReport();
        const output = generator.generate(report, 'text');

        expect(output).toContain('[3] Command: look');
        expect(output).toContain('Severity: MINOR');
        expect(output).toContain('[7] Command: take sword');
        expect(output).toContain('Severity: MAJOR');
      });
    });

    describe('json format', () => {
      it('should generate valid JSON report', () => {
        const report = createMockDiffReport();
        const output = generator.generate(report, 'json');

        const parsed = JSON.parse(output);
        expect(parsed.transcriptA).toBe('zm-test-001');
        expect(parsed.transcriptB).toBe('ts-test-001');
        expect(parsed.totalCommands).toBe(10);
        expect(parsed.parityScore).toBe(80);
        expect(parsed.differences).toHaveLength(2);
      });

      it('should preserve all report fields in JSON', () => {
        const report = createMockDiffReport();
        const output = generator.generate(report, 'json');

        const parsed = JSON.parse(output);
        expect(parsed.summary.critical).toBe(0);
        expect(parsed.summary.major).toBe(1);
        expect(parsed.differences[0].severity).toBe('minor');
        expect(parsed.differences[1].category).toBe('object manipulation');
      });
    });

    describe('markdown format', () => {
      it('should generate markdown report with tables', () => {
        const report = createMockDiffReport();
        const output = generator.generate(report, 'markdown');

        expect(output).toContain('# Transcript Comparison Report');
        expect(output).toContain('| Metric | Value |');
        expect(output).toContain('| Total Commands | 10 |');
        expect(output).toContain('| **Parity Score** | **80.00%** |');
      });

      it('should include detailed differences in markdown', () => {
        const report = createMockDiffReport();
        const output = generator.generate(report, 'markdown');

        expect(output).toContain('## Detailed Differences');
        expect(output).toContain('### [3] `look`');
        expect(output).toContain('- **Severity:** minor');
        expect(output).toContain('**Expected:**');
        expect(output).toContain('**Actual:**');
      });
    });

    describe('html format', () => {
      it('should generate valid HTML report', () => {
        const report = createMockDiffReport();
        const output = generator.generate(report, 'html');

        expect(output).toContain('<!DOCTYPE html>');
        expect(output).toContain('<html lang="en">');
        expect(output).toContain('<title>Transcript Comparison Report</title>');
        expect(output).toContain('</html>');
      });

      it('should include summary section in HTML', () => {
        const report = createMockDiffReport();
        const output = generator.generate(report, 'html');

        expect(output).toContain('class="summary"');
        expect(output).toContain('zm-test-001');
        expect(output).toContain('80.00%');
      });

      it('should include severity badges in HTML', () => {
        const report = createMockDiffReport();
        const output = generator.generate(report, 'html');

        expect(output).toContain('severity-badge minor');
        expect(output).toContain('severity-badge major');
      });

      it('should escape HTML special characters', () => {
        const report = createMockDiffReport();
        report.differences[0].expected = '<script>alert("xss")</script>';
        const output = generator.generate(report, 'html');

        expect(output).not.toContain('<script>');
        expect(output).toContain('&lt;script&gt;');
      });
    });

    it('should throw error for unsupported format', () => {
      const report = createMockDiffReport();
      expect(() => generator.generate(report, 'xml' as any)).toThrow('Unsupported format');
    });
  });

  describe('generateBatchReport', () => {
    describe('text format', () => {
      it('should generate plain text batch report', () => {
        const result = createMockBatchResult();
        const output = generator.generateBatchReport(result, 'text');

        expect(output).toContain('BATCH COMPARISON REPORT');
        expect(output).toContain('Total Sequences:     3');
        expect(output).toContain('Successful:          3');
        expect(output).toContain('Failed:              0');
        expect(output).toContain('Total Differences:   14');
      });

      it('should list worst sequences in text report', () => {
        const result = createMockBatchResult();
        const output = generator.generateBatchReport(result, 'text');

        expect(output).toContain('Worst Sequences:');
        expect(output).toContain('seq3');
        expect(output).toContain('seq2');
      });

      it('should list all sequence results', () => {
        const result = createMockBatchResult();
        const output = generator.generateBatchReport(result, 'text');

        expect(output).toContain('Basic Exploration');
        expect(output).toContain('Object Manipulation');
        expect(output).toContain('Combat Test');
      });
    });

    describe('json format', () => {
      it('should generate valid JSON batch report', () => {
        const result = createMockBatchResult();
        const output = generator.generateBatchReport(result, 'json');

        const parsed = JSON.parse(output);
        expect(parsed.sequences).toHaveLength(3);
        expect(parsed.aggregateParityScore).toBe(76.67);
        expect(parsed.totalDifferences).toBe(14);
      });
    });

    describe('markdown format', () => {
      it('should generate markdown batch report with tables', () => {
        const result = createMockBatchResult();
        const output = generator.generateBatchReport(result, 'markdown');

        expect(output).toContain('# Batch Comparison Report');
        expect(output).toContain('| Total Sequences | 3 |');
        expect(output).toContain('| **Aggregate Parity** | **76.67%** |');
        expect(output).toContain('## Sequence Results');
      });
    });

    describe('html format', () => {
      it('should generate valid HTML batch report', () => {
        const result = createMockBatchResult();
        const output = generator.generateBatchReport(result, 'html');

        expect(output).toContain('<!DOCTYPE html>');
        expect(output).toContain('<title>Batch Comparison Report</title>');
        expect(output).toContain('class="stats-grid"');
      });

      it('should include sequence results table', () => {
        const result = createMockBatchResult();
        const output = generator.generateBatchReport(result, 'html');

        expect(output).toContain('Basic Exploration');
        expect(output).toContain('Object Manipulation');
        expect(output).toContain('Combat Test');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty differences array', () => {
      const report: DiffReport = {
        transcriptA: 'a',
        transcriptB: 'b',
        totalCommands: 5,
        exactMatches: 5,
        closeMatches: 0,
        differences: [],
        parityScore: 100,
        summary: { critical: 0, major: 0, minor: 0, formatting: 0 }
      };

      const textOutput = generator.generate(report, 'text');
      expect(textOutput).not.toContain('DIFFERENCES');

      const mdOutput = generator.generate(report, 'markdown');
      expect(mdOutput).not.toContain('## Detailed Differences');
    });

    it('should handle report with all severity types', () => {
      const report = createMockDiffReport();
      report.differences.push(
        { index: 1, command: 'test', expected: 'a', actual: 'b', similarity: 0, severity: 'critical', category: 'test' },
        { index: 2, command: 'test', expected: 'a ', actual: 'a', similarity: 0.99, severity: 'formatting', category: 'test' }
      );
      report.summary = { critical: 1, major: 1, minor: 1, formatting: 1 };

      const output = generator.generate(report, 'text');
      expect(output).toContain('Critical:   1');
      expect(output).toContain('Major:      1');
      expect(output).toContain('Minor:      1');
      expect(output).toContain('Formatting: 1');
    });
  });
});

describe('createReportGenerator', () => {
  it('should create a ReportGenerator instance', () => {
    const generator = createReportGenerator();
    expect(generator).toBeInstanceOf(ReportGenerator);
  });
});
