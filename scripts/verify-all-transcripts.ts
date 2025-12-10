#!/usr/bin/env tsx

/**
 * Batch Transcript Verification Tool
 * 
 * Processes multiple transcripts and generates summary reports.
 * Supports category filtering and detailed reporting.
 * 
 * Usage:
 *   npx tsx scripts/verify-all-transcripts.ts
 *   npx tsx scripts/verify-all-transcripts.ts --category critical
 *   npx tsx scripts/verify-all-transcripts.ts --priority high
 *   npx tsx scripts/verify-all-transcripts.ts --report
 */

import * as fs from 'fs';
import * as path from 'path';
import { createInitialGameState } from '../src/game/factories/gameFactory.js';
import { CommandExecutor } from '../src/engine/executor.js';
import { Parser } from '../src/parser/parser.js';
import { Lexer } from '../src/parser/lexer.js';
import { Vocabulary } from '../src/parser/vocabulary.js';
import { GameState } from '../src/game/state.js';
import { GameObjectImpl } from '../src/game/objects.js';
import { ObjectFlag } from '../src/game/data/flags.js';
import { ALL_ROOMS } from '../src/game/data/rooms-complete.js';
import { ALL_OBJECTS } from '../src/game/data/objects-complete.js';
import { enableDeterministicRandom, resetDeterministicRandom } from '../src/testing/seededRandom.js';
import { initializeLampTimer, initializeCandleTimer } from '../src/engine/daemons.js';

interface TranscriptEntry {
  command: string;
  expectedOutput: string;
  notes?: string;
  stateChecks?: StateCheck[];
}

interface StateCheck {
  type: 'flag' | 'object' | 'room' | 'inventory' | 'score';
  target: string;
  expectedValue: any;
}

interface Transcript {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  setupCommands?: string[];
  entries: TranscriptEntry[];
  metadata?: {
    created?: string;
    source?: string;
    verified?: boolean;
  };
}

interface ComparisonResult {
  transcriptId: string;
  name: string;
  category: string;
  priority: string;
  passed: boolean;
  totalCommands: number;
  matchedCommands: number;
  averageSimilarity: number;
  differences: Difference[];
  executionTime: number;
}

interface Difference {
  commandIndex: number;
  command: string;
  expected: string;
  actual: string;
  similarity: number;
  category: 'text' | 'state' | 'error';
  severity: 'critical' | 'major' | 'minor';
}

interface SummaryReport {
  totalTranscripts: number;
  passedTranscripts: number;
  failedTranscripts: number;
  totalCommands: number;
  matchedCommands: number;
  overallPassRate: number;
  averageSimilarity: number;
  byCategory: Record<string, CategoryStats>;
  byPriority: Record<string, CategoryStats>;
  results: ComparisonResult[];
  executionTime: number;
}

interface CategoryStats {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  averageSimilarity: number;
}

class BatchTranscriptVerifier {
  private lexer: Lexer;
  private vocabulary: Vocabulary;
  private parser: Parser;
  private executor: CommandExecutor;

  constructor() {
    this.lexer = new Lexer();
    this.vocabulary = new Vocabulary();
    this.parser = new Parser();
    this.executor = new CommandExecutor();
  }

