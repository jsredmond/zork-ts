/**
 * Terminal I/O handling
 * Manages user input and output display
 */

import * as readline from 'readline';

/**
 * Terminal class handles user input and output for the game
 * Uses readline for input and provides formatted output methods
 */
export class Terminal {
  private rl: readline.Interface | null = null;
  private isRunning: boolean = false;
  private cursorBlinkTimer: NodeJS.Timeout | null = null;
  private cursorVisible: boolean = true;
  private isTyping: boolean = false;

  /**
   * Initialize the terminal interface
   */
  initialize(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });

    // Handle CTRL+C gracefully
    this.rl.on('SIGINT', () => {
      this.handleInterrupt();
    });

    // Listen for input to stop cursor blinking when user types
    if (process.stdin.isTTY) {
      process.stdin.on('data', () => {
        this.isTyping = true;
        this.stopCursorBlink();
      });
    }

    this.isRunning = true;
  }

  /**
   * Handle CTRL+C interrupt gracefully
   */
  private handleInterrupt(): void {
    this.writeLine('\n\nDo you really want to quit? (yes/no)');
    if (this.rl) {
      this.rl.question('> ', (answer) => {
        const response = answer.trim().toLowerCase();
        if (response === 'yes' || response === 'y') {
          this.writeLine('Thanks for playing!');
          this.close();
          process.exit(0);
        } else {
          this.writeLine('Continuing game...');
          if (this.rl) {
            this.rl.prompt();
          }
        }
      });
    }
  }

  /**
   * Read a line of input from the user
   * @param callback - Function to call with the input line
   */
  readLine(callback: (input: string) => void): void {
    if (!this.rl) {
      throw new Error('Terminal not initialized');
    }

    this.rl.question('', (answer) => {
      this.stopCursorBlink();
      callback(answer);
    });
  }

  /**
   * Write text to the terminal
   * @param text - Text to write
   */
  write(text: string): void {
    if (process.stdout.writable) {
      process.stdout.write(text);
    }
  }

  /**
   * Write a line of text to the terminal (with newline)
   * @param text - Text to write
   */
  writeLine(text: string): void {
    this.write(text + '\n');
  }

  /**
   * Write multiple lines of text
   * @param lines - Array of text lines to write
   */
  writeLines(lines: string[]): void {
    lines.forEach(line => this.writeLine(line));
  }

  /**
   * Display the command prompt
   */
  showPrompt(): void {
    if (this.rl) {
      this.rl.prompt();
      this.isTyping = false;
      this.startCursorBlink();
    }
  }

  /**
   * Start blinking cursor animation
   */
  private startCursorBlink(): void {
    // Only blink if terminal supports it
    if (!process.stdout.isTTY) {
      return;
    }

    // Clear any existing timer
    this.stopCursorBlink();

    // Show cursor initially
    this.showCursor();

    // Start blinking at 500ms interval
    this.cursorBlinkTimer = setInterval(() => {
      if (!this.isTyping) {
        if (this.cursorVisible) {
          this.hideCursor();
        } else {
          this.showCursor();
        }
        this.cursorVisible = !this.cursorVisible;
      }
    }, 500);
  }

  /**
   * Stop blinking cursor animation
   */
  private stopCursorBlink(): void {
    if (this.cursorBlinkTimer) {
      clearInterval(this.cursorBlinkTimer);
      this.cursorBlinkTimer = null;
    }
    // Ensure cursor is visible when stopping
    this.showCursor();
    this.cursorVisible = true;
  }

  /**
   * Show the cursor
   */
  private showCursor(): void {
    if (process.stdout.isTTY) {
      this.write('\x1b[?25h'); // Show cursor
    }
  }

  /**
   * Hide the cursor
   */
  private hideCursor(): void {
    if (process.stdout.isTTY) {
      this.write('\x1b[?25l'); // Hide cursor
    }
  }

  /**
   * Display status bar with score and moves
   * @param score - Current score
   * @param moves - Number of moves
   */
  showStatusBar(score: number, moves: number): void {
    const statusText = `Score: ${score}    Moves: ${moves}`;
    const terminalWidth = process.stdout.columns || 80;
    const padding = ' '.repeat(Math.max(0, terminalWidth - statusText.length));
    
    // Save cursor position, move to top right, write status, restore cursor
    this.write('\x1b[s'); // Save cursor position
    this.write('\x1b[1;1H'); // Move to top-left
    this.write('\x1b[K'); // Clear line
    this.write(padding + statusText); // Write status right-aligned
    this.write('\x1b[u'); // Restore cursor position
  }

  /**
   * Clear the terminal screen
   */
  clear(): void {
    // ANSI escape code to clear screen
    this.write('\x1b[2J\x1b[0f');
  }

  /**
   * Check if terminal is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Close the terminal interface
   */
  close(): void {
    this.stopCursorBlink();
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    this.isRunning = false;
  }
}
