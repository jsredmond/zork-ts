#!/usr/bin/env tsx

/**
 * Transcript Audit Script
 * 
 * This script audits all transcript files to verify that:
 * 1. Labels match actual content being tested
 * 2. All major puzzles have transcripts
 * 3. All NPCs have transcripts
 * 
 * It generates a comprehensive audit report identifying:
 * - Mislabeled transcripts
 * - Missing puzzle transcripts
 * - Duplicate content
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
  description: string;
  category: string;
  priority: string;
  entries: TranscriptEntry[];
  metadata?: {
    created?: string;
    source?: string;
    verified?: boolean;
  };
}

interface TranscriptAudit {
  transcriptId: string;
  filePath: string;
  label: string;
  description: string;
  category: string;
  priority: string;
  actualContent: string[];
  issues: string[];
  recommendation: 'keep' | 'relabel' | 'recreate' | 'investigate';
}

interface AuditReport {
  totalTranscripts: number;
  accurate: number;
  mislabeled: number;
  duplicates: number;
  missingPuzzles: string[];
  missingNPCs: string[];
  transcriptAudits: TranscriptAudit[];
}

// Known major puzzles that should have transcripts
const MAJOR_PUZZLES = [
  'mailbox',
  'trap-door',
  'lamp-darkness',
  'troll',
  'dam',
  'cyclops',
  'rope-basket',
  'bell-book-candle',
  'treasure-collection',
  'rainbow',
  'bat',
  'mirror-room',
  'coffin',
  'egg-nest',
  'thief',
];

// Known NPCs that should have transcripts
const MAJOR_NPCS = [
  'troll',
  'thief',
  'cyclops',
  'bat',
];

/**
 * Analyze transcript content to determine what it's actually testing
 */
function analyzeTranscriptContent(transcript: Transcript): string[] {
  const content: string[] = [];
  const commands = transcript.entries.map(e => e.command.toLowerCase());
  const outputs = transcript.entries.map(e => e.expectedOutput.toLowerCase());
  const allText = [...commands, ...outputs].join(' ');
  
  // Check for specific puzzles/features
  if (allText.includes('mailbox')) content.push('mailbox');
  if (allText.includes('trap door') || allText.includes('trapdoor')) content.push('trap-door');
  if (allText.includes('troll')) content.push('troll');
  if (allText.includes('dam') || allText.includes('reservoir')) content.push('dam');
  if (allText.includes('cyclops')) content.push('cyclops');
  if (allText.includes('rope') && allText.includes('basket')) content.push('rope-basket');
  if (allText.includes('bell') || allText.includes('book') || allText.includes('candle')) content.push('bell-book-candle');
  if (allText.includes('treasure') || allText.includes('trophy case')) content.push('treasure');
  if (allText.includes('rainbow') && allText.includes('pot')) content.push('rainbow');
  if (allText.includes('bat') && !allText.includes('combat')) content.push('bat');
  if (allText.includes('mirror')) content.push('mirror');
  if (allText.includes('coffin') || allText.includes('sceptre')) content.push('coffin');
  if (allText.includes('egg') || allText.includes('nest')) content.push('egg-nest');
  if (allText.includes('thief')) content.push('thief');
  
  // Check for combat
  if (allText.includes('attack') || allText.includes('kill') || allText.includes('swing') || 
      allText.includes('axe') || allText.includes('sword')) {
    content.push('combat');
  }
  
  // Check for specific rooms
  if (allText.includes('maze')) content.push('maze');
  if (allText.includes('error') || allText.includes('don\'t understand')) content.push('error-messages');
  if (allText.includes('inventory') && allText.includes('carrying too much')) content.push('inventory-limits');
  if (allText.includes('save') || allText.includes('restore')) content.push('save-restore');
  if (allText.includes('die') || allText.includes('death') || allText.includes('resurrection')) content.push('death');
  if (allText.includes('verbose') || allText.includes('brief')) content.push('verbose-mode');
  if (allText.includes('lamp') && allText.includes('fuel')) content.push('lamp-fuel');
  
  return content.length > 0 ? content : ['unknown'];
}

/**
 * Check if transcript label matches actual content
 */
