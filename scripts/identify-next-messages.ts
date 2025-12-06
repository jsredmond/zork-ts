#!/usr/bin/env npx tsx
/**
 * Helper script to identify and prioritize next batch of messages to implement
 * Groups missing messages by category and suggests implementation order
 */

import * as fs from 'fs';
import * as path from 'path';

interface MissingMessage {
  file: string;
  line: number;
  context: string;
  message: string;
  type: string;
  object?: string;
  verb?: string;
  condition?: string;
}

interface MessageGroup {
  category: string;
  count: number;
  messages: MissingMessage[];
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: string;
}

function loadMissingMessages(): MissingMessage[] {
  const resultsPath = path.join(process.cwd(), '.kiro/testing/message-validation-results.json');
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  return results.missingMessages;
}

function categorizeMessages(messages: MissingMessage[]): Map<string, MissingMessage[]> {
  const groups = new Map<string, MissingMessage[]>();
  
  for (const msg of messages) {
    let category = 'other';
    
    // Categorize by object or context
    if (msg.object) {
      category = msg.object;
    } else if (msg.context && msg.context !== 'UNKNOWN') {
      category = msg.context.replace('ROUTINE ', '').replace('-F', '');
    } else if (msg.verb) {
      category = `VERB-${msg.verb}`;
    }
    
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(msg);
  }
  
  return groups;
}

function assessPriority(category: string, count: number): 'high' | 'medium' | 'low' {
  // High priority: puzzles, NPCs, critical objects
  const highPriority = ['CYCLOPS', 'THIEF', 'TROLL', 'DAM', 'MIRROR', 'ROPE', 'BASKET'];
  if (highPriority.some(p => category.includes(p))) return 'high';
  
  // Medium priority: common objects, water, containers
  const mediumPriority = ['WATER', 'BOTTLE', 'LAMP', 'CANDLES', 'TRAP-DOOR'];
  if (mediumPriority.some(p => category.includes(p))) return 'medium';
  
  // Low priority: scenery, generic messages
  return 'low';
}

function estimateEffort(count: number, hasConditions: boolean): string {
  if (count <= 5 && !hasConditions) return '15-30 min';
  if (count <= 10 && !hasConditions) return '30-60 min';
  if (count <= 5 && hasConditions) return '1-2 hours';
  if (count <= 10 && hasConditions) return '2-3 hours';
  return '3-4 hours';
}

function main() {
  console.log('=== MISSING MESSAGE ANALYSIS ===\n');
  
  const missingMessages = loadMissingMessages();
  console.log(`Total missing messages: ${missingMessages.length}\n`);
  
  const categorized = categorizeMessages(missingMessages);
  
  // Create groups with metadata
  const groups: MessageGroup[] = [];
  
  for (const [category, messages] of categorized.entries()) {
    const hasConditions = messages.some(m => m.condition && m.condition.length > 0);
    groups.push({
      category,
      count: messages.length,
      messages,
      priority: assessPriority(category, messages.length),
      estimatedEffort: estimateEffort(messages.length, hasConditions)
    });
  }
  
  // Sort by priority and count
  groups.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.count - a.count;
  });
  
  // Display summary
  console.log('=== RECOMMENDED IMPLEMENTATION ORDER ===\n');
  
  let totalEstimated = 0;
  
  for (let i = 0; i < Math.min(10, groups.length); i++) {
    const group = groups[i];
    const priorityEmoji = group.priority === 'high' ? '🔴' : group.priority === 'medium' ? '🟡' : '🟢';
    
    console.log(`${i + 1}. ${priorityEmoji} ${group.category} (${group.count} messages)`);
    console.log(`   Priority: ${group.priority.toUpperCase()}`);
    console.log(`   Estimated effort: ${group.estimatedEffort}`);
    console.log(`   Sample messages:`);
    
    for (let j = 0; j < Math.min(3, group.messages.length); j++) {
      const msg = group.messages[j];
      const preview = msg.message.substring(0, 60) + (msg.message.length > 60 ? '...' : '');
      console.log(`     - "${preview}"`);
      if (msg.verb) console.log(`       (${msg.verb})`);
    }
    console.log();
  }
  
  // Quick wins section
  console.log('\n=== QUICK WINS (< 30 min each) ===\n');
  
  const quickWins = groups.filter(g => 
    g.count <= 5 && 
    !g.messages.some(m => m.condition && m.condition.length > 50)
  ).slice(0, 10);
  
  for (const group of quickWins) {
    console.log(`- ${group.category}: ${group.count} messages (${group.estimatedEffort})`);
  }
  
  // Generate detailed report
  console.log('\n=== GENERATING DETAILED REPORT ===\n');
  
  let report = '# Detailed Missing Messages Report\n\n';
  report += `**Total Missing**: ${missingMessages.length} messages\n\n`;
  report += '---\n\n';
  
  for (const group of groups) {
    report += `## ${group.category} (${group.count} messages)\n\n`;
    report += `**Priority**: ${group.priority.toUpperCase()}  \n`;
    report += `**Estimated Effort**: ${group.estimatedEffort}\n\n`;
    report += '### Messages\n\n';
    
    for (const msg of group.messages) {
      report += `#### ${msg.file}:${msg.line}\n\n`;
      report += `**Message**: "${msg.message}"\n\n`;
      if (msg.verb) report += `**Verb**: ${msg.verb}\n\n`;
      if (msg.object) report += `**Object**: ${msg.object}\n\n`;
      if (msg.condition) report += `**Condition**: \`${msg.condition}\`\n\n`;
      report += '---\n\n';
    }
  }
  
  const reportPath = path.join(process.cwd(), '.kiro/testing/missing-messages-detailed.md');
  fs.writeFileSync(reportPath, report);
  console.log(`Detailed report saved to: ${reportPath}`);
  
  // Summary statistics
  console.log('\n=== SUMMARY STATISTICS ===\n');
  console.log(`High priority groups: ${groups.filter(g => g.priority === 'high').length}`);
  console.log(`Medium priority groups: ${groups.filter(g => g.priority === 'medium').length}`);
  console.log(`Low priority groups: ${groups.filter(g => g.priority === 'low').length}`);
  console.log(`\nQuick wins available: ${quickWins.length} groups`);
  console.log(`Total messages in quick wins: ${quickWins.reduce((sum, g) => sum + g.count, 0)}`);
  
  // Next steps
  console.log('\n=== NEXT STEPS ===\n');
  console.log('1. Review the detailed report: .kiro/testing/missing-messages-detailed.md');
  console.log('2. Start with quick wins to build momentum');
  console.log('3. Then tackle high-priority groups');
  console.log('4. Validate after each group: npx tsx scripts/verify-coverage-threshold.ts');
  console.log('5. Run tests frequently: npm test');
}

main();
