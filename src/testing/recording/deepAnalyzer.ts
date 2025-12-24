/**
 * Deep Difference Analysis System
 * 
 * Provides comprehensive analysis tools to identify root causes of behavioral
 * differences between TypeScript and Z-Machine implementations, with advanced
 * state capture, system mapping, and contextual factor analysis.
 * 
 * Requirements: 3.1, 3.2
 */

import { 
  Transcript, 
  TranscriptEntry, 
  DiffEntry, 
  DiffReport,
  DiffSeverity 
} from './types.js';

// ============================================================================
// Deep Analysis Types
// ============================================================================

/**
 * Detailed difference with comprehensive context
 */
export interface DetailedDifference {
  /** Index in the transcript */
  commandIndex: number;
  /** The command that was executed */
  command: string;
  /** Complete game state snapshot at this point */
  gameState: GameStateSnapshot;
  /** Expected output from Z-Machine */
  expectedOutput: string;
  /** Actual output from TypeScript */
  actualOutput: string;
  /** Classification of the difference type */
  differenceType: DifferenceType;
  /** Game systems involved in this difference */
  affectedSystems: GameSystem[];
  /** Contextual factors that may influence the difference */
  contextualFactors: ContextualFactor[];
  /** Similarity score between outputs */
  similarity: number;
  /** Severity classification */
  severity: DiffSeverity;
}

/**
 * Complete game state at a specific point in time
 */
export interface GameStateSnapshot {
  /** Turn number */
  turnNumber: number;
  /** Player's current location */
  playerLocation: string;
  /** Items in player's inventory */
  inventory: string[];
  /** State of all game objects */
  objectStates: Map<string, ObjectState>;
  /** State of all rooms */
  roomStates: Map<string, RoomState>;
  /** State of all puzzles */
  puzzleStates: Map<string, PuzzleState>;
  /** Active daemon states */
  daemonStates: Map<string, DaemonState>;
  /** Global game flags */
  globalFlags: Map<string, boolean>;
  /** Player score */
  score: number;
  /** Lamp fuel remaining */
  lampFuel?: number;
  /** Checksum for state integrity validation */
  checksum: string;
}

/**
 * State of a game object
 */
export interface ObjectState {
  /** Object identifier */
  id: string;
  /** Current location (room ID or 'inventory' or 'nowhere') */
  location: string;
  /** Object properties */
  properties: Map<string, any>;
  /** Whether object is visible to player */
  visible: boolean;
  /** Whether object can be taken */
  takeable: boolean;
  /** Custom state data */
  customState?: Record<string, any>;
}

/**
 * State of a room
 */
export interface RoomState {
  /** Room identifier */
  id: string;
  /** Whether room has been visited */
  visited: boolean;
  /** Objects currently in the room */
  objects: string[];
  /** Room-specific flags */
  flags: Map<string, boolean>;
  /** Light level in room */
  lightLevel: number;
  /** Custom room state */
  customState?: Record<string, any>;
}

/**
 * State of a puzzle
 */
export interface PuzzleState {
  /** Puzzle identifier */
  id: string;
  /** Current step in puzzle sequence */
  currentStep: number;
  /** Whether puzzle is completed */
  completed: boolean;
  /** Puzzle-specific data */
  data: Map<string, any>;
  /** Steps completed so far */
  completedSteps: number[];
}

/**
 * State of a daemon (timed event)
 */
export interface DaemonState {
  /** Daemon identifier */
  id: string;
  /** Whether daemon is active */
  active: boolean;
  /** Turns until next execution */
  turnsUntilNext: number;
  /** Daemon-specific state */
  state: Record<string, any>;
}

/**
 * Types of differences that can occur
 */
export enum DifferenceType {
  MESSAGE_CONTENT = 'message_content',
  STATE_LOGIC = 'state_logic',
  OBJECT_BEHAVIOR = 'object_behavior',
  PARSER_RESPONSE = 'parser_response',
  CONDITIONAL_LOGIC = 'conditional_logic',
  SEQUENCE_DEPENDENCY = 'sequence_dependency',
  TIMING_DIFFERENCE = 'timing_difference',
  RANDOM_BEHAVIOR = 'random_behavior'
}

/**
 * Game systems that can be involved in differences
 */
