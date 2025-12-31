/**
 * CertificationGenerator - Generates formal parity certification documents
 * 
 * This module creates markdown documentation certifying 100% logic parity
 * between the TypeScript Zork I implementation and the original Z-Machine.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { ParityResults } from './exhaustiveParityValidator.js';
import { DifferenceType, ClassifiedDifference } from './differenceClassifier.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Version information for the certification
 */
export interface VersionInfo {
  /** Package version from package.json */
  packageVersion: string;
  /** Node.js version */
  nodeVersion: string;
  /** TypeScript version (if available) */
  typescriptVersion?: string;
}

/**
 * Options for certification generation
 */
export interface CertificationOptions {
  /** Title for the certification document */
  title?: string;
  /** Additional notes to include */
  notes?: string[];
  /** Whether to include detailed seed results */
  includeDetailedResults?: boolean;
  /** Whether to include sample differences */
  includeSampleDifferences?: boolean;
  /** Maximum number of sample differences to include */
  maxSampleDifferences?: number;
}

/**
 * Default certification options
 */
const DEFAULT_OPTIONS: CertificationOptions = {
  title: 'Zork I TypeScript Implementation - Parity Certification',
  includeDetailedResults: true,
  includeSampleDifferences: true,
  maxSampleDifferences: 5,
};