  /**
   * Get available objects for parsing (in current room, inventory, and open containers)
   */
  private getAvailableObjects(state: GameState): GameObjectImpl[] {
    const available: GameObjectImpl[] = [];
    const addedIds = new Set<string>();

    // Add inventory objects
    for (const objId of state.inventory) {
      if (!addedIds.has(objId)) {
        const obj = state.getObject(objId);
        if (obj) {
          available.push(obj as GameObjectImpl);
          addedIds.add(objId);
          
          // If this is an open container in inventory, add its contents too
          if (obj.hasFlag(ObjectFlag.CONTBIT) && obj.hasFlag(ObjectFlag.OPENBIT)) {
            const contents = state.getObjectsInContainer(objId);
            for (const contentObj of contents) {
              if (!addedIds.has(contentObj.id)) {
                available.push(contentObj as GameObjectImpl);
                addedIds.add(contentObj.id);
              }
            }
          }
        }
      }
    }

    // Add objects in current room
    const room = state.getCurrentRoom();
    if (room) {
      for (const objId of room.objects) {
        if (!addedIds.has(objId)) {
          const obj = state.getObject(objId);
          if (obj) {
            available.push(obj as GameObjectImpl);
            addedIds.add(objId);
            
            // If this is an open container, add its contents too
            if (obj.hasFlag(ObjectFlag.CONTBIT) && obj.hasFlag(ObjectFlag.OPENBIT)) {
              const contents = state.getObjectsInContainer(objId);
              for (const contentObj of contents) {
                if (!addedIds.has(contentObj.id)) {
                  available.push(contentObj as GameObjectImpl);
                  addedIds.add(contentObj.id);
                }
              }
            }
          }
        }
      }
      
      // Add global objects for this room (like TREE, FOREST, etc.)
      const roomData = ALL_ROOMS[room.id];
      if (roomData && roomData.globalObjects) {
        for (const objId of roomData.globalObjects) {
          if (!addedIds.has(objId)) {
            const obj = state.getObject(objId);
            if (obj) {
              available.push(obj as GameObjectImpl);
              addedIds.add(objId);
            }
          }
        }
      }
    }

    // Add only truly global scenery objects (from GLOBAL-OBJECTS, not LOCAL-GLOBALS)
    // LOCAL-GLOBALS objects should only be available in rooms that list them in globalObjects
    for (const [objId, obj] of state.objects.entries()) {
      if (!addedIds.has(objId) && obj.location === null && obj.hasFlag(ObjectFlag.NDESCBIT)) {
        // Check the original object data to see if it's from GLOBAL-OBJECTS
        const objData = ALL_OBJECTS[objId];
        if (objData && objData.initialLocation === 'GLOBAL-OBJECTS') {
          available.push(obj as GameObjectImpl);
          addedIds.add(objId);
        }
      }
    }

    return available;
  }