export enum GameSystem {
  PARSER = 'parser',
  ACTIONS = 'actions',
  OBJECTS = 'objects',
  ROOMS = 'rooms',
  INVENTORY = 'inventory',
  PUZZLES = 'puzzles',
  COMBAT = 'combat',
  DAEMONS = 'daemons',
  SCORING = 'scoring',
  LIGHTING = 'lighting',
  MESSAGING = 'messaging'
}

/**
 * Contextual factors that may influence differences
 */
export interface ContextualFactor {
  /** Type of contextual factor */
  type: ContextualFactorType;
  /** Description of the factor */
  description: string;
  /** Impact level on the difference */
  impact: 'low' | 'medium' | 'high';
  /** Additional data about the factor */
  data?: Record<string, any>;
}

/**
 * Types of contextual factors
 */
export enum ContextualFactorType {
  PREVIOUS_COMMAND = 'previous_command',
  GAME_STATE = 'game_state',
  OBJECT_LOCATION = 'object_location',
  PUZZLE_STATE = 'puzzle_state',
  DAEMON_TIMING = 'daemon_timing',
  RANDOM_SEED = 'random_seed',
  TURN_NUMBER = 'turn_number',
  INVENTORY_STATE = 'inventory_state'
}

/**
 * Root cause analysis mapping
 */
export interface RootCauseMap {
  /** Primary root cause */
  primaryCause: RootCause;
  /** Contributing factors */
  contributingFactors: RootCause[];
  /** Confidence level in the analysis */
  confidence: number;
  /** Detailed explanation */
  explanation: string;
}

/**
 * Root cause of a difference
 */
export interface RootCause {
  /** System where the root cause originates */
  system: GameSystem;
  /** Specific component within the system */
  component: string;
  /** Type of issue */
  issueType: IssueType;
  /** Detailed description */
  description: string;
  /** Suggested fix approach */
  suggestedFix?: string;
}

/**
 * Types of issues that can cause differences
 */
export enum IssueType {
  MISSING_LOGIC = 'missing_logic',
  INCORRECT_LOGIC = 'incorrect_logic',
  MESSAGE_MISMATCH = 'message_mismatch',
  STATE_INCONSISTENCY = 'state_inconsistency',
  TIMING_ISSUE = 'timing_issue',
  CONDITIONAL_ERROR = 'conditional_error',
  DEPENDENCY_MISSING = 'dependency_missing'
}

/**
 * Complete deep analysis result
 */
export interface DeepAnalysisResult {
  /** Sequence identifier */
  sequenceId: string;
  /** All detailed differences found */
  differences: DetailedDifference[];
  /** Root cause analysis for each difference */
  rootCauseAnalysis: RootCauseMap[];
  /** Fix recommendations prioritized by impact */
  fixRecommendations: FixRecommendation[];
  /** Overall risk assessment */
  riskAssessment: RiskLevel;
  /** Analysis metadata */
  metadata: AnalysisMetadata;
}

/**
 * Fix recommendation with priority and risk assessment
 */
export interface FixRecommendation {
  /** Difference index this fix addresses */
  differenceIndex: number;
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Estimated effort required */
  effort: 'minimal' | 'moderate' | 'significant' | 'major';
  /** Risk of introducing regressions */
  regressionRisk: RiskLevel;
  /** Target file(s) to modify */
  targetFiles: string[];
  /** Specific fix description */
  description: string;
  /** Estimated parity improvement */
  estimatedImprovement: number;
}

/**
 * Risk levels for various assessments
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Analysis metadata
 */
export interface AnalysisMetadata {
  /** When analysis was performed */
  timestamp: Date;
  /** Version of analyzer used */
  analyzerVersion: string;
  /** Analysis duration in milliseconds */
  duration: number;
  /** Total differences analyzed */
  totalDifferences: number;
  /** Analysis completeness percentage */
  completeness: number;
}

// ============================================================================
// Deep Analyzer Implementation
// ============================================================================

/**
 * Deep difference analyzer with comprehensive state capture and root cause analysis
 */
export class DeepAnalyzer {
  private readonly version = '1.0.0';

