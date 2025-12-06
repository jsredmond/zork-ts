#!/usr/bin/env npx tsx
/**
 * Verify message coverage meets 95% threshold
 * Checks total coverage, coverage by category, and coverage by priority
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  totalMessages: number;
  foundInTypeScript: number;
  missingMessages: any[];
}

interface CategorizedData {
  messages: Array<{
    category: string;
    priority: string;
    message: string;
  }>;
  statistics: {
    total: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  };
}

function loadValidationResults(): ValidationResult {
  const resultsPath = path.join(process.cwd(), '.kiro/testing/message-validation-results.json');
  return JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
}

function loadCategorizedMessages(): CategorizedData {
  const categorizedPath = path.join(process.cwd(), '.kiro/testing/categorized-messages.json');
  return JSON.parse(fs.readFileSync(categorizedPath, 'utf-8'));
}

function normalizeMessage(msg: string): string {
  return msg
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  console.log('=== MESSAGE COVERAGE VERIFICATION ===\n');
  
  const validationResults = loadValidationResults();
  const categorizedData = loadCategorizedMessages();
  
  // Calculate overall coverage
  const overallCoverage = (validationResults.foundInTypeScript / validationResults.totalMessages) * 100;
  
  console.log('Overall Coverage:');
  console.log(`  Total messages: ${validationResults.totalMessages}`);
  console.log(`  Found: ${validationResults.foundInTypeScript}`);
  console.log(`  Missing: ${validationResults.missingMessages.length}`);
  console.log(`  Coverage: ${overallCoverage.toFixed(2)}%`);
  console.log(`  Target: 95.00%`);
  console.log(`  Status: ${overallCoverage >= 95 ? '✅ PASS' : '❌ FAIL'}\n`);
  
  // Create a set of missing messages for quick lookup
  const missingSet = new Set(
    validationResults.missingMessages.map(m => normalizeMessage(m.message))
  );
  
  // Calculate coverage by category
  console.log('Coverage by Category:');
  const categoryStats: Record<string, { total: number; found: number }> = {};
  
  for (const msg of categorizedData.messages) {
    const category = msg.category;
    if (!categoryStats[category]) {
      categoryStats[category] = { total: 0, found: 0 };
    }
    categoryStats[category].total++;
    
    const normalized = normalizeMessage(msg.message);
    if (!missingSet.has(normalized)) {
      categoryStats[category].found++;
    }
  }
  
  for (const [category, stats] of Object.entries(categoryStats)) {
    const coverage = (stats.found / stats.total) * 100;
    console.log(`  ${category}: ${stats.found}/${stats.total} (${coverage.toFixed(1)}%)`);
  }
  
  // Calculate coverage by priority
  console.log('\nCoverage by Priority:');
  const priorityStats: Record<string, { total: number; found: number }> = {};
  
  for (const msg of categorizedData.messages) {
    const priority = msg.priority;
    if (!priorityStats[priority]) {
      priorityStats[priority] = { total: 0, found: 0 };
    }
    priorityStats[priority].total++;
    
    const normalized = normalizeMessage(msg.message);
    if (!missingSet.has(normalized)) {
      priorityStats[priority].found++;
    }
  }
  
  for (const [priority, stats] of Object.entries(priorityStats)) {
    const coverage = (stats.found / stats.total) * 100;
    console.log(`  ${priority}: ${stats.found}/${stats.total} (${coverage.toFixed(1)}%)`);
  }
  
  // Final assessment
  console.log('\n=== ASSESSMENT ===\n');
  
  if (overallCoverage >= 95) {
    console.log('✅ SUCCESS: 95% coverage threshold achieved!');
  } else {
    const remaining = Math.ceil((0.95 * validationResults.totalMessages) - validationResults.foundInTypeScript);
    console.log(`❌ INCOMPLETE: Need ${remaining} more messages to reach 95% threshold`);
    console.log(`   Current: ${overallCoverage.toFixed(2)}%`);
    console.log(`   Target: 95.00%`);
    console.log(`   Gap: ${(95 - overallCoverage).toFixed(2)}%`);
  }
  
  // Save summary
  const summary = {
    timestamp: new Date().toISOString(),
    overall: {
      total: validationResults.totalMessages,
      found: validationResults.foundInTypeScript,
      missing: validationResults.missingMessages.length,
      coverage: overallCoverage,
      meetsThreshold: overallCoverage >= 95
    },
    byCategory: categoryStats,
    byPriority: priorityStats
  };
  
  const summaryPath = path.join(process.cwd(), '.kiro/testing/coverage-threshold-report.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\nDetailed report saved to: ${summaryPath}`);
}

main();