function checkLabelMatch(transcript: Transcript, actualContent: string[]): string[] {
  const issues: string[] = [];
  const labelLower = transcript.name.toLowerCase();
  const idLower = transcript.id.toLowerCase();
  const descLower = transcript.description.toLowerCase();
  
  // Check if label claims to test something not in content
  if ((labelLower.includes('rainbow') || descLower.includes('rainbow')) && !actualContent.includes('rainbow')) {
    issues.push(`Label claims "rainbow" but content doesn't test rainbow puzzle`);
  }
  
  if ((labelLower.includes('bat') || descLower.includes('bat')) && !actualContent.includes('bat')) {
    issues.push(`Label claims "bat" but content doesn't test bat encounter`);
  }
  
  if ((labelLower.includes('mirror') || descLower.includes('mirror')) && !actualContent.includes('mirror')) {
    issues.push(`Label claims "mirror" but content doesn't test mirror room`);
  }
  
  if ((labelLower.includes('coffin') || descLower.includes('coffin')) && !actualContent.includes('coffin')) {
    issues.push(`Label claims "coffin" but content doesn't test coffin puzzle`);
  }
  
  if ((labelLower.includes('egg') || labelLower.includes('nest')) && !actualContent.includes('egg-nest')) {
    issues.push(`Label claims "egg/nest" but content doesn't test egg puzzle`);
  }
  
  // Check if content tests something not in label
  if (actualContent.includes('troll') && !labelLower.includes('troll') && !descLower.includes('troll')) {
    issues.push(`Content tests troll but label doesn't mention it`);
  }
  
  if (actualContent.includes('combat') && !labelLower.includes('combat') && !labelLower.includes('troll') && !labelLower.includes('thief')) {
    issues.push(`Content includes combat but label doesn't mention it`);
  }
  
  return issues;
}

/**
 * Get recommendation for transcript
 */
function getRecommendation(issues: string[]): 'keep' | 'relabel' | 'recreate' | 'investigate' {
  if (issues.length === 0) return 'keep';
  
  const hasLabelMismatch = issues.some(i => 
    i.includes('Label claims') || i.includes('Content tests')
  );
  
  if (hasLabelMismatch) {
    // If label claims something not in content, likely needs recreation
    if (issues.some(i => i.includes('Label claims'))) {
      return 'recreate';
    }
    // If content has something not in label, might just need relabeling
    return 'relabel';
  }
  
  return 'investigate';
}

/**
 * Read all transcript files from a directory
 */
function readTranscriptsFromDir(dirPath: string): Transcript[] {
  const transcripts: Transcript[] = [];
  
  if (!fs.existsSync(dirPath)) {
    return transcripts;
  }
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    if (file.endsWith('.json') && file !== '.gitkeep') {
      const filePath = path.join(dirPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const transcript = JSON.parse(content) as Transcript;
        transcripts.push(transcript);
      } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
      }
    }
  }
  
  return transcripts;
}

/**
 * Audit all transcripts
 */
function auditTranscripts(): AuditReport {
  const transcriptDir = path.join(process.cwd(), '.kiro', 'transcripts');
  const categories = ['critical', 'high', 'medium', 'low', 'timing'];
  
  const allTranscripts: Array<{ transcript: Transcript; filePath: string }> = [];
  
  // Read all transcripts
  for (const category of categories) {
    const categoryPath = path.join(transcriptDir, category);
    const transcripts = readTranscriptsFromDir(categoryPath);
    
    for (const transcript of transcripts) {
      allTranscripts.push({
        transcript,
        filePath: path.join(category, `${transcript.id}.json`),
      });
    }
  }
  
  // Audit each transcript
  const transcriptAudits: TranscriptAudit[] = [];
  const contentMap = new Map<string, string[]>(); // Track duplicate content
  
  for (const { transcript, filePath } of allTranscripts) {
    const actualContent = analyzeTranscriptContent(transcript);
    const issues = checkLabelMatch(transcript, actualContent);
    const recommendation = getRecommendation(issues);
    
    // Check for duplicates
    const contentKey = actualContent.sort().join(',');
    if (contentMap.has(contentKey)) {
      const duplicates = contentMap.get(contentKey)!;
      duplicates.push(transcript.id);
      issues.push(`Possible duplicate of: ${duplicates.filter(id => id !== transcript.id).join(', ')}`);
    } else {
      contentMap.set(contentKey, [transcript.id]);
    }
    
    transcriptAudits.push({
      transcriptId: transcript.id,
      filePath,
      label: transcript.name,
      description: transcript.description,
      category: transcript.category,
      priority: transcript.priority,
      actualContent,
      issues,
      recommendation,
    });
  }
  
  // Check for missing puzzles
  const testedPuzzles = new Set<string>();
  for (const audit of transcriptAudits) {
    audit.actualContent.forEach(content => testedPuzzles.add(content));
  }
  
  const missingPuzzles = MAJOR_PUZZLES.filter(puzzle => !testedPuzzles.has(puzzle));
  const missingNPCs = MAJOR_NPCS.filter(npc => !testedPuzzles.has(npc));
  
  // Count duplicates
  const duplicateGroups = Array.from(contentMap.values()).filter(ids => ids.length > 1);
  
  return {
    totalTranscripts: allTranscripts.length,
    accurate: transcriptAudits.filter(a => a.issues.length === 0).length,
    mislabeled: transcriptAudits.filter(a => a.issues.length > 0).length,
    duplicates: duplicateGroups.length,
    missingPuzzles,
    missingNPCs,
    transcriptAudits,
  };
}

