/**
 * StatusBarNormalizer - Handles status bar formatting and normalization for parity testing
 * 
 * This module ensures TypeScript output matches Z-Machine output by:
 * 1. Removing status bar contamination from game responses
 * 2. Providing exact Z-Machine status bar formatting when needed
 * 3. Detecting and classifying status bar patterns
 * 4. Handling edge cases (negative scores, long room names, malformed lines)
 * 5. Ensuring idempotent normalization
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

/**
 * Status bar detection result
 */
export interface StatusBarDetection {
  hasStatusBar: boolean;
  roomName?: string;
  score?: number;
  moves?: number;
  lineIndex?: number;
}

/**
 * Normalization result
 */
export interface NormalizationResult {
  normalizedOutput: string;
  statusBarRemoved: boolean;
  detectedStatusBars: StatusBarDetection[];
}

/**
 * StatusBarNormalizer provides comprehensive status bar handling for parity testing
 */
export class StatusBarNormalizer {
  // Z-Machine standard formatting constants
  private static readonly STATUS_LINE_WIDTH = 80;
  private static readonly ROOM_NAME_WIDTH = 49;
  private static readonly SCORE_MOVES_SPACING = 8; // Spaces between Score and Moves
  private static readonly MAX_SCORE = 9999;
  private static readonly MIN_SCORE = -999;
  private static readonly MAX_MOVES = 99999;

  /**
   * Primary status bar pattern matching Z-Machine format
   * Format: "Room Name (padded)    Score: X        Moves: Y"
   * Enhanced to handle:
   * - Negative scores (e.g., Score: -10)
   * - Large move counts
   * - Variable whitespace
   */
  private static readonly STATUS_BAR_PATTERN = /^\s*\S.*\s+Score:\s*-?\d+\s+Moves:\s*\d+\s*$/i;

  /**
   * Pattern to extract status bar components
   * Handles negative scores and various whitespace patterns
   */
  private static readonly STATUS_BAR_EXTRACT_PATTERN = /^(.+?)\s+Score:\s*(-?\d+)\s+Moves:\s*(\d+)\s*$/i;

  /**
   * Alternative patterns for malformed status bars
   * These catch edge cases that don't match the standard format exactly
   */
  private static readonly MALFORMED_PATTERNS = [
    // Score/Moves with different casing
    /^\s*\S.*\s+score:\s*-?\d+\s+moves:\s*\d+\s*$/i,
    // Score/Moves with tabs instead of spaces
    /^\s*\S.*\t+Score:\s*-?\d+\t+Moves:\s*\d+\s*$/i,
    // Score/Moves with minimal spacing
    /^\S.*Score:-?\d+\s*Moves:\d+\s*$/i,
    // Score/Moves at line start (no room name)
    /^\s*Score:\s*-?\d+\s+Moves:\s*\d+\s*$/i,
  ];

  /**
   * Normalize output by removing status bar contamination
   * This is the primary method for parity testing normalization
   */
  normalizeStatusBarOutput(output: string): NormalizationResult {
    const lines = output.split('\n');
    const detectedStatusBars: StatusBarDetection[] = [];
    const filteredLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const detection = this.detectStatusBar(line);

      if (detection.hasStatusBar) {
        detectedStatusBars.push({
          ...detection,
          lineIndex: i
        });
        // Skip this line (remove status bar)
        continue;
      }

      filteredLines.push(line);
    }

    // Clean up leading empty lines that may result from status bar removal
    let normalizedOutput = filteredLines.join('\n');
    normalizedOutput = normalizedOutput.replace(/^\n+/, '');

