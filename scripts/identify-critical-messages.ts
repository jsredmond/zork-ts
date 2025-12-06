/**
 * Identify Critical Missing Messages
 * Parses categorized-messages.json and identifies critical priority messages
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

interface CategorizedMessagesData {
  messages: CategorizedMessage[];
  statistics?: {
    total: number;
    implemented: number;
    missing: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  };
}

interface CriticalMessageReport {
  puzzleMessages: CategorizedMessage[];
  npcDialogue: CategorizedMessage[];
  errorMessages: CategorizedMessage[];
  damPuzzle: CategorizedMessage[];
  mirrorPuzzle: CategorizedMessage[];
  cyclopsPuzzle: CategorizedMessage[];
  thiefEncounter: CategorizedMessage[];
  trollEncounter: CategorizedMessage[];
}

function identifyCriticalMessages(): CriticalMessageReport {
  const dataPath = path.join(process.cwd(), '.kiro/testing/categorized-messages.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('Error: categorized-messages.json not found');
    process.exit(1);
  }

  const data: CategorizedMessagesData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  // Filter critical messages
  const criticalMessages = data.messages.filter(msg => msg.priority === 'critical');
  
  const report: CriticalMessageReport = {
    puzzleMessages: [],
    npcDialogue: [],
    errorMessages: [],
    damPuzzle: [],
    mirrorPuzzle: [],
    cyclopsPuzzle: [],
    thiefEncounter: [],
    trollEncounter: []
  };

  // Categorize critical messages
  for (const msg of criticalMessages) {
    // Categorize by type
    if (msg.category === 'puzzle') {
      report.puzzleMessages.push(msg);
    }
    if (msg.category === 'error') {
      report.errorMessages.push(msg);
    }

    // Categorize by specific puzzle/NPC
    if (msg.object === 'DAM' || msg.object === 'BOLT' || msg.context.includes('DAM') || msg.context.includes('BOLT')) {
      report.damPuzzle.push(msg);
    }
    if (msg.object === 'MIRROR-1' || msg.object === 'MIRROR-2' || msg.context.includes('MIRROR')) {
      report.mirrorPuzzle.push(msg);
    }
    if (msg.object === 'CYCLOPS' || msg.context.includes('CYCLOPS')) {
      report.cyclopsPuzzle.push(msg);
      report.npcDialogue.push(msg);
    }
    if (msg.object === 'THIEF' || msg.context.includes('THIEF')) {
      report.thiefEncounter.push(msg);
      report.npcDialogue.push(msg);
    }
    if (msg.object === 'TROLL' || msg.context.includes('TROLL')) {
      report.trollEncounter.push(msg);
      report.npcDialogue.push(msg);
    }
  }

  return report;
}

function printReport(report: CriticalMessageReport): void {
  console.log('='.repeat(80));
  console.log('CRITICAL MISSING MESSAGES REPORT');
  console.log('='.repeat(80));
  console.log();

  console.log(`Total Critical Messages: ${
    report.puzzleMessages.length + report.errorMessages.length
  }`);
  console.log(`  - Puzzle-related: ${report.puzzleMessages.length}`);
  console.log(`  - Error messages: ${report.errorMessages.length}`);
  console.log();

  console.log('BY PUZZLE/NPC:');
  console.log(`  - Dam Puzzle: ${report.damPuzzle.length} messages`);
  console.log(`  - Mirror Puzzle: ${report.mirrorPuzzle.length} messages`);
  console.log(`  - Cyclops Puzzle: ${report.cyclopsPuzzle.length} messages`);
  console.log(`  - Thief Encounter: ${report.thiefEncounter.length} messages`);
  console.log(`  - Troll Encounter: ${report.trollEncounter.length} messages`);
  console.log();

  // Print detailed lists
  printSection('DAM PUZZLE MESSAGES', report.damPuzzle);
  printSection('MIRROR PUZZLE MESSAGES', report.mirrorPuzzle);
  printSection('CYCLOPS PUZZLE MESSAGES', report.cyclopsPuzzle);
  printSection('THIEF ENCOUNTER MESSAGES', report.thiefEncounter);
  printSection('TROLL ENCOUNTER MESSAGES', report.trollEncounter);
  printSection('CRITICAL ERROR MESSAGES', report.errorMessages);
}

function printSection(title: string, messages: CategorizedMessage[]): void {
  if (messages.length === 0) return;

  console.log('='.repeat(80));
  console.log(title);
  console.log('='.repeat(80));
  console.log();

  for (const msg of messages) {
    console.log(`[${msg.file}:${msg.line}] ${msg.context}`);
    console.log(`  Object: ${msg.object || 'N/A'}`);
    console.log(`  Verb: ${msg.verb || 'N/A'}`);
    console.log(`  Type: ${msg.type}`);
    if (msg.condition) {
      console.log(`  Condition: ${msg.condition}`);
    }
    console.log(`  Message: "${msg.message}"`);
    console.log(`  Notes: ${msg.implementationNotes}`);
    console.log();
  }
}

function saveReport(report: CriticalMessageReport): void {
  const outputPath = path.join(process.cwd(), '.kiro/testing/critical-messages-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${outputPath}`);
}

// Main execution
const report = identifyCriticalMessages();
printReport(report);
saveReport(report);