/**
 * Generate audit report
 */
function generateReport(report: AuditReport): string {
  let output = '';
  
  output += '# Transcript Audit Report\n\n';
  output += `Generated: ${new Date().toISOString()}\n\n`;
  
  output += '## Summary\n\n';
  output += `- Total Transcripts: ${report.totalTranscripts}\n`;
  output += `- Accurate: ${report.accurate} (${((report.accurate / report.totalTranscripts) * 100).toFixed(1)}%)\n`;
  output += `- Mislabeled: ${report.mislabeled} (${((report.mislabeled / report.totalTranscripts) * 100).toFixed(1)}%)\n`;
  output += `- Duplicate Groups: ${report.duplicates}\n`;
  output += `- Missing Puzzles: ${report.missingPuzzles.length}\n`;
  output += `- Missing NPCs: ${report.missingNPCs.length}\n\n`;
  
  // Mislabeled transcripts
  if (report.mislabeled > 0) {
    output += '## Mislabeled Transcripts\n\n';
    
    const mislabeled = report.transcriptAudits.filter(a => a.issues.length > 0);
    
    for (const audit of mislabeled) {
      output += `### ${audit.transcriptId} - ${audit.label}\n\n`;
      output += `- **File**: ${audit.filePath}\n`;
      output += `- **Description**: ${audit.description}\n`;
      output += `- **Priority**: ${audit.priority}\n`;
      output += `- **Actual Content**: ${audit.actualContent.join(', ')}\n`;
      output += `- **Recommendation**: ${audit.recommendation}\n`;
      output += `- **Issues**:\n`;
      for (const issue of audit.issues) {
        output += `  - ${issue}\n`;
      }
      output += '\n';
    }
  }
  
  // Missing puzzles
  if (report.missingPuzzles.length > 0) {
    output += '## Missing Puzzle Transcripts\n\n';
    output += 'The following major puzzles do not have dedicated transcripts:\n\n';
    for (const puzzle of report.missingPuzzles) {
      output += `- ${puzzle}\n`;
    }
    output += '\n';
  }
  
  // Missing NPCs
  if (report.missingNPCs.length > 0) {
    output += '## Missing NPC Transcripts\n\n';
    output += 'The following NPCs do not have dedicated transcripts:\n\n';
    for (const npc of report.missingNPCs) {
      output += `- ${npc}\n`;
    }
    output += '\n';
  }
  
  // All transcripts summary
  output += '## All Transcripts\n\n';
  output += '| ID | Label | Priority | Content | Issues | Recommendation |\n';
  output += '|----|-------|----------|---------|--------|----------------|\n';
  
  for (const audit of report.transcriptAudits) {
    const issueCount = audit.issues.length;
    const status = issueCount === 0 ? '✓' : `⚠️ ${issueCount}`;
    output += `| ${audit.transcriptId} | ${audit.label} | ${audit.priority} | ${audit.actualContent.join(', ')} | ${status} | ${audit.recommendation} |\n`;
  }
  
  return output;
}

/**
 * Main execution
 */
function main() {
  console.log('Starting transcript audit...\n');
  
  const report = auditTranscripts();
  const reportText = generateReport(report);
  
  // Write report to file
  const reportPath = path.join(process.cwd(), '.kiro', 'testing', 'transcript-audit-report.md');
  fs.writeFileSync(reportPath, reportText, 'utf-8');
  
  console.log(`Audit complete!`);
  console.log(`Report written to: ${reportPath}\n`);
  
  // Print summary to console
  console.log('Summary:');
  console.log(`- Total Transcripts: ${report.totalTranscripts}`);
  console.log(`- Accurate: ${report.accurate}`);
  console.log(`- Mislabeled: ${report.mislabeled}`);
  console.log(`- Duplicate Groups: ${report.duplicates}`);
  console.log(`- Missing Puzzles: ${report.missingPuzzles.length}`);
  console.log(`- Missing NPCs: ${report.missingNPCs.length}`);
  
  if (report.mislabeled > 0) {
    console.log('\n⚠️  Found mislabeled transcripts! See report for details.');
  }
  
  if (report.missingPuzzles.length > 0 || report.missingNPCs.length > 0) {
    console.log('\n⚠️  Found missing transcripts! See report for details.');
  }
}

main();
