#!/usr/bin/env npx tsx
/**
 * Validate generic message coverage
 * Checks that generic message variations from gverbs.zil are implemented
 */

import * as fs from 'fs';
import * as path from 'path';

interface GenericMessageCheck {
  name: string;
  zilSource: string;
  expectedMessages: string[];
  tsLocation: string;
  found: boolean;
  matchedMessages: string[];
}

/**
 * Load TypeScript messages file
 */
function loadTypeScriptMessages(): string {
  const messagesPath = path.join(process.cwd(), 'src/game/data/messages.ts');
  return fs.readFileSync(messagesPath, 'utf-8');
}

/**
 * Check if a message exists in TypeScript
 */
function checkMessage(tsContent: string, message: string): boolean {
  // Try exact match first
  if (tsContent.includes(message)) {
    return true;
  }
  
  // Try with different quote styles
  const withDoubleQuotes = message.replace(/'/g, '"');
  const withSingleQuotes = message.replace(/"/g, "'");
  
  if (tsContent.includes(withDoubleQuotes) || tsContent.includes(withSingleQuotes)) {
    return true;
  }
  
  // Try without quotes
  const normalized = message.replace(/['"]/g, '').trim();
  return tsContent.includes(normalized);
}

/**
 * Main validation
 */
function main() {
  console.log('Validating Generic Message Coverage...\n');
  
  const tsContent = loadTypeScriptMessages();
  
  // Define expected generic message tables from gverbs.zil
  const checks: GenericMessageCheck[] = [
    {
      name: 'YUKS (Refusal Messages)',
      zilSource: 'gverbs.zil YUKS table',
      expectedMessages: [
        'A valiant attempt.',
        "You can't be serious.",
        'An interesting idea...',
        'What a concept!'
      ],
      tsLocation: 'REFUSAL_MESSAGES',
      found: false,
      matchedMessages: []
    },
    {
      name: 'HO-HUM (Ineffective Actions)',
      zilSource: 'gverbs.zil HO-HUM table',
      expectedMessages: [
        " doesn't seem to work.",
        " isn't notably helpful.",
        " has no effect."
      ],
      tsLocation: 'INEFFECTIVE_ACTION_MESSAGES',
      found: false,
      matchedMessages: []
    },
    {
      name: 'HELLOS (Greetings)',
      zilSource: 'gverbs.zil HELLOS table',
      expectedMessages: [
        'Hello.',
        'Good day.',
        "Nice weather we've been having lately.",
        'Goodbye.'
      ],
      tsLocation: 'HELLO_MESSAGES',
      found: false,
      matchedMessages: []
    },
    {
      name: 'WHEEEEE (Silly Actions)',
      zilSource: 'gverbs.zil WHEEEEE table',
      expectedMessages: [
        'Very good. Now you can go to the second grade.',
        'Are you enjoying yourself?',
        'Wheeeeeeeeee!!!!!',
        'Do you expect me to applaud?'
      ],
      tsLocation: 'SILLY_ACTION_MESSAGES',
      found: false,
      matchedMessages: []
    },
    {
      name: 'JUMPLOSS (Jump Failures)',
      zilSource: 'gverbs.zil JUMPLOSS table',
      expectedMessages: [
        'You should have looked before you leaped.',
        'In the movies, your life would be passing before your eyes.',
        'Geronimo...'
      ],
      tsLocation: 'JUMP_FAILURE_MESSAGES',
      found: false,
      matchedMessages: []
    },
    {
      name: 'Humorous Responses',
      zilSource: 'gverbs.zil V-* routines',
      expectedMessages: [
        'A hollow voice says "Fool."',
        'Bug? Not in a flawless program like this! (Cough, cough).',
        'Preposterous!',
        'What a bizarre concept!',
        "I'd sooner kiss a pig.",
        'Naturally!',
        'Aaaarrrrgggghhhh!',
        'At your service!'
      ],
      tsLocation: 'HUMOROUS_RESPONSES',
      found: false,
      matchedMessages: []
    }
  ];
  
  // Check each message table
  let totalMessages = 0;
  let foundMessages = 0;
  
  for (const check of checks) {
    console.log(`Checking ${check.name}...`);
    console.log(`  Source: ${check.zilSource}`);
    console.log(`  Expected location: ${check.tsLocation}`);
    
    for (const message of check.expectedMessages) {
      totalMessages++;
      if (checkMessage(tsContent, message)) {
        foundMessages++;
        check.matchedMessages.push(message);
      }
    }
    
    check.found = check.matchedMessages.length === check.expectedMessages.length;
    
    if (check.found) {
      console.log(`  ✅ All ${check.expectedMessages.length} messages found`);
    } else {
      console.log(`  ⚠️  ${check.matchedMessages.length}/${check.expectedMessages.length} messages found`);
      const missing = check.expectedMessages.filter(m => !check.matchedMessages.includes(m));
      missing.forEach(m => console.log(`     Missing: "${m}"`));
    }
    console.log();
  }
  
  // Calculate coverage
  const coverage = ((foundMessages / totalMessages) * 100).toFixed(1);
  
  console.log('=== GENERIC MESSAGE COVERAGE ===\n');
  console.log(`Total generic messages: ${totalMessages}`);
  console.log(`Found in TypeScript: ${foundMessages} (${coverage}%)`);
  console.log(`Missing: ${totalMessages - foundMessages}`);
  console.log();
  
  // Summary
  if (coverage >= 90) {
    console.log('✅ EXCELLENT: 90%+ generic message coverage achieved!');
    console.log('   Requirements 4.1, 4.2, 4.3, 4.4, 4.5 satisfied');
  } else if (coverage >= 80) {
    console.log('✅ GOOD: 80%+ generic message coverage');
  } else {
    console.log('⚠️  NEEDS WORK: <80% generic message coverage');
  }
  
  // Save results
  const outputPath = path.join(process.cwd(), '.kiro/testing/generic-message-validation.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    totalMessages,
    foundMessages,
    coverage: parseFloat(coverage),
    checks
  }, null, 2));
  console.log(`\nDetailed results saved to: ${outputPath}`);
}

main();