  /**
   * Execute a command and return the output
   */
  private executeCommand(command: string, state: GameState): string {
    try {
      // Handle debug commands for setup
      if (command.startsWith('teleport ')) {
        const roomId = command.substring(9).trim();
        state.currentRoom = roomId;
        return `[DEBUG: Teleported to ${roomId}]`;
      }
      
      if (command.startsWith('give ') && !command.includes(' to ')) {
        // Debug command: "give OBJECTID" (not "give X to Y")
        const objectId = command.substring(5).trim();
        const obj = state.getObject(objectId);
        if (obj) {
          state.moveObject(objectId, 'PLAYER');
          return `[DEBUG: Given ${objectId}]`;
        }
        return `[DEBUG: Object ${objectId} not found]`;
      }
      
      if (command.startsWith('turnoff ')) {
        const objectId = command.substring(8).trim();
        const obj = state.getObject(objectId) as GameObjectImpl;
        if (obj) {
          obj.removeFlag(ObjectFlag.ONBIT);
          return `[DEBUG: Turned off ${objectId}]`;
        }
        return `[DEBUG: Object ${objectId} not found]`;
      }
      
      if (command.startsWith('turnon ')) {
        const objectId = command.substring(7).trim();
        const obj = state.getObject(objectId) as GameObjectImpl;
        if (obj) {
          obj.addFlag(ObjectFlag.ONBIT);
          
          // Initialize lamp timer if this is the lamp
          if (objectId === 'LAMP') {
            initializeLampTimer(state);
          }
          
          return `[DEBUG: Turned on ${objectId}]`;
        }
        return `[DEBUG: Object ${objectId} not found]`;
      }
      
      // Debug command: "light OBJECTID" (without "with" - that's a game command)
      if (command.startsWith('light ') && !command.includes(' with ')) {
        const objectId = command.substring(6).trim();
        const obj = state.getObject(objectId) as GameObjectImpl;
        if (obj) {
          obj.addFlag(ObjectFlag.ONBIT);
          
          // Initialize candle timer if this is the candles
          if (objectId === 'CANDLES') {
            initializeCandleTimer(state);
          }
          
          return `[DEBUG: Lit ${objectId}]`;
        }
        return `[DEBUG: Object ${objectId} not found]`;
      }
      
      if (command.startsWith('advance ')) {
        const turns = parseInt(command.substring(8).trim());
        if (!isNaN(turns) && turns > 0) {
          // Capture console output from daemons
          const originalLog = console.log;
          let daemonOutput = '';
          
          console.log = (...args: any[]) => {
            daemonOutput += args.join(' ') + '\n';
          };
          
          try {
            for (let i = 0; i < turns; i++) {
              state.eventSystem.processTurn(state);
            }
          } finally {
            console.log = originalLog;
          }
          
          let result = `[DEBUG: Advanced ${turns} turns to turn ${state.moves}]`;
          if (daemonOutput.trim()) {
            result += '\n' + daemonOutput.trim();
          }
          
          return result;
        }
        return `[DEBUG: Invalid turn count]`;
      }
      
      if (command.startsWith('setlampstage ')) {
        const stage = parseInt(command.substring(13).trim());
        if (!isNaN(stage) && stage >= 0 && stage <= 3) {
          state.setGlobalVariable('LAMP_STAGE_INDEX', stage);
          
          // Set up the lamp event for the next stage
          const events = (state as any).eventSystem.events;
          const lampEvent = events.get('I-LANTERN');
          if (lampEvent) {
            const stageTicks = [100, 70, 15, 0];
            const nextStageTicks = [30, 55, 15, 0]; // Ticks until next stage
            
            if (stage < 3) {
              lampEvent.ticksRemaining = nextStageTicks[stage];
              lampEvent.enabled = true;
            } else {
              lampEvent.enabled = false;
            }
          }
          
          return `[DEBUG: Set lamp to stage ${stage}]`;
        }
        return `[DEBUG: Invalid stage (0-3)]`;
      }

      if (command.startsWith('setlampfuel ')) {
        const turns = parseInt(command.substring(12).trim());
        if (!isNaN(turns) && turns >= 0 && turns <= 200) {
          // Calculate which stage we should be in based on fuel remaining
          let stage = 0;
          let ticksRemaining = 0;
          
          if (turns > 100) {
            // Stage 0: Initial stage, warning at turn 100
            stage = 0;
            ticksRemaining = 200 - turns; // Turns until first warning
          } else if (turns > 70) {
            // Stage 1: First warning given, next at turn 130 (when fuel = 70)
            stage = 1;
            ticksRemaining = 100 - turns; // Turns until second warning
          } else if (turns > 15) {
            // Stage 2: Second warning given, next at turn 185 (when fuel = 15)
            stage = 2;
            ticksRemaining = 70 - turns; // Turns until third warning
          } else if (turns > 0) {
            // Stage 3: Third warning given, lamp dies at turn 200 (when fuel = 0)
            stage = 3;
            ticksRemaining = 15 - turns; // Turns until lamp dies
          } else {
            // Lamp is dead
            stage = 4;
            ticksRemaining = 0;
          }
          
          state.setGlobalVariable('LAMP_STAGE_INDEX', stage);
          
          // Set up the lamp event
          const events = (state as any).eventSystem.events;
          const lampEvent = events.get('I-LANTERN');
          if (lampEvent && stage < 4) {
            lampEvent.ticksRemaining = ticksRemaining;
            lampEvent.enabled = true;
          } else if (lampEvent) {
            lampEvent.enabled = false;
          }
          
          return `[DEBUG: Set lamp fuel to ${turns} turns (stage ${stage}, next event in ${ticksRemaining} turns)]`;
        }
        return `[DEBUG: Invalid fuel level (0-200)]`;
      }

      if (command.startsWith('setcandlefuel ')) {
        const turns = parseInt(command.substring(14).trim());
        if (!isNaN(turns) && turns >= 0 && turns <= 40) {
          // Calculate which stage we should be in based on fuel remaining
          let stage = 0;
          let ticksRemaining = 0;
          
          // For testing purposes, set up the interrupt to trigger on next advance
          // This allows us to test specific warning messages
          if (turns === 21) {
            // Set up to trigger first warning on next advance
            stage = 0;
            ticksRemaining = 1;
          } else if (turns === 11) {
            // Set up to trigger second warning on next advance
            stage = 1;
            ticksRemaining = 1;
          } else if (turns === 6) {
            // Set up to trigger third warning on next advance
            stage = 2;
            ticksRemaining = 1;
          } else if (turns === 1) {
            // Set up to trigger death on next advance
            stage = 3;
            ticksRemaining = 1;
          } else {
            // Default behavior - calculate based on fuel level
            if (turns > 20) {
              stage = 0;
              ticksRemaining = turns - 20;
            } else if (turns > 10) {
              stage = 1;
              ticksRemaining = turns - 10;
            } else if (turns > 5) {
              stage = 2;
              ticksRemaining = turns - 5;
            } else if (turns > 0) {
              stage = 3;
              ticksRemaining = turns;
            } else {
              stage = 4;
              ticksRemaining = 0;
            }
          }
          
          state.setGlobalVariable('CANDLE_STAGE_INDEX', stage);
          
          // Set up the candle event
          const events = (state as any).eventSystem.events;
          const candleEvent = events.get('I-CANDLES');
          if (candleEvent && stage < 4) {
            candleEvent.ticksRemaining = ticksRemaining;
            candleEvent.enabled = true;
          } else if (candleEvent) {
            candleEvent.enabled = false;
          }
          
          return `[DEBUG: Set candle fuel to ${turns} turns (stage ${stage}, next event in ${ticksRemaining} turns)]`;
        }
        return `[DEBUG: Invalid fuel level (0-40)]`;
      }

      if (command.startsWith('setnpcposition ')) {
        const parts = command.substring(15).trim().split(' ');
        if (parts.length >= 2) {
          const npcId = parts[0].toUpperCase();
          const roomId = parts[1].toUpperCase();
          
          // Check if NPC exists
          const npc = state.getObject(npcId);
          if (!npc) {
            return `[DEBUG: NPC ${npcId} not found]`;
          }
          
          // Check if room exists
          const room = state.getRoom(roomId);
          if (!room) {
            return `[DEBUG: Room ${roomId} not found]`;
          }
          
          // Move NPC to room
          state.moveObject(npcId, roomId);
          
          // Special handling for thief - update thief state
          if (npcId === 'THIEF') {
            state.setGlobalVariable('THIEF_ROOM', roomId);
          }
          
          return `[DEBUG: Moved ${npcId} to ${roomId}]`;
        }
        return `[DEBUG: Usage: setnpcposition <npc> <room>]`;
      }

      if (command.startsWith('triggerdaemon ')) {
        const daemonName = command.substring(14).trim().toUpperCase();
        
        // Get the event system
        const events = (state as any).eventSystem.events;
        
        if (daemonName === 'LAMP' || daemonName === 'I-LANTERN') {
          const lampEvent = events.get('I-LANTERN');
          if (lampEvent && lampEvent.enabled) {
            // Trigger the lamp daemon immediately
            lampEvent.ticksRemaining = 0;
            state.eventSystem.processTurn(state);
            return `[DEBUG: Triggered lamp daemon]`;
          }
          return `[DEBUG: Lamp daemon not enabled or not found]`;
        }
        
        if (daemonName === 'CANDLE' || daemonName === 'I-CANDLES') {
          const candleEvent = events.get('I-CANDLES');
          if (candleEvent && candleEvent.enabled) {
            // Trigger the candle daemon immediately
            candleEvent.ticksRemaining = 0;
            state.eventSystem.processTurn(state);
            return `[DEBUG: Triggered candle daemon]`;
          }
          return `[DEBUG: Candle daemon not enabled or not found]`;
        }
        
        if (daemonName === 'THIEF' || daemonName === 'I-THIEF') {
          const thiefEvent = events.get('I-THIEF');
          if (thiefEvent && thiefEvent.enabled) {
            // Trigger the thief daemon immediately
            state.eventSystem.processTurn(state);
            return `[DEBUG: Triggered thief daemon]`;
          }
          return `[DEBUG: Thief daemon not enabled or not found]`;
        }
        
        if (daemonName === 'COMBAT') {
          const combatEvent = events.get('combat');
          if (combatEvent && combatEvent.enabled) {
            // Trigger the combat daemon immediately
            state.eventSystem.processTurn(state);
            return `[DEBUG: Triggered combat daemon]`;
          }
          return `[DEBUG: Combat daemon not enabled or not found]`;
        }
        
        return `[DEBUG: Unknown daemon: ${daemonName}. Available: LAMP, CANDLE, THIEF, COMBAT]`;
      }

      // Handle "look at X" as "examine X"
      let processedCommand = command;
      if (/^look\s+at\s+/i.test(command)) {
        processedCommand = command.replace(/^look\s+at\s+/i, 'examine ');
      }

      const tokens = this.lexer.tokenize(processedCommand);
      
      const processedTokens = tokens.map(token => {
        const expandedWord = this.vocabulary.expandAbbreviation(token.word);
        return {
          ...token,
          word: expandedWord,
          type: this.vocabulary.lookupWord(expandedWord),
        };
      });

      // Use getAvailableObjects to include open container contents
      const availableObjects = this.getAvailableObjects(state);
      const parsedCommand = this.parser.parse(processedTokens, availableObjects);

      const result = this.executor.execute(parsedCommand, state);

      return result.message || '';
    } catch (error) {
      return `ERROR: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Normalize whitespace in a string
   * Collapses all whitespace (including newlines within paragraphs) to single spaces
   * but preserves paragraph breaks (double newlines)
   */
  private normalizeWhitespace(str: string): string {
    return str
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Preserve paragraph breaks (double newlines) by replacing with placeholder
      .replace(/\n\n+/g, '<<PARA>>')
      // Collapse single newlines and spaces to single space
      .replace(/\n/g, ' ')
      .replace(/[ \t]+/g, ' ')
      // Restore paragraph breaks
      .replace(/<<PARA>>/g, '\n\n')
      .trim();
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const norm1 = this.normalizeWhitespace(str1.toLowerCase());
    const norm2 = this.normalizeWhitespace(str2.toLowerCase());

    if (norm1 === norm2) return 1.0;

    // Calculate character-level similarity
    const maxLen = Math.max(norm1.length, norm2.length);
    if (maxLen === 0) return 1.0;

    let matches = 0;
    const minLen = Math.min(norm1.length, norm2.length);
    
    for (let i = 0; i < minLen; i++) {
      if (norm1[i] === norm2[i]) matches++;
    }

    return matches / maxLen;
  }

  /**
   * Compare game output against a transcript
   */
  public compareTranscript(transcript: Transcript): ComparisonResult {
    const startTime = Date.now();
    
    // Enable deterministic random for consistent combat outcomes
    enableDeterministicRandom(12345);
    
    const state = createInitialGameState();
    const differences: Difference[] = [];
    let matchedCommands = 0;
    let totalSimilarity = 0;

    // Execute setup commands if provided
    if (transcript.setupCommands && transcript.setupCommands.length > 0) {
      for (const setupCmd of transcript.setupCommands) {
        this.executeCommand(setupCmd, state);
      }
    }

    for (let i = 0; i < transcript.entries.length; i++) {
      const entry = transcript.entries[i];
      
      const actualOutput = this.executeCommand(entry.command, state);
      const similarity = this.calculateSimilarity(entry.expectedOutput, actualOutput);
      totalSimilarity += similarity;

      if (similarity >= 0.98) {
        matchedCommands++;
      } else {
        const severity = similarity < 0.5 ? 'critical' : similarity < 0.8 ? 'major' : 'minor';
        differences.push({
          commandIndex: i,
          command: entry.command,
          expected: entry.expectedOutput,
          actual: actualOutput,
          similarity,
          category: 'text',
          severity
        });
      }
    }

    const executionTime = Date.now() - startTime;
    const averageSimilarity = transcript.entries.length > 0 
      ? totalSimilarity / transcript.entries.length 
      : 0;

    return {
      transcriptId: transcript.id,
      name: transcript.name,
      category: transcript.category,
      priority: transcript.priority,
      passed: differences.length === 0,
      totalCommands: transcript.entries.length,
      matchedCommands,
      averageSimilarity,
      differences,
      executionTime
    };
  }

  /**
   * Find all transcript files in a directory
   */
  private findTranscriptFiles(dir: string): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...this.findTranscriptFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Load transcript from JSON file
   */
  private loadTranscript(filePath: string): Transcript | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error loading transcript ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Filter transcripts by category or priority
   */
  private filterTranscripts(
    transcripts: Transcript[], 
    category?: string, 
    priority?: string
  ): Transcript[] {
    let filtered = transcripts;
    
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }
    
    if (priority) {
      filtered = filtered.filter(t => t.priority === priority);
    }
    
    return filtered;
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(results: ComparisonResult[], executionTime: number): SummaryReport {
    const totalTranscripts = results.length;
    const passedTranscripts = results.filter(r => r.passed).length;
    const failedTranscripts = totalTranscripts - passedTranscripts;
    const totalCommands = results.reduce((sum, r) => sum + r.totalCommands, 0);
    const matchedCommands = results.reduce((sum, r) => sum + r.matchedCommands, 0);
    const overallPassRate = totalTranscripts > 0 ? passedTranscripts / totalTranscripts : 0;
    const averageSimilarity = results.length > 0
      ? results.reduce((sum, r) => sum + r.averageSimilarity, 0) / results.length
      : 0;

    // Group by category
    const byCategory: Record<string, CategoryStats> = {};
    for (const result of results) {
      if (!byCategory[result.category]) {
        byCategory[result.category] = {
          total: 0,
          passed: 0,
          failed: 0,
          passRate: 0,
          averageSimilarity: 0
        };
      }
      byCategory[result.category].total++;
      if (result.passed) {
        byCategory[result.category].passed++;
      } else {
        byCategory[result.category].failed++;
      }
    }

    // Calculate category stats
    for (const category in byCategory) {
      const stats = byCategory[category];
      stats.passRate = stats.total > 0 ? stats.passed / stats.total : 0;
      const categoryResults = results.filter(r => r.category === category);
      stats.averageSimilarity = categoryResults.length > 0
        ? categoryResults.reduce((sum, r) => sum + r.averageSimilarity, 0) / categoryResults.length
        : 0;
    }

    // Group by priority
    const byPriority: Record<string, CategoryStats> = {};
    for (const result of results) {
      if (!byPriority[result.priority]) {
        byPriority[result.priority] = {
          total: 0,
          passed: 0,
          failed: 0,
          passRate: 0,
          averageSimilarity: 0
        };
      }
      byPriority[result.priority].total++;
      if (result.passed) {
        byPriority[result.priority].passed++;
      } else {
        byPriority[result.priority].failed++;
      }
    }

    // Calculate priority stats
    for (const priority in byPriority) {
      const stats = byPriority[priority];
      stats.passRate = stats.total > 0 ? stats.passed / stats.total : 0;
      const priorityResults = results.filter(r => r.priority === priority);
      stats.averageSimilarity = priorityResults.length > 0
        ? priorityResults.reduce((sum, r) => sum + r.averageSimilarity, 0) / priorityResults.length
        : 0;
    }

    return {
      totalTranscripts,
      passedTranscripts,
      failedTranscripts,
      totalCommands,
      matchedCommands,
      overallPassRate,
      averageSimilarity,
      byCategory,
      byPriority,
      results,
      executionTime
    };
  }

  /**
   * Print summary report to console
   */
  private printSummary(summary: SummaryReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('TRANSCRIPT VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    
    console.log('\nOverall Results:');
    console.log(`  Total Transcripts: ${summary.totalTranscripts}`);
    console.log(`  Passed: ${summary.passedTranscripts} (${(summary.overallPassRate * 100).toFixed(1)}%)`);
    console.log(`  Failed: ${summary.failedTranscripts}`);
    console.log(`  Total Commands: ${summary.totalCommands}`);
    console.log(`  Matched Commands: ${summary.matchedCommands} (${((summary.matchedCommands / summary.totalCommands) * 100).toFixed(1)}%)`);
    console.log(`  Average Similarity: ${(summary.averageSimilarity * 100).toFixed(1)}%`);
    console.log(`  Execution Time: ${(summary.executionTime / 1000).toFixed(2)}s`);

    console.log('\nBy Category:');
    for (const [category, stats] of Object.entries(summary.byCategory)) {
      console.log(`  ${category}:`);
      console.log(`    Total: ${stats.total}, Passed: ${stats.passed}, Failed: ${stats.failed}`);
      console.log(`    Pass Rate: ${(stats.passRate * 100).toFixed(1)}%`);
      console.log(`    Avg Similarity: ${(stats.averageSimilarity * 100).toFixed(1)}%`);
    }

    console.log('\nBy Priority:');
    for (const [priority, stats] of Object.entries(summary.byPriority)) {
      console.log(`  ${priority}:`);
      console.log(`    Total: ${stats.total}, Passed: ${stats.passed}, Failed: ${stats.failed}`);
      console.log(`    Pass Rate: ${(stats.passRate * 100).toFixed(1)}%`);
      console.log(`    Avg Similarity: ${(stats.averageSimilarity * 100).toFixed(1)}%`);
    }

    console.log('\nFailed Transcripts:');
    const failed = summary.results.filter(r => !r.passed);
    if (failed.length === 0) {
      console.log('  None! All transcripts passed.');
    } else {
      for (const result of failed) {
        console.log(`  - ${result.transcriptId}: ${result.name}`);
        console.log(`    Category: ${result.category}, Priority: ${result.priority}`);
        console.log(`    Matched: ${result.matchedCommands}/${result.totalCommands} (${(result.averageSimilarity * 100).toFixed(1)}%)`);
        console.log(`    Differences: ${result.differences.length}`);
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  /**
   * Save summary report to JSON file
   */
  private saveSummaryReport(summary: SummaryReport, outputPath: string): void {
    const reportDir = path.dirname(outputPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    console.log(`Summary report saved to: ${outputPath}`);
  }

  /**
   * Run batch verification
   */
  public async verifyAll(
    transcriptDir: string,
    category?: string,
    priority?: string,
    saveReport?: boolean
  ): Promise<SummaryReport> {
    const startTime = Date.now();

    console.log('='.repeat(80));
    console.log('BATCH TRANSCRIPT VERIFICATION');
    console.log('='.repeat(80));
    console.log(`\nTranscript Directory: ${transcriptDir}`);
    if (category) console.log(`Filter by Category: ${category}`);
    if (priority) console.log(`Filter by Priority: ${priority}`);
    console.log();

    // Find all transcript files
    const transcriptFiles = this.findTranscriptFiles(transcriptDir);
    console.log(`Found ${transcriptFiles.length} transcript files\n`);

    // Load transcripts
    const transcripts: Transcript[] = [];
    for (const file of transcriptFiles) {
      const transcript = this.loadTranscript(file);
      if (transcript) {
        transcripts.push(transcript);
      }
    }

    // Filter transcripts
    const filteredTranscripts = this.filterTranscripts(transcripts, category, priority);
    console.log(`Processing ${filteredTranscripts.length} transcripts after filtering\n`);

    // Compare each transcript
    const results: ComparisonResult[] = [];
    for (let i = 0; i < filteredTranscripts.length; i++) {
      const transcript = filteredTranscripts[i];
      console.log(`[${i + 1}/${filteredTranscripts.length}] Verifying: ${transcript.name}`);
      
      const result = this.compareTranscript(transcript);
      results.push(result);
      
      const status = result.passed ? '✓ PASSED' : '✗ FAILED';
      console.log(`  ${status} - ${result.matchedCommands}/${result.totalCommands} commands (${(result.averageSimilarity * 100).toFixed(1)}% similarity)`);
    }

    const executionTime = Date.now() - startTime;
    const summary = this.generateSummary(results, executionTime);

    // Print summary
    this.printSummary(summary);

    // Save report if requested
    if (saveReport) {
      const reportPath = path.join('.kiro', 'testing', 'transcript-verification-summary.json');
      this.saveSummaryReport(summary, reportPath);
    }

    return summary;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  let category: string | undefined;
  let priority: string | undefined;
  let saveReport = false;
  let transcriptDir = path.join('.kiro', 'transcripts');

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category' && i + 1 < args.length) {
      category = args[++i];
    } else if (args[i] === '--priority' && i + 1 < args.length) {
      priority = args[++i];
    } else if (args[i] === '--report') {
      saveReport = true;
    } else if (args[i] === '--dir' && i + 1 < args.length) {
      transcriptDir = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage:');
      console.log('  npx tsx scripts/verify-all-transcripts.ts [options]');
      console.log('\nOptions:');
      console.log('  --category <name>   Filter by category (e.g., puzzle, combat)');
      console.log('  --priority <level>  Filter by priority (critical, high, medium, low)');
      console.log('  --report            Save summary report to JSON file');
      console.log('  --dir <path>        Transcript directory (default: .kiro/transcripts)');
      console.log('  --help, -h          Show this help message');
      process.exit(0);
    }
  }

  const verifier = new BatchTranscriptVerifier();
  const summary = await verifier.verifyAll(transcriptDir, category, priority, saveReport);

  // Exit with appropriate code
  process.exit(summary.failedTranscripts > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
