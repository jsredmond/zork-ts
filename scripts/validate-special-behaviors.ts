#!/usr/bin/env npx tsx
/**
 * Validate Special Behavior Coverage
 * Checks if special category messages have been implemented
 */

import * as fs from 'fs';
import * as path from 'path';

interface CategorizedMessage {
  file: string;
  line: number;
  context: string;
  message: string;
  type: string;
  object?: string;
  verb?: string;
  condition?: string;
  category: string;
  priority: string;
  implementationNotes: string;
}

interface ValidationResult {
  totalSpecialMessages: number;
  foundInTypeScript: number;
  missingMessages: CategorizedMessage[];
  coveragePercentage: number;
}

/**
 * Load categorized messages
 */
function loadCategorizedMessages(): CategorizedMessage[] {
  const messagesPath = path.join(process.cwd(), '.kiro/testing/categorized-messages.json');
  const data = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
  return data.messages || [];
}

/**
 * Normalize message for comparison
 */
function normalizeMessage(msg: string): string {
  return msg
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')          // Normalize whitespace
    .trim();
}

/**
 * Load all TypeScript source files
 */
function loadTypeScriptFiles(): Map<string, string> {
  const files = new Map<string, string>();
  const srcDir = path.join(process.cwd(), 'src');
  
  function readDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        readDir(fullPath);
      } else if (entry.name.endsWith('.ts')) {
        const relativePath = path.relative(srcDir, fullPath);
        files.set(relativePath, fs.readFileSync(fullPath, 'utf-8'));
      }
    }
  }
  
  readDir(srcDir);
  return files;
}

/**
 * Search TypeScript source for a message
 */
function searchTypeScriptForMessage(message: string, tsFiles: Map<string, string>): boolean {
  const normalized = normalizeMessage(message);
  
  // Skip very short messages (like single words or object names)
  if (normalized.length < 5) {
    return true; // Assume found to avoid false negatives
  }
  
  for (const [file, content] of tsFiles.entries()) {
    const normalizedContent = normalizeMessage(content);
    
    // Exact match
    if (normalizedContent.includes(normalized)) {
      return true;
    }
    
    // Fuzzy match (85% similarity for special behaviors)
    const similarity = findBestMatch(normalized, normalizedContent);
    if (similarity > 0.85) {
      return true;
    }
  }
  
  return false;
}

/**
 * Find best substring match
 */
function findBestMatch(needle: string, haystack: string): number {
  const words = needle.split(' ');
  if (words.length < 3) return 0;
  
  let matchedWords = 0;
  let lastIndex = 0;
  
  for (const word of words) {
    const index = haystack.indexOf(word, lastIndex);
    if (index >= 0) {
      matchedWords++;
      lastIndex = index + word.length;
    }
  }
  
  return matchedWords / words.length;
}

/**
 * Main validation
 */
function main() {
  console.log('='.repeat(80));
  console.log('SPECIAL BEHAVIOR COVERAGE VALIDATION');
  console.log('='.repeat(80));
  console.log();
  
  console.log('Loading categorized messages...');
  const allMessages = loadCategorizedMessages();
  
  // Filter for special category messages
  const specialMessages = allMessages.filter(m => m.category === 'special');
  
  console.log(`  Found ${specialMessages.length} special behavior messages`);
  console.log();
  
  console.log('Loading TypeScript source files...');
  const tsFiles = loadTypeScriptFiles();
  console.log(`  Loaded ${tsFiles.size} TypeScript files`);
  console.log();
  
  console.log('Validating special behavior messages...');
  
  const result: ValidationResult = {
    totalSpecialMessages: specialMessages.length,
    foundInTypeScript: 0,
    missingMessages: [],
    coveragePercentage: 0
  };
  
  // Check each special message
  for (const msg of specialMessages) {
    const found = searchTypeScriptForMessage(msg.message, tsFiles);
    
    if (found) {
      result.foundInTypeScript++;
    } else {
      result.missingMessages.push(msg);
    }
    
    // Progress indicator
    if ((result.foundInTypeScript + result.missingMessages.length) % 20 === 0) {
      process.stdout.write(`\r  Progress: ${result.foundInTypeScript + result.missingMessages.length}/${specialMessages.length}`);
    }
  }
  
  console.log(`\r  Progress: ${result.foundInTypeScript + result.missingMessages.length}/${specialMessages.length}`);
  console.log();
  
  // Calculate percentage
  result.coveragePercentage = (result.foundInTypeScript / result.totalSpecialMessages) * 100;
  
  console.log('='.repeat(80));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total special behavior messages: ${result.totalSpecialMessages}`);
  console.log(`Found in TypeScript: ${result.foundInTypeScript} (${result.coveragePercentage.toFixed(1)}%)`);
  console.log(`Missing: ${result.missingMessages.length}`);
  console.log();
  
  // Group missing messages by object
  if (result.missingMessages.length > 0) {
    const byObject = new Map<string, CategorizedMessage[]>();
    
    for (const msg of result.missingMessages) {
      const obj = msg.object || 'UNKNOWN';
      const existing = byObject.get(obj) || [];
      existing.push(msg);
      byObject.set(obj, existing);
    }
    
    console.log('='.repeat(80));
    console.log('MISSING MESSAGES BY OBJECT');
    console.log('='.repeat(80));
    console.log();
    
    // Sort by number of missing messages
    const sorted = Array.from(byObject.entries()).sort((a, b) => b[1].length - a[1].length);
    
    for (const [obj, messages] of sorted.slice(0, 15)) {
      console.log(`${obj}: ${messages.length} missing messages`);
      
      // Show first 2 messages as examples
      for (const msg of messages.slice(0, 2)) {
        const preview = msg.message.substring(0, 60);
        console.log(`  - [${msg.type}] "${preview}${msg.message.length > 60 ? '...' : ''}"`);
      }
      
      if (messages.length > 2) {
        console.log(`  ... and ${messages.length - 2} more`);
      }
      console.log();
    }
    
    if (sorted.length > 15) {
      console.log(`... and ${sorted.length - 15} more objects with missing messages`);
      console.log();
    }
  }
  
  // Save detailed results
  const outputPath = path.join(process.cwd(), '.kiro/testing/special-behavior-validation.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Detailed results saved to: ${outputPath}`);
  console.log();
  
  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log();
  
  if (result.coveragePercentage >= 95) {
    console.log('✅ EXCELLENT: 95%+ of special behavior messages found');
    console.log('   Target achieved! Special behaviors are well-covered.');
  } else if (result.coveragePercentage >= 85) {
    console.log('✅ GOOD: 85%+ of special behavior messages found');
    console.log('   Close to target. A few more implementations needed.');
  } else if (result.coveragePercentage >= 70) {
    console.log('⚠️  FAIR: 70%+ of special behavior messages found');
    console.log('   Significant work needed to reach 95% target.');
  } else {
    console.log('❌ NEEDS WORK: <70% of special behavior messages found');
    console.log('   Major implementation effort required.');
  }
  console.log();
  
  // Specific recommendations
  if (result.coveragePercentage < 95) {
    console.log('RECOMMENDATIONS:');
    console.log('  1. Review missing messages by object (above)');
    console.log('  2. Focus on objects with most missing messages first');
    console.log('  3. Implement special behaviors in src/game/specialBehaviors.ts');
    console.log('  4. Add object-specific handlers in src/game/actions.ts');
    console.log('  5. Re-run validation to track progress');
    console.log();
  }
  
  // Exit with appropriate code
  if (result.coveragePercentage >= 95) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
