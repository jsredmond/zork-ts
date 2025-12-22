/**
 * ReportGenerator - Generates reports in multiple formats
 * 
 * This module provides functionality to generate human-readable and
 * machine-parseable reports from diff reports and batch results.
 * 
 * Requirements: 4.3, 4.4
 */

import {
  DiffReport,
  DiffEntry,
  ReportFormat,
} from './types.js';
import { DetailedBatchResult, DetailedSequenceResult } from './batchRunner.js';

/**
 * ReportGenerator creates reports in various formats from comparison results.
 * 
 * Supported formats:
 * - text: Plain text format for terminal output
 * - json: JSON format for machine parsing
 * - markdown: Markdown format for documentation
 * - html: HTML format for web viewing
 */
export class ReportGenerator {
  /**
   * Generate a report from a diff report
   * 
   * @param report - The diff report to format
   * @param format - Output format
   * @returns Formatted report string
   */
  generate(report: DiffReport, format: ReportFormat): string {
    switch (format) {
      case 'text':
        return this.generateText(report);
      case 'json':
        return this.generateJSON(report);
      case 'markdown':
        return this.generateMarkdown(report);
      case 'html':
        return this.generateHTML(report);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate a batch report from batch results
   * 
   * @param result - The batch result to format
   * @param format - Output format
   * @returns Formatted report string
   */
  generateBatchReport(result: DetailedBatchResult, format: ReportFormat): string {
    switch (format) {
      case 'text':
        return this.generateBatchText(result);
      case 'json':
        return this.generateBatchJSON(result);
      case 'markdown':
        return this.generateBatchMarkdown(result);
      case 'html':
        return this.generateBatchHTML(result);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // ============================================================================
  // Single Report Generators
  // ============================================================================

  /**
   * Generate plain text report
   */
  private generateText(report: DiffReport): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('TRANSCRIPT COMPARISON REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Transcript A: ${report.transcriptA}`);
    lines.push(`Transcript B: ${report.transcriptB}`);
    lines.push('');
    lines.push('-'.repeat(60));
    lines.push('SUMMARY');
    lines.push('-'.repeat(60));
    lines.push(`Total Commands:  ${report.totalCommands}`);
    lines.push(`Exact Matches:   ${report.exactMatches}`);
    lines.push(`Close Matches:   ${report.closeMatches}`);
    lines.push(`Differences:     ${report.differences.length}`);
    lines.push(`Parity Score:    ${report.parityScore.toFixed(2)}%`);
    lines.push('');
    lines.push('Differences by Severity:');
    lines.push(`  Critical:   ${report.summary.critical}`);
    lines.push(`  Major:      ${report.summary.major}`);
    lines.push(`  Minor:      ${report.summary.minor}`);
    lines.push(`  Formatting: ${report.summary.formatting}`);

    if (report.differences.length > 0) {
      lines.push('');
      lines.push('-'.repeat(60));
      lines.push('DIFFERENCES');
      lines.push('-'.repeat(60));

      for (const diff of report.differences) {
        lines.push('');
        lines.push(`[${diff.index}] Command: ${diff.command}`);
        lines.push(`    Severity: ${diff.severity.toUpperCase()}`);
        lines.push(`    Category: ${diff.category}`);
        lines.push(`    Similarity: ${(diff.similarity * 100).toFixed(1)}%`);
        lines.push('    Expected:');
        lines.push(this.indentText(diff.expected, '      '));
        lines.push('    Actual:');
        lines.push(this.indentText(diff.actual, '      '));
      }
    }

    lines.push('');
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  /**
   * Generate JSON report
   */
  private generateJSON(report: DiffReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdown(report: DiffReport): string {
    const lines: string[] = [];

    lines.push('# Transcript Comparison Report');
    lines.push('');
    lines.push('## Overview');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Transcript A | ${report.transcriptA} |`);
    lines.push(`| Transcript B | ${report.transcriptB} |`);
    lines.push(`| Total Commands | ${report.totalCommands} |`);
    lines.push(`| Exact Matches | ${report.exactMatches} |`);
    lines.push(`| Close Matches | ${report.closeMatches} |`);
    lines.push(`| Differences | ${report.differences.length} |`);
    lines.push(`| **Parity Score** | **${report.parityScore.toFixed(2)}%** |`);
    lines.push('');
    lines.push('## Differences by Severity');
    lines.push('');
    lines.push(`| Severity | Count |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Critical | ${report.summary.critical} |`);
    lines.push(`| Major | ${report.summary.major} |`);
    lines.push(`| Minor | ${report.summary.minor} |`);
    lines.push(`| Formatting | ${report.summary.formatting} |`);

    if (report.differences.length > 0) {
      lines.push('');
      lines.push('## Detailed Differences');
      lines.push('');

      for (const diff of report.differences) {
        lines.push(`### [${diff.index}] \`${diff.command}\``);
        lines.push('');
        lines.push(`- **Severity:** ${diff.severity}`);
        lines.push(`- **Category:** ${diff.category}`);
        lines.push(`- **Similarity:** ${(diff.similarity * 100).toFixed(1)}%`);
        lines.push('');
        lines.push('**Expected:**');
        lines.push('```');
        lines.push(diff.expected);
        lines.push('```');
        lines.push('');
        lines.push('**Actual:**');
        lines.push('```');
        lines.push(diff.actual);
        lines.push('```');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate HTML report
   */
  private generateHTML(report: DiffReport): string {
    const lines: string[] = [];

    lines.push('<!DOCTYPE html>');
    lines.push('<html lang="en">');
    lines.push('<head>');
    lines.push('  <meta charset="UTF-8">');
    lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    lines.push('  <title>Transcript Comparison Report</title>');
    lines.push('  <style>');
    lines.push(this.getHTMLStyles());
    lines.push('  </style>');
    lines.push('</head>');
    lines.push('<body>');
    lines.push('  <div class="container">');
    lines.push('    <h1>Transcript Comparison Report</h1>');
    lines.push('');
    lines.push('    <section class="summary">');
    lines.push('      <h2>Summary</h2>');
    lines.push('      <table>');
    lines.push('        <tr><th>Metric</th><th>Value</th></tr>');
    lines.push(`        <tr><td>Transcript A</td><td>${this.escapeHTML(report.transcriptA)}</td></tr>`);
    lines.push(`        <tr><td>Transcript B</td><td>${this.escapeHTML(report.transcriptB)}</td></tr>`);
    lines.push(`        <tr><td>Total Commands</td><td>${report.totalCommands}</td></tr>`);
    lines.push(`        <tr><td>Exact Matches</td><td>${report.exactMatches}</td></tr>`);
    lines.push(`        <tr><td>Close Matches</td><td>${report.closeMatches}</td></tr>`);
    lines.push(`        <tr><td>Differences</td><td>${report.differences.length}</td></tr>`);
    lines.push(`        <tr class="highlight"><td>Parity Score</td><td>${report.parityScore.toFixed(2)}%</td></tr>`);
    lines.push('      </table>');
    lines.push('    </section>');
    lines.push('');
    lines.push('    <section class="severity">');
    lines.push('      <h2>Differences by Severity</h2>');
    lines.push('      <div class="severity-grid">');
    lines.push(`        <div class="severity-item critical"><span class="count">${report.summary.critical}</span><span class="label">Critical</span></div>`);
    lines.push(`        <div class="severity-item major"><span class="count">${report.summary.major}</span><span class="label">Major</span></div>`);
    lines.push(`        <div class="severity-item minor"><span class="count">${report.summary.minor}</span><span class="label">Minor</span></div>`);
    lines.push(`        <div class="severity-item formatting"><span class="count">${report.summary.formatting}</span><span class="label">Formatting</span></div>`);
    lines.push('      </div>');
    lines.push('    </section>');

    if (report.differences.length > 0) {
      lines.push('');
      lines.push('    <section class="differences">');
      lines.push('      <h2>Detailed Differences</h2>');

      for (const diff of report.differences) {
        lines.push(`      <div class="diff-entry ${diff.severity}">`);
        lines.push(`        <div class="diff-header">`);
        lines.push(`          <span class="index">[${diff.index}]</span>`);
        lines.push(`          <code class="command">${this.escapeHTML(diff.command)}</code>`);
        lines.push(`          <span class="severity-badge ${diff.severity}">${diff.severity}</span>`);
        lines.push(`        </div>`);
        lines.push(`        <div class="diff-meta">`);
        lines.push(`          <span>Category: ${diff.category}</span>`);
        lines.push(`          <span>Similarity: ${(diff.similarity * 100).toFixed(1)}%</span>`);
        lines.push(`        </div>`);
        lines.push(`        <div class="diff-content">`);
        lines.push(`          <div class="expected">`);
        lines.push(`            <h4>Expected</h4>`);
        lines.push(`            <pre>${this.escapeHTML(diff.expected)}</pre>`);
        lines.push(`          </div>`);
        lines.push(`          <div class="actual">`);
        lines.push(`            <h4>Actual</h4>`);
        lines.push(`            <pre>${this.escapeHTML(diff.actual)}</pre>`);
        lines.push(`          </div>`);
        lines.push(`        </div>`);
        lines.push(`      </div>`);
      }

      lines.push('    </section>');
    }

    lines.push('  </div>');
    lines.push('</body>');
    lines.push('</html>');

    return lines.join('\n');
  }

  // ============================================================================
  // Batch Report Generators
  // ============================================================================

  /**
   * Generate plain text batch report
   */
  private generateBatchText(result: DetailedBatchResult): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('BATCH COMPARISON REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push('-'.repeat(60));
    lines.push('SUMMARY');
    lines.push('-'.repeat(60));
    lines.push(`Total Sequences:     ${result.sequences.length}`);
    lines.push(`Successful:          ${result.successCount}`);
    lines.push(`Failed:              ${result.failureCount}`);
    lines.push(`Total Differences:   ${result.totalDifferences}`);
    lines.push(`Aggregate Parity:    ${result.aggregateParityScore.toFixed(2)}%`);
    lines.push(`Total Time:          ${result.totalExecutionTime}ms`);
    lines.push('');

    if (result.worstSequences.length > 0) {
      lines.push('Worst Sequences:');
      for (const id of result.worstSequences) {
        const seq = result.detailedResults.find(r => r.id === id);
        if (seq) {
          lines.push(`  - ${id}: ${seq.diffCount} differences (${seq.parityScore.toFixed(1)}%)`);
        }
      }
      lines.push('');
    }

    lines.push('-'.repeat(60));
    lines.push('SEQUENCE RESULTS');
    lines.push('-'.repeat(60));

    for (const seq of result.detailedResults) {
      const status = seq.success ? '✓' : '✗';
      lines.push(`${status} ${seq.name}`);
      lines.push(`    Parity: ${seq.parityScore.toFixed(2)}%`);
      lines.push(`    Differences: ${seq.diffCount}`);
      lines.push(`    Time: ${seq.executionTime}ms`);
      if (seq.error) {
        lines.push(`    Error: ${seq.error}`);
      }
      lines.push('');
    }

    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  /**
   * Generate JSON batch report
   */
  private generateBatchJSON(result: DetailedBatchResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Generate Markdown batch report
   */
  private generateBatchMarkdown(result: DetailedBatchResult): string {
    const lines: string[] = [];

    lines.push('# Batch Comparison Report');
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Sequences | ${result.sequences.length} |`);
    lines.push(`| Successful | ${result.successCount} |`);
    lines.push(`| Failed | ${result.failureCount} |`);
    lines.push(`| Total Differences | ${result.totalDifferences} |`);
    lines.push(`| **Aggregate Parity** | **${result.aggregateParityScore.toFixed(2)}%** |`);
    lines.push(`| Total Time | ${result.totalExecutionTime}ms |`);
    lines.push('');

    if (result.worstSequences.length > 0) {
      lines.push('## Worst Sequences');
      lines.push('');
      for (const id of result.worstSequences) {
        const seq = result.detailedResults.find(r => r.id === id);
        if (seq) {
          lines.push(`- **${id}**: ${seq.diffCount} differences (${seq.parityScore.toFixed(1)}%)`);
        }
      }
      lines.push('');
    }

    lines.push('## Sequence Results');
    lines.push('');
    lines.push(`| Sequence | Status | Parity | Differences | Time |`);
    lines.push(`|----------|--------|--------|-------------|------|`);

    for (const seq of result.detailedResults) {
      const status = seq.success ? '✓' : '✗';
      lines.push(`| ${seq.name} | ${status} | ${seq.parityScore.toFixed(1)}% | ${seq.diffCount} | ${seq.executionTime}ms |`);
    }

    return lines.join('\n');
  }

  /**
   * Generate HTML batch report
   */
  private generateBatchHTML(result: DetailedBatchResult): string {
    const lines: string[] = [];

    lines.push('<!DOCTYPE html>');
    lines.push('<html lang="en">');
    lines.push('<head>');
    lines.push('  <meta charset="UTF-8">');
    lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    lines.push('  <title>Batch Comparison Report</title>');
    lines.push('  <style>');
    lines.push(this.getHTMLStyles());
    lines.push('  </style>');
    lines.push('</head>');
    lines.push('<body>');
    lines.push('  <div class="container">');
    lines.push('    <h1>Batch Comparison Report</h1>');
    lines.push('');
    lines.push('    <section class="summary">');
    lines.push('      <h2>Summary</h2>');
    lines.push('      <div class="stats-grid">');
    lines.push(`        <div class="stat"><span class="value">${result.sequences.length}</span><span class="label">Sequences</span></div>`);
    lines.push(`        <div class="stat success"><span class="value">${result.successCount}</span><span class="label">Successful</span></div>`);
    lines.push(`        <div class="stat failure"><span class="value">${result.failureCount}</span><span class="label">Failed</span></div>`);
    lines.push(`        <div class="stat"><span class="value">${result.totalDifferences}</span><span class="label">Differences</span></div>`);
    lines.push(`        <div class="stat highlight"><span class="value">${result.aggregateParityScore.toFixed(1)}%</span><span class="label">Parity</span></div>`);
    lines.push(`        <div class="stat"><span class="value">${result.totalExecutionTime}ms</span><span class="label">Time</span></div>`);
    lines.push('      </div>');
    lines.push('    </section>');
    lines.push('');
    lines.push('    <section class="results">');
    lines.push('      <h2>Sequence Results</h2>');
    lines.push('      <table>');
    lines.push('        <thead>');
    lines.push('          <tr><th>Sequence</th><th>Status</th><th>Parity</th><th>Differences</th><th>Time</th></tr>');
    lines.push('        </thead>');
    lines.push('        <tbody>');

    for (const seq of result.detailedResults) {
      const statusClass = seq.success ? 'success' : 'failure';
      const statusIcon = seq.success ? '✓' : '✗';
      lines.push(`          <tr class="${statusClass}">`);
      lines.push(`            <td>${this.escapeHTML(seq.name)}</td>`);
      lines.push(`            <td class="status">${statusIcon}</td>`);
      lines.push(`            <td>${seq.parityScore.toFixed(1)}%</td>`);
      lines.push(`            <td>${seq.diffCount}</td>`);
      lines.push(`            <td>${seq.executionTime}ms</td>`);
      lines.push(`          </tr>`);
    }

    lines.push('        </tbody>');
    lines.push('      </table>');
    lines.push('    </section>');
    lines.push('  </div>');
    lines.push('</body>');
    lines.push('</html>');

    return lines.join('\n');
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Indent text with a prefix
   */
  private indentText(text: string, prefix: string): string {
    return text
      .split('\n')
      .map(line => prefix + line)
      .join('\n');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Get CSS styles for HTML reports
   */
  private getHTMLStyles(): string {
    return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; margin-bottom: 20px; }
    h2 { color: #34495e; margin: 20px 0 10px; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
    section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; }
    tr.highlight td { font-weight: bold; background: #e8f4f8; }
    .severity-grid, .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; }
    .severity-item, .stat { text-align: center; padding: 15px; border-radius: 8px; background: #f8f9fa; }
    .severity-item .count, .stat .value { display: block; font-size: 24px; font-weight: bold; }
    .severity-item .label, .stat .label { display: block; font-size: 12px; color: #666; text-transform: uppercase; }
    .severity-item.critical { background: #fee; color: #c0392b; }
    .severity-item.major { background: #fff3e0; color: #e67e22; }
    .severity-item.minor { background: #fff8e1; color: #f39c12; }
    .severity-item.formatting { background: #e8f5e9; color: #27ae60; }
    .stat.success { background: #e8f5e9; color: #27ae60; }
    .stat.failure { background: #fee; color: #c0392b; }
    .stat.highlight { background: #e3f2fd; color: #2196f3; }
    .diff-entry { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .diff-entry.critical { border-color: #e74c3c; }
    .diff-entry.major { border-color: #e67e22; }
    .diff-entry.minor { border-color: #f39c12; }
    .diff-entry.formatting { border-color: #27ae60; }
    .diff-header { padding: 10px 15px; background: #f8f9fa; display: flex; align-items: center; gap: 10px; }
    .diff-header .index { font-weight: bold; color: #666; }
    .diff-header .command { background: #2c3e50; color: white; padding: 2px 8px; border-radius: 4px; }
    .severity-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; }
    .severity-badge.critical { background: #e74c3c; color: white; }
    .severity-badge.major { background: #e67e22; color: white; }
    .severity-badge.minor { background: #f39c12; color: white; }
    .severity-badge.formatting { background: #27ae60; color: white; }
    .diff-meta { padding: 5px 15px; background: #fafafa; font-size: 14px; color: #666; display: flex; gap: 20px; }
    .diff-content { display: grid; grid-template-columns: 1fr 1fr; }
    .diff-content .expected, .diff-content .actual { padding: 10px 15px; }
    .diff-content .expected { background: #fff5f5; }
    .diff-content .actual { background: #f5fff5; }
    .diff-content h4 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 5px; }
    .diff-content pre { white-space: pre-wrap; word-wrap: break-word; font-size: 13px; background: white; padding: 10px; border-radius: 4px; }
    tr.success { background: #f8fff8; }
    tr.failure { background: #fff8f8; }
    .status { font-weight: bold; }
    tr.success .status { color: #27ae60; }
    tr.failure .status { color: #e74c3c; }
    `;
  }
}

/**
 * Factory function to create a ReportGenerator
 */
export function createReportGenerator(): ReportGenerator {
  return new ReportGenerator();
}
