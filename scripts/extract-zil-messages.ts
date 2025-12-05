#!/usr/bin/env tsx
/**
 * Extract all text messages from ZIL source files
 * This helps validate that our TypeScript implementation has the correct messages
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

/**
 * Extract messages from a ZIL file
 */
function extractMessagesFromFile(filePath: string): ZilMessage[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const messages: ZilMessage[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Extract TELL messages
    if (line.includes('<TELL')) {
      const message = extractTellMessage(lines, i);
      if (message) {
        messages.push({
          file: path.basename(filePath),
          line: lineNum,
          context: getContext(lines, i),
          message: message,
          type: 'TELL'
        });
      }
    }
    
    // Extract JIGS-UP messages (death messages)
    if (line.includes('<JIGS-UP')) {
      const message = extractJigsUpMessage(line);
      if (message) {
        messages.push({
          file: path.basename(filePath),
          line: lineNum,
          context: getContext(lines, i),
          message: message,
          type: 'JIGS-UP'
        });
      }
    }
    
    // Extract object/room descriptions
    if (line.includes('(DESC ')) {
      const message = extractQuotedString(line);
      if (message) {
        messages.push({
          file: path.basename(filePath),
          line: lineNum,
          context: getContext(lines, i),
          message: message,
          type: 'DESC'
        });
      }
    }
    
    if (line.includes('(LDESC ')) {
      const message = extractQuotedString(line);
      if (message) {
        messages.push({
          file: path.basename(filePath),
          line: lineNum,
          context: getContext(lines, i),
          message: message,
          type: 'LDESC'
        });
      }
    }
  }
  
  return messages;
}

/**
 * Extract a TELL message that may span multiple lines
 */
function extractTellMessage(lines: string[], startIndex: number): string | null {
  let message = '';
  let inMessage = false;
  
  for (let i = startIndex; i < lines.length && i < startIndex + 20; i++) {
    const line = lines[i];
    
    if (line.includes('<TELL')) {
      inMessage = true;
      // Check if message starts on same line
      const match = line.match(/<TELL\s+"([^"]+)"/);
      if (match) {
        message = match[1];
        if (line.includes('CR>')) {
          break;
        }
        continue;
      }
    }
    
    if (inMessage) {
      // Extract quoted strings
      const match = line.match(/"([^"]+)"/);
      if (match) {
        if (message) message += ' ';
        message += match[1];
      }
      
      // Check for end of TELL
      if (line.includes('CR>') || line.includes('>)')) {
        break;
      }
    }
  }
  
  return message ? cleanMessage(message) : null;
}

/**
 * Extract JIGS-UP message (death message)
 */
function extractJigsUpMessage(line: string): string | null {
  const match = line.match(/<JIGS-UP\s+"([^"]+)"/);
  return match ? cleanMessage(match[1]) : null;
}

/**
 * Extract a quoted string from a line
 */
function extractQuotedString(line: string): string | null {
  const match = line.match(/"([^"]+)"/);
  return match ? cleanMessage(match[1]) : null;
}

/**
 * Get context (function/object name) for a message
 */
function getContext(lines: string[], index: number): string {
  // Look backwards for ROUTINE, OBJECT, or ROOM definition
  for (let i = index; i >= Math.max(0, index - 50); i--) {
    const line = lines[i];
    
    const routineMatch = line.match(/<ROUTINE\s+([A-Z0-9-]+)/);
    if (routineMatch) return `ROUTINE ${routineMatch[1]}`;
    
    const objectMatch = line.match(/<OBJECT\s+([A-Z0-9-]+)/);
    if (objectMatch) return `OBJECT ${objectMatch[1]}`;
    
    const roomMatch = line.match(/<ROOM\s+([A-Z0-9-]+)/);
    if (roomMatch) return `ROOM ${roomMatch[1]}`;
  }
  
  return 'UNKNOWN';
}

/**
 * Clean up message text
 */
function cleanMessage(msg: string): string {
  return msg
    .replace(/\|/g, '\n')  // ZIL uses | for newlines
    .replace(/\\"/g, '"')   // Unescape quotes
    .trim();
}

/**
 * Main extraction function
 */
function main() {
  const zilFiles = [
    '1dungeon.zil',
    '1actions.zil',
    'gglobals.zil',
    'gmain.zil',
    'gverbs.zil',
    'gparser.zil'
  ];
  
  const allMessages: ZilMessage[] = [];
  
  for (const file of zilFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`Extracting messages from ${file}...`);
      const messages = extractMessagesFromFile(filePath);
      allMessages.push(...messages);
      console.log(`  Found ${messages.length} messages`);
    } else {
      console.log(`  Skipping ${file} (not found)`);
    }
  }
  
  console.log(`\nTotal messages extracted: ${allMessages.length}`);
  
  // Group by type
  const byType = allMessages.reduce((acc, msg) => {
    acc[msg.type] = (acc[msg.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\nMessages by type:');
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }
  
  // Save to JSON for analysis
  const outputPath = path.join(process.cwd(), '.kiro/testing/zil-messages.json');
  fs.writeFileSync(outputPath, JSON.stringify(allMessages, null, 2));
  console.log(`\nMessages saved to: ${outputPath}`);
  
  // Generate a sample report
  console.log('\n=== Sample Messages ===\n');
  allMessages.slice(0, 10).forEach(msg => {
    console.log(`[${msg.type}] ${msg.context} (${msg.file}:${msg.line})`);
    console.log(`  "${msg.message}"`);
    console.log();
  });
}

main();