  /**
   * Perform deep analysis on a diff report
   * Requirements: 3.1, 3.2
   */
  async analyzeReport(
    diffReport: DiffReport,
    tsTranscript: Transcript,
    zmTranscript: Transcript,
    sequenceId: string
  ): Promise<DeepAnalysisResult> {
    const startTime = Date.now();
    
    const differences: DetailedDifference[] = [];
    const rootCauseAnalysis: RootCauseMap[] = [];
    
    // Analyze each difference in detail
    for (let i = 0; i < diffReport.differences.length; i++) {
      const diff = diffReport.differences[i];
      
      // Create detailed difference with state capture
      const detailedDiff = await this.createDetailedDifference(
        diff,
        tsTranscript,
        zmTranscript
      );
      differences.push(detailedDiff);
      
      // Perform root cause analysis
      const rootCause = this.analyzeRootCause(detailedDiff, differences);
      rootCauseAnalysis.push(rootCause);
    }
    
    // Generate fix recommendations
    const fixRecommendations = this.generateFixRecommendations(
      differences,
      rootCauseAnalysis
    );
    
    // Assess overall risk
    const riskAssessment = this.assessOverallRisk(differences);
    
    const duration = Date.now() - startTime;
    
    return {
      sequenceId,
      differences,
      rootCauseAnalysis,
      fixRecommendations,
      riskAssessment,
      metadata: {
        timestamp: new Date(),
        analyzerVersion: this.version,
        duration,
        totalDifferences: differences.length,
        completeness: this.calculateCompleteness(differences)
      }
    };
  }

  /**
   * Create detailed difference with comprehensive context
   */
  private async createDetailedDifference(
    diff: DiffEntry,
    tsTranscript: Transcript,
    zmTranscript: Transcript
  ): Promise<DetailedDifference> {
    // Capture game state at this point
    const gameState = this.captureGameState(diff.index, tsTranscript);
    
    // Classify the difference type
    const differenceType = this.classifyDifferenceType(diff);
    
    // Identify affected systems
    const affectedSystems = this.identifyAffectedSystems(diff, gameState);
    
    // Analyze contextual factors
    const contextualFactors = this.analyzeContextualFactors(
      diff,
      tsTranscript,
      zmTranscript
    );
    
    return {
      commandIndex: diff.index,
      command: diff.command,
      gameState,
      expectedOutput: diff.expected,
      actualOutput: diff.actual,
      differenceType,
      affectedSystems,
      contextualFactors,
      similarity: diff.similarity,
      severity: diff.severity
    };
  }

  /**
   * Capture complete game state at a specific point
   */
  private captureGameState(index: number, transcript: Transcript): GameStateSnapshot {
    // This would integrate with the actual game state tracking
    // For now, we'll create a mock implementation that demonstrates the structure
    
    // Handle case where index is out of bounds
    const entry = transcript.entries[index] || transcript.entries[transcript.entries.length - 1];
    if (!entry) {
      // Fallback for empty transcripts
      return {
        turnNumber: 1,
        playerLocation: 'unknown',
        inventory: [],
        objectStates: new Map(),
        roomStates: new Map(),
        puzzleStates: new Map(),
        daemonStates: new Map(),
        globalFlags: new Map(),
        score: 0,
        checksum: 'empty'
      };
    }
    
    return {
      turnNumber: entry.turnNumber,
      playerLocation: this.extractPlayerLocation(entry.output),
      inventory: this.extractInventory(entry.output),
      objectStates: new Map(),
      roomStates: new Map(),
      puzzleStates: new Map(),
      daemonStates: new Map(),
      globalFlags: new Map(),
      score: this.extractScore(entry.output),
      checksum: this.generateStateChecksum(entry)
    };
  }

  /**
   * Extract player location from game output
   */
  private extractPlayerLocation(output: string): string {
    // Look for location indicators in the output
    const locationMatch = output.match(/^([A-Z][^.!?]*)/);
    return locationMatch ? locationMatch[1].trim() : 'unknown';
  }

  /**
   * Extract inventory from game output
   */
  private extractInventory(output: string): string[] {
    const inventory: string[] = [];
    
    // Look for inventory listings
    if (output.includes('You are carrying:')) {
      const inventorySection = output.split('You are carrying:')[1];
      if (inventorySection) {
        const items = inventorySection.split('\n')[0];
        // Parse items (simplified)
        if (items.includes('nothing')) {
          return [];
        }
        // This would need more sophisticated parsing
        return items.split(',').map(item => item.trim());
      }
    }
    
    return inventory;
  }

  /**
   * Extract score from game output
   */
  private extractScore(output: string): number {
    const scoreMatch = output.match(/Score:\s*(-?\d+)/);
    return scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
  }

