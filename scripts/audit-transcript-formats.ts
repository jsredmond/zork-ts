#!/usr/bin/env tsx

/**
 * Audit all transcript files for format consistency
 */

import * as fs from 'fs';
import * as path from 'path';

interface TranscriptEntry {
  command: string;
  expectedOutput: string;
  notes?: string;
}

interface Transcript {
  id: string;
  name: string;
  description?: string;
  category: string;
  priority: string;
  setupCommands?: string[];
  entries: TranscriptEntry[];
  metadata?: any;
}

interface AuditResult {
  file: string;
  status: 'OK' | 'ISSUE' | 'ERROR';
  issues: string[];
}

function auditTranscript(filePath: string): AuditResult {
  const issues: string[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let data: any;
    
    try {
      data = JSON.parse(content);
    } catch (e) {
      return {
        file: filePath,
        status: 'ERROR',
        issues: [`JSON parse error: ${e instanceof Error ? e.message : String(e)}`]
      };
    }
    
    // Check required fields
    if (!data.id) issues.push('missing id');
    if (!data.name) issues.push('missing name');
    if (!data.category) issues.push('missing category');
    if (!data.priority) issues.push('missing priority');
    
    // Check for 'commands' instead of 'entries'
    if (data.commands && !data.entries) {
      issues.push('uses "commands" instead of "entries"');
    }
    
    if (!data.entries) {
      issues.push('missing entries');
    } else if (!Array.isArray(data.entries)) {
      issues.push('entries is not an array');
    } else if (data.entries.length === 0) {
      issues.push('entries array is empty');
    } else {
      // Check each entry
      for (let i = 0; i < data.entries.length; i++) {
        const entry = data.entries[i];
        if (!entry.command) {
          issues.push(`entry ${i} missing command`);
        }
        if (entry.expectedOutput === undefined) {
          issues.push(`entry ${i} missing expectedOutput`);
        }
      }
    }
    
    return {
      file: filePath,
      status: issues.length === 0 ? 'OK' : 'ISSUE',
      issues
    };
  } catch (e) {
    return {
      file: filePath,
      status: 'ERROR',
      issues: [`File read error: ${e instanceof Error ? e.message : String(e)}`]
    };
  }
}

function findTranscriptFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findTranscriptFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const transcriptDir = '.kiro/transcripts';
const files = findTranscriptFiles(transcriptDir);

console.log('='.repeat(80));
console.log('TRANSCRIPT FORMAT AUDIT');
console.log('='.repeat(80));
console.log(`\nFound ${files.length} transcript files\n`);

const results: AuditResult[] = [];
let okCount = 0;
let issueCount = 0;
let errorCount = 0;

for (const file of files.sort()) {
  const result = auditTranscript(file);
  results.push(result);
  
  if (result.status === 'OK') {
    okCount++;
    console.log(`✓ ${file}`);
  } else if (result.status === 'ISSUE') {
    issueCount++;
    console.log(`⚠ ${file}`);
    for (const issue of result.issues) {
      console.log(`    - ${issue}`);
    }
  } else {
    errorCount++;
    console.log(`✗ ${file}`);
    for (const issue of result.issues) {
      console.log(`    - ${issue}`);
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`Total files: ${files.length}`);
console.log(`OK: ${okCount}`);
console.log(`Issues: ${issueCount}`);
console.log(`Errors: ${errorCount}`);

if (issueCount === 0 && errorCount === 0) {
  console.log('\n✓ All transcripts have correct format!');
} else {
  console.log('\n⚠ Some transcripts need attention.');
}