    return {
      normalizedOutput,
      statusBarRemoved: detectedStatusBars.length > 0,
      detectedStatusBars
    };
  }

  /**
   * Detect if a line contains a status bar
   * Enhanced to handle edge cases:
   * - Negative scores
   * - Long room names (truncated to 49 chars)
   * - Malformed status bar lines
   */
  detectStatusBar(line: string): StatusBarDetection {
    // First try the standard pattern
    if (StatusBarNormalizer.STATUS_BAR_PATTERN.test(line)) {
      return this.extractStatusBarComponents(line);
    }

    // Try malformed patterns
    for (const pattern of StatusBarNormalizer.MALFORMED_PATTERNS) {
      if (pattern.test(line)) {
        return this.extractStatusBarComponents(line);
      }
    }

    return { hasStatusBar: false };
  }

  /**
   * Extract status bar components from a detected status bar line
   */
  private extractStatusBarComponents(line: string): StatusBarDetection {
    const match = line.match(StatusBarNormalizer.STATUS_BAR_EXTRACT_PATTERN);
    if (!match) {
      // Line matches pattern but can't extract components
      // This handles edge cases like Score/Moves at line start
      const scoreMatch = line.match(/Score:\s*(-?\d+)/i);
      const movesMatch = line.match(/Moves:\s*(\d+)/i);
      
      if (scoreMatch && movesMatch) {
        return {
          hasStatusBar: true,
          score: parseInt(scoreMatch[1], 10),
          moves: parseInt(movesMatch[1], 10)
        };
      }
      
      return { hasStatusBar: true };
    }

    const roomName = match[1].trim();
    const score = parseInt(match[2], 10);
    const moves = parseInt(match[3], 10);

    return {
      hasStatusBar: true,
      roomName: roomName.length > StatusBarNormalizer.ROOM_NAME_WIDTH 
        ? roomName.substring(0, StatusBarNormalizer.ROOM_NAME_WIDTH) 
        : roomName,
      score,
      moves
    };
  }

  /**
   * Format a status bar line to match Z-Machine format exactly
   * This is used when we need to ADD a status bar (not for parity testing)
   * 
   * Handles edge cases:
   * - Long room names (truncated to 49 chars)
   * - Negative scores
   * - Score/moves bounds validation
   */
  formatStatusBarExactly(room: string, score: number, moves: number): string {
    // Clamp score to valid range
    const clampedScore = Math.max(StatusBarNormalizer.MIN_SCORE, 
                                   Math.min(StatusBarNormalizer.MAX_SCORE, score));
    
    // Clamp moves to valid range (non-negative)
    const clampedMoves = Math.max(0, Math.min(StatusBarNormalizer.MAX_MOVES, moves));
    
    // Pad room name to exactly 49 characters (truncate if too long)
    const paddedRoom = this.padRoomName(room);
    
    // Format score and moves sections with fixed spacing
    const scoreSection = `Score: ${clampedScore}`;
    const movesSection = `Moves: ${clampedMoves}`;
    
    // Use exactly 8 spaces between Score and Moves (Z-Machine standard)
    const fixedSpacing = ' '.repeat(StatusBarNormalizer.SCORE_MOVES_SPACING);
    
    return `${paddedRoom}${scoreSection}${fixedSpacing}${movesSection}`;
  }

  /**
   * Pad room name to the standard width (49 characters)
   * If room name is too long, truncate it but ensure at least one trailing space
   * for pattern matching
   */
  private padRoomName(room: string): string {
    if (room.length >= StatusBarNormalizer.ROOM_NAME_WIDTH) {
      // Truncate to 48 chars to leave room for at least one space before Score:
      return room.substring(0, StatusBarNormalizer.ROOM_NAME_WIDTH - 1) + ' ';
    }
    return room.padEnd(StatusBarNormalizer.ROOM_NAME_WIDTH);
  }

  /**
   * Check if output contains any status bar contamination
   */
  hasStatusBarContamination(output: string): boolean {
    const lines = output.split('\n');
    return lines.some(line => StatusBarNormalizer.STATUS_BAR_PATTERN.test(line));
  }

  /**
   * Get all status bar detections from output
   */
  getAllStatusBars(output: string): StatusBarDetection[] {
    const lines = output.split('\n');
    const detections: StatusBarDetection[] = [];

    for (let i = 0; i < lines.length; i++) {
      const detection = this.detectStatusBar(lines[i]);
      if (detection.hasStatusBar) {
        detections.push({
          ...detection,
          lineIndex: i
        });
      }
    }

    return detections;
  }

  /**
   * Compare two outputs after status bar normalization
   * Returns true if they match after removing status bars
   */
  compareNormalized(tsOutput: string, zmOutput: string): boolean {
    const normalizedTs = this.normalizeStatusBarOutput(tsOutput).normalizedOutput;
    const normalizedZm = this.normalizeStatusBarOutput(zmOutput).normalizedOutput;
    return normalizedTs === normalizedZm;
  }

  /**
   * Get detailed comparison result
   */
  getComparisonDetails(tsOutput: string, zmOutput: string): {
    match: boolean;
    tsNormalized: string;
    zmNormalized: string;
    tsStatusBarsRemoved: number;
    zmStatusBarsRemoved: number;
  } {
    const tsResult = this.normalizeStatusBarOutput(tsOutput);
    const zmResult = this.normalizeStatusBarOutput(zmOutput);

    return {
      match: tsResult.normalizedOutput === zmResult.normalizedOutput,
      tsNormalized: tsResult.normalizedOutput,
      zmNormalized: zmResult.normalizedOutput,
      tsStatusBarsRemoved: tsResult.detectedStatusBars.length,
      zmStatusBarsRemoved: zmResult.detectedStatusBars.length
    };
  }

  /**
   * Validate that a status bar is correctly formatted
   * Enhanced to handle edge cases:
   * - Negative scores (valid down to -999)
   * - Long room names (warning if > 49 chars)
   * - Malformed patterns
   */
  validateStatusBarFormat(statusBar: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check against standard pattern first
    const matchesStandard = StatusBarNormalizer.STATUS_BAR_PATTERN.test(statusBar);
    
    // Check against malformed patterns
    const matchesMalformed = StatusBarNormalizer.MALFORMED_PATTERNS.some(p => p.test(statusBar));
    
    if (!matchesStandard && !matchesMalformed) {
      issues.push('Does not match Z-Machine status bar pattern');
      return { isValid: false, issues };
    }

    const detection = this.detectStatusBar(statusBar);
    
    if (detection.roomName && detection.roomName.length > StatusBarNormalizer.ROOM_NAME_WIDTH) {
      issues.push(`Room name exceeds ${StatusBarNormalizer.ROOM_NAME_WIDTH} characters (will be truncated)`);
    }

    if (detection.score !== undefined) {
      if (detection.score < StatusBarNormalizer.MIN_SCORE) {
        issues.push(`Score ${detection.score} is below minimum displayable value (${StatusBarNormalizer.MIN_SCORE})`);
      }
      if (detection.score > StatusBarNormalizer.MAX_SCORE) {
        issues.push(`Score ${detection.score} exceeds maximum displayable value (${StatusBarNormalizer.MAX_SCORE})`);
      }
    }

    if (detection.moves !== undefined) {
      if (detection.moves < 0) {
        issues.push('Moves count cannot be negative');
      }
      if (detection.moves > StatusBarNormalizer.MAX_MOVES) {
        issues.push(`Moves ${detection.moves} exceeds maximum displayable value (${StatusBarNormalizer.MAX_MOVES})`);
      }
    }

    // If it matches malformed pattern but not standard, add a warning
    if (!matchesStandard && matchesMalformed) {
      issues.push('Status bar matches malformed pattern (non-standard formatting)');
    }

    return {
      isValid: issues.length === 0 || (issues.length === 1 && issues[0].includes('malformed')),
      issues
    };
  }

  /**
   * Static factory method for creating a normalizer instance
   */
  static create(): StatusBarNormalizer {
    return new StatusBarNormalizer();
  }

  /**
   * Static method for quick normalization without creating an instance
   */
  static normalize(output: string): string {
    const normalizer = new StatusBarNormalizer();
    return normalizer.normalizeStatusBarOutput(output).normalizedOutput;
  }

  /**
   * Verify that normalization is idempotent
   * Normalizing an already-normalized output should produce identical result
   * 
   * Requirements: 4.2
   */
  verifyIdempotence(output: string): {
    isIdempotent: boolean;
    firstPass: string;
    secondPass: string;
  } {
    const firstPass = this.normalizeStatusBarOutput(output).normalizedOutput;
    const secondPass = this.normalizeStatusBarOutput(firstPass).normalizedOutput;
    
    return {
      isIdempotent: firstPass === secondPass,
      firstPass,
      secondPass
    };
  }

  /**
   * Normalize output with idempotence guarantee
   * This method ensures the result is stable under repeated normalization
   * 
   * Requirements: 4.2
   */
  normalizeIdempotent(output: string): NormalizationResult {
    const result = this.normalizeStatusBarOutput(output);
    
    // Verify idempotence - second pass should be identical
    const secondPass = this.normalizeStatusBarOutput(result.normalizedOutput);
    
    // If not idempotent, apply normalization until stable
    if (result.normalizedOutput !== secondPass.normalizedOutput) {
      // Keep normalizing until stable (max 3 iterations to prevent infinite loops)
      let current = result.normalizedOutput;
      let iterations = 0;
      const maxIterations = 3;
      
      while (iterations < maxIterations) {
        const next = this.normalizeStatusBarOutput(current);
        if (next.normalizedOutput === current) {
          break;
        }
        current = next.normalizedOutput;
        result.detectedStatusBars.push(...next.detectedStatusBars);
        iterations++;
      }
      
      result.normalizedOutput = current;
    }
    
    return result;
  }

  /**
   * Validate content preservation after normalization
   * Ensures non-status-bar content is preserved exactly
   * 
   * Requirements: 4.2
   */
  validateContentPreservation(original: string, normalized: string): {
    preserved: boolean;
    missingContent: string[];
    extraContent: string[];
  } {
    const originalLines = original.split('\n');
    const normalizedLines = normalized.split('\n');
    
    // Get non-status-bar lines from original
    const originalContent: string[] = [];
    for (const line of originalLines) {
      if (!this.detectStatusBar(line).hasStatusBar && line.trim().length > 0) {
        originalContent.push(line.trim());
      }
    }
    
    // Get all lines from normalized (should have no status bars)
    const normalizedContent: string[] = [];
    for (const line of normalizedLines) {
      if (line.trim().length > 0) {
        normalizedContent.push(line.trim());
      }
    }
    
    // Find missing and extra content
    const missingContent = originalContent.filter(line => !normalizedContent.includes(line));
    const extraContent = normalizedContent.filter(line => !originalContent.includes(line));
    
    return {
      preserved: missingContent.length === 0 && extraContent.length === 0,
      missingContent,
      extraContent
    };
  }
}