  /**
   * Generate state checksum for integrity validation
   */
  private generateStateChecksum(entry: TranscriptEntry): string {
    // Simple checksum based on turn number and output length
    const data = `${entry.turnNumber}-${entry.output.length}-${entry.command}`;
    return Buffer.from(data).toString('base64').substring(0, 8);
  }

  /**
   * Classify the type of difference
   */
  private classifyDifferenceType(diff: DiffEntry): DifferenceType {
    const command = diff.command.toLowerCase();
    const expected = diff.expected.toLowerCase();
    const actual = diff.actual.toLowerCase();
    
    // Check for parser-related differences
    if (expected.includes("don't understand") || actual.includes("don't understand")) {
      return DifferenceType.PARSER_RESPONSE;
    }
    
    // Check for object behavior differences
    if (command.includes('take') || command.includes('drop') || command.includes('examine')) {
      return DifferenceType.OBJECT_BEHAVIOR;
    }
    
    // Check for conditional logic differences
    if (expected.includes('if') || actual.includes('if') || 
        expected.includes('when') || actual.includes('when')) {
      return DifferenceType.CONDITIONAL_LOGIC;
    }
    
    // Check for state logic differences
    if (diff.category === 'room description' || diff.category === 'navigation') {
      return DifferenceType.STATE_LOGIC;
    }
    
    // Default to message content difference
    return DifferenceType.MESSAGE_CONTENT;
  }

  /**
   * Identify which game systems are affected by this difference
   */
  private identifyAffectedSystems(diff: DiffEntry, gameState: GameStateSnapshot): GameSystem[] {
    const systems: GameSystem[] = [];
    const command = diff.command.toLowerCase();
    
    // Always include messaging system for output differences
    systems.push(GameSystem.MESSAGING);
    
    // Add systems based on command type
    if (command.includes('look') || command.includes('examine')) {
      systems.push(GameSystem.ROOMS, GameSystem.OBJECTS);
    }
    
    if (command.includes('take') || command.includes('drop') || command.includes('inventory')) {
      systems.push(GameSystem.INVENTORY, GameSystem.OBJECTS);
    }
    
    if (['north', 'south', 'east', 'west', 'up', 'down', 'n', 's', 'e', 'w', 'u', 'd'].includes(command)) {
      systems.push(GameSystem.ROOMS);
    }
    
    if (command.includes('attack') || command.includes('kill')) {
      systems.push(GameSystem.COMBAT);
    }
    
    // Add parser system for any command
    systems.push(GameSystem.PARSER);
    
    return [...new Set(systems)]; // Remove duplicates
  }

  /**
   * Analyze contextual factors that may influence the difference
   */
  private analyzeContextualFactors(
    diff: DiffEntry,
    tsTranscript: Transcript,
    zmTranscript: Transcript
  ): ContextualFactor[] {
    const factors: ContextualFactor[] = [];
    
    // Previous command context
    if (diff.index > 0) {
      const prevEntry = tsTranscript.entries[diff.index - 1];
      if (prevEntry) {
        const prevCommand = prevEntry.command;
        factors.push({
          type: ContextualFactorType.PREVIOUS_COMMAND,
          description: `Previous command: ${prevCommand}`,
          impact: 'medium',
          data: { previousCommand: prevCommand }
        });
      }
    }
    
    // Turn number context
    const currentEntry = tsTranscript.entries[diff.index] || tsTranscript.entries[tsTranscript.entries.length - 1];
    if (currentEntry) {
      const turnNumber = currentEntry.turnNumber;
      if (turnNumber > 10) {
        factors.push({
          type: ContextualFactorType.TURN_NUMBER,
          description: `Late in game (turn ${turnNumber})`,
          impact: 'low',
          data: { turnNumber }
        });
      }
    }
    
    // Add more contextual analysis as needed
    
    return factors;
  }

  /**
   * Perform root cause analysis for a difference
   */
  private analyzeRootCause(
    diff: DetailedDifference,
    allDifferences: DetailedDifference[]
  ): RootCauseMap {
    // Analyze the primary cause
    const primaryCause = this.identifyPrimaryCause(diff);
    
    // Look for contributing factors
    const contributingFactors = this.identifyContributingFactors(diff, allDifferences);
    
    // Calculate confidence based on available information
    const confidence = this.calculateConfidence(diff, primaryCause);
    
    // Generate explanation
    const explanation = this.generateExplanation(diff, primaryCause, contributingFactors);
    
    return {
      primaryCause,
      contributingFactors,
      confidence,
      explanation
    };
  }

