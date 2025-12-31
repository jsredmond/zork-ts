/**
 * Analyze status bar differences between TS and ZM implementations
 */

import { ZMachineRecorder } from '../src/testing/recording/zmRecorder.js';
import { loadZMachineConfig } from '../src/testing/recording/config.js';
import { StatusBarNormalizer } from '../src/parity/StatusBarNormalizer.js';
import { Terminal } from '../src/io/terminal.js';

function analyzeStatusBarFormat(line: string, label: string): void {
  console.log(`${label}:`);
  console.log(`  Full line: "${line}"`);
  console.log(`  Length: ${line.length}`);
  
  // Find Score: position
  const scorePos = line.indexOf('Score:');
  const movesPos = line.indexOf('Moves:');
  
  if (scorePos >= 0) {
    console.log(`  Score: position: ${scorePos}`);
    const roomName = line.substring(0, scorePos).trimEnd();
    console.log(`  Room name: "${roomName}" (length: ${roomName.length})`);
    
    // Extract score value
    const scoreMatch = line.match(/Score:\s*(-?\d+)/);
    if (scoreMatch) {
      console.log(`  Score value: ${scoreMatch[1]}`);
    }
  }
  
  if (movesPos >= 0) {
    console.log(`  Moves: position: ${movesPos}`);
    
    // Extract moves value
    const movesMatch = line.match(/Moves:\s*(\d+)/);
    if (movesMatch) {
      console.log(`  Moves value: ${movesMatch[1]}`);
    }
    
    // Calculate spacing between Score and Moves
    if (scorePos >= 0) {
      const scoreEndMatch = line.match(/Score:\s*-?\d+/);
      if (scoreEndMatch) {
        const scoreEnd = scorePos + scoreEndMatch[0].length;
        const spacing = movesPos - scoreEnd;
        console.log(`  Spacing between Score and Moves: ${spacing} chars`);
      }
    }
  }
}

async function analyzeStatusBars() {
  const commands = ['look', 'n', 'look'];
  
  console.log('=== Status Bar Format Comparison ===\n');
  
  // Test StatusBarNormalizer formatting
  const normalizer = new StatusBarNormalizer();
  const normalizerFormatted = normalizer.formatStatusBarExactly('West of House', 0, 1);
  analyzeStatusBarFormat(normalizerFormatted, 'StatusBarNormalizer.formatStatusBarExactly()');
  console.log('');
  
  // Test Terminal formatting
  const terminal = new Terminal();
  const terminalFormatted = terminal.formatStatusBar('West of House', 0, 1);
  analyzeStatusBarFormat(terminalFormatted, 'Terminal.formatStatusBar()');
  console.log('');
  
  // Record Z-Machine output
  try {
    const zmConfig = await loadZMachineConfig();
    const zmRecorder = new ZMachineRecorder(zmConfig);
    
    if (await zmRecorder.isAvailable()) {
      const zmTranscript = await zmRecorder.record(commands, { seed: 12345 });
      
      // Find first status bar
      for (const entry of zmTranscript.entries) {
        const lines = entry.output.split('\n');
        for (const line of lines) {
          if (line.includes('Score:') && line.includes('Moves:') && !line.startsWith(' ')) {
            analyzeStatusBarFormat(line, 'Z-Machine actual output');
            break;
          }
        }
        break;
      }
      
      // Compare formats
      console.log('\n=== Format Comparison ===');
      console.log(`StatusBarNormalizer matches Terminal: ${normalizerFormatted === terminalFormatted}`);
      
    } else {
      console.log('\nZ-Machine not available');
    }
  } catch (e) {
    console.log('\nZ-Machine error:', e);
  }
}

analyzeStatusBars().catch(console.error);
