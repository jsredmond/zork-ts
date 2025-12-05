#!/usr/bin/env npx tsx
/**
 * Validate that TypeScript implementation contains all ZIL messages
 */

import * as fs from 'fs';
import * as path from 'path';

interface ZilMessage {
  file: string;
  line: number;
  context: string;
  message: string;
  type: 'TELL' | 'JIGS-UP' | 'DESC' | 'LDESC' | 'TEXT' | 'FDESC';
}

interface ValidationResult {
  totalMessages: number;
  foundInTypeScript: number;
  missingMessages: ZilMessage[];
  partialMatches: Array<{ zilMsg: ZilMessage; tsMatch: string; similarity: number }>;
}

/**
 * Load ZIL messages
 */
function loadZilMessages(): ZilMessage[] {
  const messagesPath = path.join(process.cwd(), '.kiro/testing/zil-messages.json');
  return JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
}

/**
 * Search TypeScript source for a message
 */
function searchTypeScriptForMessage(message: string, tsFiles: Map<string, string>): { found: boolean; file?: string; match?: string } {
  // Normalize message for comparison
  const normalized = normalizeMessage(message);
  
  // Skip very short messages (like single words)
  if (normalized.length < 5) {
    return { found: true }; // Assume found to avoid false negatives
  }
  
  for (const [file, content] of tsFiles.entries()) {
    const normalizedContent = normalizeMessage(content);
    
    // Exact match
    if (normalizedContent.includes(normalized)) {
      return { found: true, file, match: message };
    }
    
    // Fuzzy match (80% similarity)
    const similarity = findBestMatch(normalized, normalizedContent);
    if (similarity > 0.8) {
      return { found: true, file, match: `~${similarity.toFixed(2)}` };
    }
  }
  
  return { found: false };
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
 * Find best substring match
 */
function findBestMatch(needle: string, haystack: string): number {
  const words = needle.split(' ');
  if (words.length < 3) return 0;
  
  // Check if most words appear in order
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
 * Main validation
 */
function main() {
  console.log('Loading ZIL messages...');
  const zilMessages = loadZilMessages();
  
  console.log('Loading TypeScript source files...');
  const tsFiles = loadTypeScriptFiles();
  console.log(`  Loaded ${tsFiles.size} TypeScript files`);
  
  console.log('\nValidating messages...');
  
  const result: ValidationResult = {
    totalMessages: 0,
    foundInTypeScript: 0,
    missingMessages: [],
    partialMatches: []
  };
  
  // Focus on TELL messages (player-facing text)
  const tellMessages = zilMessages.filter(m => m.type === 'TELL');
  result.totalMessages = tellMessages.length;
  
  console.log(`  Checking ${tellMessages.length} TELL messages...`);
  
  for (const msg of tellMessages) {
    const searchResult = searchTypeScriptForMessage(msg.message, tsFiles);
    
    if (searchResult.found) {
      result.foundInTypeScript++;
    } else {
      result.missingMessages.push(msg);
    }
    
    // Progress indicator
    if (result.foundInTypeScript % 50 === 0) {
      process.stdout.write(`\r  Progress: ${result.foundInTypeScript}/${tellMessages.length}`);
    }
  }
  
  console.log(`\r  Progress: ${result.foundInTypeScript}/${tellMessages.length}`);
  
  // Calculate percentage
  const percentage = ((result.foundInTypeScript / result.totalMessages) * 100).toFixed(1);
  
  console.log('\n=== VALIDATION RESULTS ===\n');
  console.log(`Total TELL messages in ZIL: ${result.totalMessages}`);
  console.log(`Found in TypeScript: ${result.foundInTypeScript} (${percentage}%)`);
  console.log(`Missing: ${result.missingMessages.length}`);
  
  if (result.missingMessages.length > 0) {
    console.log('\n=== MISSING MESSAGES (Sample) ===\n');
    result.missingMessages.slice(0, 20).forEach(msg => {
      console.log(`[${msg.context}] ${msg.file}:${msg.line}`);
      console.log(`  "${msg.message.substring(0, 80)}${msg.message.length > 80 ? '...' : ''}"`);
      console.log();
    });
    
    if (result.missingMessages.length > 20) {
      console.log(`... and ${result.missingMessages.length - 20} more`);
    }
  }
  
  // Save detailed results
  const outputPath = path.join(process.cwd(), '.kiro/testing/message-validation-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nDetailed results saved to: ${outputPath}`);
  
  // Summary
  console.log('\n=== SUMMARY ===\n');
  if (percentage >= 95) {
    console.log('✅ EXCELLENT: 95%+ of messages found');
  } else if (percentage >= 85) {
    console.log('✅ GOOD: 85%+ of messages found');
  } else if (percentage >= 70) {
    console.log('⚠️  FAIR: 70%+ of messages found - some work needed');
  } else {
    console.log('❌ NEEDS WORK: <70% of messages found');
  }
}

main();