  /**
   * Identify the primary root cause of a difference
   */
  private identifyPrimaryCause(diff: DetailedDifference): RootCause {
    const command = diff.command.toLowerCase();
    
    // Analyze based on difference type and affected systems
    if (diff.differenceType === DifferenceType.OBJECT_BEHAVIOR) {
      return {
        system: GameSystem.OBJECTS,
        component: 'object actions',
        issueType: IssueType.INCORRECT_LOGIC,
        description: `Object behavior mismatch for command: ${diff.command}`,
        suggestedFix: 'Update object action handlers in src/game/actions.ts'
      };
    }
    
    if (diff.differenceType === DifferenceType.PARSER_RESPONSE) {
      return {
        system: GameSystem.PARSER,
        component: 'command parsing',
        issueType: IssueType.MESSAGE_MISMATCH,
        description: `Parser response differs for: ${diff.command}`,
        suggestedFix: 'Update parser error messages in src/parser/parser.ts'
      };
    }
    
    if (diff.differenceType === DifferenceType.STATE_LOGIC) {
      return {
        system: GameSystem.ROOMS,
        component: 'room state',
        issueType: IssueType.STATE_INCONSISTENCY,
        description: `Room state logic differs for: ${diff.command}`,
        suggestedFix: 'Update room logic in src/game/rooms.ts'
      };
    }
    
    // Default case
    return {
      system: GameSystem.MESSAGING,
      component: 'message generation',
      issueType: IssueType.MESSAGE_MISMATCH,
      description: `Message content differs for: ${diff.command}`,
      suggestedFix: 'Update message content in appropriate handler'
    };
  }

  /**
   * Identify contributing factors to the root cause
   */
  private identifyContributingFactors(
    diff: DetailedDifference,
    allDifferences: DetailedDifference[]
  ): RootCause[] {
    const factors: RootCause[] = [];
    
    // Look for patterns in other differences
    const similarDifferences = allDifferences.filter(d => 
      d.differenceType === diff.differenceType && d !== diff
    );
    
    if (similarDifferences.length > 0) {
      factors.push({
        system: GameSystem.MESSAGING,
        component: 'systematic issue',
        issueType: IssueType.MISSING_LOGIC,
        description: `Part of systematic issue affecting ${similarDifferences.length + 1} commands`
      });
    }
    
    return factors;
  }

  /**
   * Calculate confidence in the root cause analysis
   */
  private calculateConfidence(diff: DetailedDifference, primaryCause: RootCause): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on clear patterns
    if (diff.affectedSystems.includes(primaryCause.system)) {
      confidence += 0.2;
    }
    
    // Increase confidence for high similarity (likely minor fix)
    if (diff.similarity > 0.8) {
      confidence += 0.2;
    }
    