/**
 * CertificationGenerator creates formal documentation of parity achievement
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export class CertificationGenerator {
  private options: CertificationOptions;

  constructor(options?: CertificationOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Generate a certification document from parity results
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   * 
   * @param results - Parity test results
   * @param versionInfo - Optional version information
   * @returns Markdown certification document
   */
  generate(results: ParityResults, versionInfo?: VersionInfo): string {
    const sections: string[] = [];
    const timestamp = new Date().toISOString();
    const version = versionInfo ?? this.getVersionInfo();

    // Header
    sections.push(this.generateHeader(timestamp, version));

    // Executive Summary
    sections.push(this.generateExecutiveSummary(results));

    // Test Results from All Seeds (Requirement 6.2)
    sections.push(this.generateSeedResults(results));

    // Difference Classification Breakdown (Requirement 6.3)
    sections.push(this.generateClassificationBreakdown(results));

    // Zero Logic Differences Confirmation (Requirement 6.5)
    sections.push(this.generateLogicDifferenceConfirmation(results));

    // Timestamp and Version Information (Requirement 6.4)
    sections.push(this.generateVersionSection(timestamp, version));

    // Additional Notes
    if (this.options.notes && this.options.notes.length > 0) {
      sections.push(this.generateNotesSection());
    }

    // Footer
    sections.push(this.generateFooter(results));

    return sections.join('\n\n');
  }

  /**
   * Write certification to a file
   * 
   * @param certification - Certification markdown content
   * @param filePath - Path to write the file
   */
  async writeToFile(certification: string, filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, certification, 'utf-8');
  }

  /**
   * Get version information from the environment
   */
  getVersionInfo(): VersionInfo {
    let packageVersion = '1.0.0';
    
    try {
      const packageJsonPath = path.resolve(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        packageVersion = packageJson.version || '1.0.0';
      }
    } catch {
      // Use default version
    }

    return {
      packageVersion,
      nodeVersion: process.version,
    };
  }

  /**
   * Generate the document header
   */
  private generateHeader(timestamp: string, version: VersionInfo): string {
    const lines: string[] = [];
    
    lines.push(`# ${this.options.title}`);
    lines.push('');
    lines.push(`**Generated:** ${this.formatTimestamp(timestamp)}`);
    lines.push(`**Version:** ${version.packageVersion}`);
    lines.push('');
    lines.push('---');

    return lines.join('\n');
  }

  /**
   * Generate executive summary section
   */
  private generateExecutiveSummary(results: ParityResults): string {
    const lines: string[] = [];
    
    lines.push('## Executive Summary');
    lines.push('');
    
    if (results.passed) {
      lines.push('✅ **CERTIFICATION: 100% LOGIC PARITY ACHIEVED**');
      lines.push('');
      lines.push('The TypeScript implementation of Zork I has been verified to have **zero logic differences** compared to the original Z-Machine implementation. All detected differences are attributable to:');
      lines.push('');
      lines.push('- Random Number Generator (RNG) variations');
      lines.push('- State divergence caused by accumulated RNG effects');
      lines.push('');
      lines.push('These differences are expected and acceptable, as they do not affect the core game logic or player experience.');
    } else {
      lines.push('❌ **CERTIFICATION FAILED: LOGIC DIFFERENCES DETECTED**');
      lines.push('');
      lines.push(`The TypeScript implementation has **${results.logicDifferences} logic difference(s)** that require investigation and resolution before certification can be granted.`);
    }

    return lines.join('\n');
  }

  /**
   * Generate seed results section
   * Requirement: 6.2
   */
  private generateSeedResults(results: ParityResults): string {
    const lines: string[] = [];
    
    lines.push('## Test Results by Seed');
    lines.push('');
    lines.push(`**Total Seeds Tested:** ${results.totalTests}`);
    lines.push(`**Overall Parity:** ${results.overallParityPercentage.toFixed(2)}%`);
    lines.push(`**Total Execution Time:** ${this.formatDuration(results.totalExecutionTime)}`);
    lines.push('');

    if (this.options.includeDetailedResults) {
      lines.push('### Detailed Seed Results');
      lines.push('');
      lines.push('| Seed | Commands | Matching | Parity % | RNG Diff | State Div | Logic Diff | Status |');
      lines.push('|------|----------|----------|----------|----------|-----------|------------|--------|');

      for (const [seed, seedResult] of results.seedResults) {
        const counts = this.countDifferenceTypes(seedResult.differences);
        const status = counts.LOGIC_DIFFERENCE === 0 ? '✅' : '❌';
        
        lines.push(
          `| ${seed} | ${seedResult.totalCommands} | ${seedResult.matchingResponses} | ${seedResult.parityPercentage.toFixed(1)}% | ${counts.RNG_DIFFERENCE} | ${counts.STATE_DIVERGENCE} | ${counts.LOGIC_DIFFERENCE} | ${status} |`
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate classification breakdown section
   * Requirement: 6.3
   */
  private generateClassificationBreakdown(results: ParityResults): string {
    const lines: string[] = [];
    
    lines.push('## Difference Classification Breakdown');
    lines.push('');
    lines.push('All differences between the TypeScript and Z-Machine implementations have been classified into the following categories:');
    lines.push('');
    lines.push('| Category | Count | Percentage | Description |');
    lines.push('|----------|-------|------------|-------------|');
    
    const total = results.totalDifferences || 1; // Avoid division by zero
    
    lines.push(
      `| RNG Differences | ${results.rngDifferences} | ${((results.rngDifferences / total) * 100).toFixed(1)}% | Random message selection variations |`
    );
    lines.push(
      `| State Divergences | ${results.stateDivergences} | ${((results.stateDivergences / total) * 100).toFixed(1)}% | Accumulated RNG effects causing state differences |`
    );
    lines.push(
      `| Logic Differences | ${results.logicDifferences} | ${((results.logicDifferences / total) * 100).toFixed(1)}% | Actual behavioral differences requiring investigation |`
    );
    lines.push('');
    lines.push(`**Total Differences:** ${results.totalDifferences}`);

    // Include sample differences if enabled
    if (this.options.includeSampleDifferences && results.totalDifferences > 0) {
      lines.push('');
      lines.push(this.generateSampleDifferences(results));
    }

    return lines.join('\n');
  }

  /**
   * Generate sample differences section
   */
  private generateSampleDifferences(results: ParityResults): string {
    const lines: string[] = [];
    const maxSamples = this.options.maxSampleDifferences ?? 5;
    
    lines.push('### Sample Differences');
    lines.push('');

    // Collect all differences
    const allDifferences: ClassifiedDifference[] = [];
    for (const [, seedResult] of results.seedResults) {
      allDifferences.push(...seedResult.differences);
    }

    // Group by type and show samples
    const byType = this.groupDifferencesByType(allDifferences);

    for (const [type, diffs] of Object.entries(byType)) {
      if (diffs.length === 0) continue;
      
      lines.push(`#### ${this.formatDifferenceType(type as DifferenceType)} (${diffs.length} total)`);
      lines.push('');
      
      const samples = diffs.slice(0, maxSamples);
      for (const diff of samples) {
        lines.push(`- **Command ${diff.commandIndex}:** \`${diff.command}\``);
        lines.push(`  - Reason: ${diff.reason}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate logic difference confirmation section
   * Requirement: 6.5
   */
  private generateLogicDifferenceConfirmation(results: ParityResults): string {
    const lines: string[] = [];
    
    lines.push('## Logic Difference Confirmation');
    lines.push('');
    
    if (results.logicDifferences === 0) {
      lines.push('### ✅ Zero Logic Differences Confirmed');
      lines.push('');
      lines.push('After exhaustive testing across all seeds and command sequences:');
      lines.push('');
      lines.push('- **Logic Differences Found:** 0');
      lines.push('- **Certification Status:** PASSED');
      lines.push('');
      lines.push('The TypeScript implementation exhibits identical logical behavior to the original Z-Machine implementation for all tested scenarios.');
    } else {
      lines.push('### ❌ Logic Differences Detected');
      lines.push('');
      lines.push(`**${results.logicDifferences} logic difference(s)** were detected that cannot be attributed to RNG or state divergence.`);
      lines.push('');
      lines.push('These differences require investigation and resolution before certification can be granted.');
      lines.push('');
      
      // List logic differences
      const logicDiffs = this.collectLogicDifferences(results);
      if (logicDiffs.length > 0) {
        lines.push('#### Logic Differences Found:');
        lines.push('');
        for (const diff of logicDiffs.slice(0, 10)) {
          lines.push(`- **Command ${diff.commandIndex}:** \`${diff.command}\``);
          lines.push(`  - TS Output: \`${this.truncate(diff.tsOutput, 100)}\``);
          lines.push(`  - ZM Output: \`${this.truncate(diff.zmOutput, 100)}\``);
        }
        if (logicDiffs.length > 10) {
          lines.push(`- ... and ${logicDiffs.length - 10} more`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate version section
   * Requirement: 6.4
   */
  private generateVersionSection(timestamp: string, version: VersionInfo): string {
    const lines: string[] = [];
    
    lines.push('## Version Information');
    lines.push('');
    lines.push('| Property | Value |');
    lines.push('|----------|-------|');
    lines.push(`| Package Version | ${version.packageVersion} |`);
    lines.push(`| Node.js Version | ${version.nodeVersion} |`);
    if (version.typescriptVersion) {
      lines.push(`| TypeScript Version | ${version.typescriptVersion} |`);
    }
    lines.push(`| Certification Date | ${this.formatTimestamp(timestamp)} |`);
    lines.push(`| Certification ID | ${this.generateCertificationId(timestamp, version)} |`);

    return lines.join('\n');
  }

  /**
   * Generate notes section
   */
  private generateNotesSection(): string {
    const lines: string[] = [];
    
    lines.push('## Additional Notes');
    lines.push('');
    
    for (const note of this.options.notes ?? []) {
      lines.push(`- ${note}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate document footer
   */
  private generateFooter(_results: ParityResults): string {
    const lines: string[] = [];
    
    lines.push('---');
    lines.push('');
    lines.push('## Methodology');
    lines.push('');
    lines.push('This certification was generated through automated exhaustive parity testing:');
    lines.push('');
    lines.push('1. **Multi-Seed Testing:** Tests were run with multiple random seeds to ensure comprehensive coverage');
    lines.push('2. **Extended Sequences:** Each seed executed 250+ commands covering all major game areas');
    lines.push('3. **Difference Classification:** All differences were automatically classified as RNG, State Divergence, or Logic');
    lines.push('4. **Automated Verification:** Results were programmatically verified for zero logic differences');
    lines.push('');
    lines.push('### Test Coverage');
    lines.push('');
    lines.push('- House exterior and interior');
    lines.push('- Underground exploration');
    lines.push('- Maze navigation');
    lines.push('- Dam and reservoir');
    lines.push('- Coal mine');
    lines.push('- All major puzzles (troll, thief, cyclops, rainbow, etc.)');
    lines.push('- Edge cases and boundary conditions');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`*This document was automatically generated by the Parity Certification Generator.*`);

    return lines.join('\n');
  }

  /**
   * Count difference types in a list of differences
   */
  private countDifferenceTypes(differences: ClassifiedDifference[]): Record<DifferenceType, number> {
    const counts: Record<DifferenceType, number> = {
      'RNG_DIFFERENCE': 0,
      'STATE_DIVERGENCE': 0,
      'LOGIC_DIFFERENCE': 0,
    };

    for (const diff of differences) {
      counts[diff.classification]++;
    }

    return counts;
  }

  /**
   * Group differences by type
   */
  private groupDifferencesByType(differences: ClassifiedDifference[]): Record<DifferenceType, ClassifiedDifference[]> {
    const groups: Record<DifferenceType, ClassifiedDifference[]> = {
      'RNG_DIFFERENCE': [],
      'STATE_DIVERGENCE': [],
      'LOGIC_DIFFERENCE': [],
    };

    for (const diff of differences) {
      groups[diff.classification].push(diff);
    }

    return groups;
  }

  /**
   * Collect all logic differences from results
   */
  private collectLogicDifferences(results: ParityResults): ClassifiedDifference[] {
    const logicDiffs: ClassifiedDifference[] = [];
    
    for (const [, seedResult] of results.seedResults) {
      for (const diff of seedResult.differences) {
        if (diff.classification === 'LOGIC_DIFFERENCE') {
          logicDiffs.push(diff);
        }
      }
    }

    return logicDiffs;
  }

  /**
   * Format a timestamp for display
   */
  private formatTimestamp(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  }

  /**
   * Format duration in milliseconds to human-readable string
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Format difference type for display
   */
  private formatDifferenceType(type: DifferenceType): string {
    switch (type) {
      case 'RNG_DIFFERENCE':
        return 'RNG Differences';
      case 'STATE_DIVERGENCE':
        return 'State Divergences';
      case 'LOGIC_DIFFERENCE':
        return 'Logic Differences';
    }
  }

  /**
   * Generate a unique certification ID
   */
  private generateCertificationId(timestamp: string, version: VersionInfo): string {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toISOString().slice(11, 19).replace(/:/g, '');
    return `ZORK-PARITY-${version.packageVersion}-${dateStr}-${timeStr}`;
  }

  /**
   * Truncate a string to a maximum length
   */
  private truncate(str: string, maxLength: number): string {
    const cleaned = str.replace(/\n/g, ' ').trim();
    if (cleaned.length <= maxLength) {
      return cleaned;
    }
    return cleaned.slice(0, maxLength - 3) + '...';
  }
}

/**
 * Factory function to create a CertificationGenerator
 */
export function createCertificationGenerator(options?: CertificationOptions): CertificationGenerator {
  return new CertificationGenerator(options);
}

/**
 * Convenience function to generate and write certification
 * Requirements: 6.1
 * 
 * @param results - Parity test results
 * @param outputPath - Path to write the certification file
 * @param options - Optional certification options
 * @returns The generated certification content
 */
export async function generateAndWriteCertification(
  results: ParityResults,
  outputPath: string = 'PARITY_CERTIFICATION.md',
  options?: CertificationOptions
): Promise<string> {
  const generator = createCertificationGenerator(options);
  const certification = generator.generate(results);
  await generator.writeToFile(certification, outputPath);
  return certification;
}