    // Decrease confidence for complex differences
    if (diff.affectedSystems.length > 3) {
      confidence -= 0.1;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate human-readable explanation of the root cause
   */
  private generateExplanation(
    diff: DetailedDifference,
    primaryCause: RootCause,
    contributingFactors: RootCause[]
  ): string {
    let explanation = `The difference in command "${diff.command}" appears to be caused by `;
    explanation += `${primaryCause.description.toLowerCase()}.`;
    
    if (contributingFactors.length > 0) {
      explanation += ` Contributing factors include: `;
      explanation += contributingFactors.map(f => f.description.toLowerCase()).join(', ');
      explanation += '.';
    }
    
    if (primaryCause.suggestedFix) {
      explanation += ` Suggested fix: ${primaryCause.suggestedFix}.`;
    }
    
    return explanation;
  }

  /**
   * Generate prioritized fix recommendations
   */
  private generateFixRecommendations(
    differences: DetailedDifference[],
    rootCauseAnalysis: RootCauseMap[]
  ): FixRecommendation[] {
    const recommendations: FixRecommendation[] = [];
    
    for (let i = 0; i < differences.length; i++) {
      const diff = differences[i];
      const rootCause = rootCauseAnalysis[i];
      
      const recommendation: FixRecommendation = {
        differenceIndex: i,
        priority: this.calculatePriority(diff, rootCause),
        effort: this.estimateEffort(diff, rootCause),
        regressionRisk: this.assessRegressionRisk(diff, rootCause),
        targetFiles: this.identifyTargetFiles(rootCause.primaryCause),
        description: rootCause.primaryCause.suggestedFix || 'Manual investigation required',
        estimatedImprovement: this.estimateImprovement(diff)
      };
      
      recommendations.push(recommendation);
    }
    
    // Sort by priority and estimated improvement
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedImprovement - a.estimatedImprovement;
    });
  }

  /**
   * Calculate priority for a fix recommendation
   */
  private calculatePriority(diff: DetailedDifference, rootCause: RootCauseMap): 'critical' | 'high' | 'medium' | 'low' {
    if (diff.severity === 'critical') return 'critical';
    if (diff.severity === 'major') return 'high';
    if (rootCause.confidence > 0.8) return 'high';
    if (diff.similarity > 0.9) return 'medium';
    return 'low';
  }

  /**
   * Estimate effort required for a fix
   */
  private estimateEffort(diff: DetailedDifference, rootCause: RootCauseMap): 'minimal' | 'moderate' | 'significant' | 'major' {
    if (diff.similarity > 0.95) return 'minimal';
    if (diff.similarity > 0.8) return 'moderate';
    if (rootCause.contributingFactors.length === 0) return 'moderate';
    if (diff.affectedSystems.length > 3) return 'major';
    return 'significant';
  }

  /**
   * Assess regression risk for a fix
   */
  private assessRegressionRisk(diff: DetailedDifference, rootCause: RootCauseMap): RiskLevel {
    if (diff.affectedSystems.length > 3) return RiskLevel.HIGH;
    if (rootCause.contributingFactors.length > 2) return RiskLevel.MEDIUM;
    if (diff.similarity > 0.9) return RiskLevel.LOW;
    return RiskLevel.MEDIUM;
  }

  /**
   * Identify target files for a fix
   */
  private identifyTargetFiles(rootCause: RootCause): string[] {
    const files: string[] = [];
    
    switch (rootCause.system) {
      case GameSystem.PARSER:
        files.push('src/parser/parser.ts', 'src/parser/vocabulary.ts');
        break;
      case GameSystem.ACTIONS:
        files.push('src/game/actions.ts', 'src/game/verbHandlers.ts');
        break;
      case GameSystem.OBJECTS:
        files.push('src/game/objects.ts', 'src/game/data/objects.ts');
        break;
      case GameSystem.ROOMS:
        files.push('src/game/rooms.ts', 'src/game/data/rooms.ts');
        break;
      case GameSystem.PUZZLES:
        files.push('src/game/puzzles.ts');
        break;
      case GameSystem.COMBAT:
        files.push('src/engine/combat.ts');
        break;
      case GameSystem.DAEMONS:
        files.push('src/engine/daemons.ts');
        break;
      default:
        files.push('src/game/actions.ts'); // Default fallback
    }
    
    return files;
  }

  /**
   * Estimate parity improvement from fixing this difference
   */
  private estimateImprovement(diff: DetailedDifference): number {
    // Simple estimation based on severity and similarity
    if (diff.severity === 'critical') return 2.0;
    if (diff.severity === 'major') return 1.5;
    if (diff.similarity > 0.9) return 0.5;
    return 1.0;
  }

  /**
   * Assess overall risk level for the entire analysis
   */
  private assessOverallRisk(differences: DetailedDifference[]): RiskLevel {
    const criticalCount = differences.filter(d => d.severity === 'critical').length;
    const majorCount = differences.filter(d => d.severity === 'major').length;
    
    if (criticalCount > 5) return RiskLevel.CRITICAL;
    if (criticalCount > 2 || majorCount > 10) return RiskLevel.HIGH;
    if (majorCount > 5) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * Calculate analysis completeness percentage
   */
  private calculateCompleteness(differences: DetailedDifference[]): number {
    // For now, assume 100% completeness if we analyzed all differences
    // In a real implementation, this might consider factors like:
    // - Whether state capture was successful
    // - Whether root cause analysis was confident
    // - Whether fix recommendations were generated
    return 100;
  }
}

/**
 * Factory function to create a deep analyzer
 */
export function createDeepAnalyzer(): DeepAnalyzer {
  return new DeepAnalyzer();
}