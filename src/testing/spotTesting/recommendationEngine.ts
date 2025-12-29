/**
 * Recommendation engine for spot testing analysis
 * Provides intelligent recommendations based on issue patterns and severity
 */

import {
  CommandDifference,
  IssuePattern,
  IssueAnalysis,
  PatternType,
  IssueSeverity,
  DifferenceType,
  RecommendationThresholds
} from './types.js';

/**
 * Configuration for recommendation engine
 */
export interface RecommendationConfig {
  thresholds: RecommendationThresholds;
  enablePatternTracking: boolean;
  historicalDataAvailable: boolean;
}

/**
 * Historical pattern data for cross-run analysis
 */
export interface HistoricalPattern {
  type: PatternType;
  occurrences: number;
  lastSeen: Date;
  consistency: number; // 0-1, how consistently this pattern appears
}

/**
 * Recommendation with priority and actionability
 */
export interface Recommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'investigation' | 'testing' | 'development' | 'monitoring';
  action: string;
  reasoning: string;
  estimatedEffort: 'quick' | 'moderate' | 'extensive';
}

/**
 * Engine for generating intelligent recommendations based on spot test results
 */
export class RecommendationEngine {
  private readonly config: RecommendationConfig;
  private historicalPatterns: Map<string, HistoricalPattern> = new Map();

  constructor(config?: Partial<RecommendationConfig>) {
    this.config = {
      thresholds: {
        minDifferencesForDeepAnalysis: 3,
        maxParityForConcern: 85,
        criticalIssueThreshold: 1
      },
      enablePatternTracking: true,
      historicalDataAvailable: false,
      ...config
    };
  }

  /**
   * Generate comprehensive recommendations based on analysis
   */
  generateRecommendations(
    totalCommands: number,
    differences: CommandDifference[],
    analysis: IssueAnalysis
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const parityPercentage = this.calculateParityPercentage(totalCommands, differences);

    // Add immediate action recommendations
    recommendations.push(...this.getImmediateActionRecommendations(differences, analysis));

    // Add investigation recommendations
    recommendations.push(...this.getInvestigationRecommendations(analysis.patterns));

    // Add testing strategy recommendations
    recommendations.push(...this.getTestingRecommendations(parityPercentage, differences.length));

    // Add development recommendations
    recommendations.push(...this.getDevelopmentRecommendations(analysis.patterns));

    // Add monitoring recommendations
    recommendations.push(...this.getMonitoringRecommendations(analysis));

    // Sort by priority
    return this.sortRecommendationsByPriority(recommendations);
  }

  /**
   * Determine when deeper investigation is needed with detailed reasoning
   */
  shouldRecommendDeepAnalysis(
    differences: CommandDifference[],
    patterns: IssuePattern[]
  ): { recommend: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let recommend = false;

    // Check difference count threshold
    if (differences.length >= this.config.thresholds.minDifferencesForDeepAnalysis) {
      reasons.push(`${differences.length} differences exceed threshold of ${this.config.thresholds.minDifferencesForDeepAnalysis}`);
      recommend = true;
    }

    // Check for critical patterns
    const criticalPatterns = patterns.filter(p => p.severity === IssueSeverity.CRITICAL);
    if (criticalPatterns.length >= this.config.thresholds.criticalIssueThreshold) {
      reasons.push(`${criticalPatterns.length} critical issue patterns detected`);
      recommend = true;
    }

    // Check for multiple high-severity patterns
    const highSeverityPatterns = patterns.filter(p => 
      p.severity === IssueSeverity.HIGH || p.severity === IssueSeverity.CRITICAL
    );
    if (highSeverityPatterns.length >= 2) {
      reasons.push(`Multiple high-severity patterns (${highSeverityPatterns.length}) indicate systemic issues`);
      recommend = true;
    }

    // Check for state divergence patterns (always concerning)
    const stateDivergencePatterns = patterns.filter(p => p.type === PatternType.STATE_DIVERGENCE);
    if (stateDivergencePatterns.length > 0) {
      reasons.push('State divergence patterns detected - potential game logic issues');
      recommend = true;
    }

    // Check for consistent patterns across multiple runs (if historical data available)
    if (this.config.historicalDataAvailable) {
      const consistentPatterns = this.identifyConsistentPatterns(patterns);
      if (consistentPatterns.length > 0) {
        reasons.push(`${consistentPatterns.length} patterns show consistency across multiple runs`);
        recommend = true;
      }
    }

    return { recommend, reasons };
  }

  /**
   * Flag patterns that appear consistently across multiple runs
   */
  flagConsistentPatterns(patterns: IssuePattern[]): IssuePattern[] {
    if (!this.config.enablePatternTracking) {
      return patterns;
    }

    const flaggedPatterns: IssuePattern[] = [];

    for (const pattern of patterns) {
      const key = `${pattern.type}_${pattern.description}`;
      const historical = this.historicalPatterns.get(key);

      if (historical) {
        // Update historical data
        historical.occurrences++;
        historical.lastSeen = new Date();
        historical.consistency = Math.min(1.0, historical.consistency + 0.1);

        // Flag if consistently appearing
        if (historical.consistency >= 0.7) {
          flaggedPatterns.push({
            ...pattern,
            description: `${pattern.description} (CONSISTENT PATTERN - appears in ${historical.occurrences} runs)`
          });
        }
      } else {
        // New pattern
        this.historicalPatterns.set(key, {
          type: pattern.type,
          occurrences: 1,
          lastSeen: new Date(),
          consistency: 0.3
        });
      }
    }

    return flaggedPatterns;
  }

  /**
   * Get immediate action recommendations
   */
  private getImmediateActionRecommendations(
    differences: CommandDifference[],
    analysis: IssueAnalysis
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Critical issues require immediate attention
    const criticalPatterns = analysis.patterns.filter(p => p.severity === IssueSeverity.CRITICAL);
    if (criticalPatterns.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'investigation',
        action: 'Investigate critical parity issues immediately',
        reasoning: `${criticalPatterns.length} critical patterns detected that could indicate serious game logic problems`,
        estimatedEffort: 'extensive'
      });
    }

    // State divergence needs urgent attention
    const stateDivergence = analysis.patterns.filter(p => p.type === PatternType.STATE_DIVERGENCE);
    if (stateDivergence.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'investigation',
        action: 'Review game state management logic',
        reasoning: 'State divergence patterns suggest the game state is not being maintained consistently',
        estimatedEffort: 'moderate'
      });
    }

    return recommendations;
  }

  /**
   * Get investigation recommendations based on patterns
   */
  private getInvestigationRecommendations(patterns: IssuePattern[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const pattern of patterns) {
      switch (pattern.type) {
        case PatternType.MESSAGE_INCONSISTENCY:
          if (pattern.frequency >= 3) {
            recommendations.push({
              priority: pattern.severity === IssueSeverity.HIGH ? 'high' : 'medium',
              category: 'investigation',
              action: 'Review message generation and formatting logic',
              reasoning: `${pattern.frequency} message inconsistencies detected - check text output systems`,
              estimatedEffort: 'moderate'
            });
          }
          break;

        case PatternType.PARSER_DIFFERENCE:
          recommendations.push({
            priority: 'high',
            category: 'investigation',
            action: 'Audit command parsing and vocabulary handling',
            reasoning: `Parser differences (${pattern.frequency} cases) could affect game playability`,
            estimatedEffort: 'moderate'
          });
          break;

        case PatternType.OBJECT_BEHAVIOR:
          recommendations.push({
            priority: 'medium',
            category: 'investigation',
            action: 'Test object interaction and behavior systems',
            reasoning: `Object behavior inconsistencies (${pattern.frequency} cases) may affect puzzle solutions`,
            estimatedEffort: 'moderate'
          });
          break;
      }
    }

    return recommendations;
  }

  /**
   * Get testing strategy recommendations
   */
  private getTestingRecommendations(parityPercentage: number, differenceCount: number): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (parityPercentage < this.config.thresholds.maxParityForConcern) {
      recommendations.push({
        priority: 'high',
        category: 'testing',
        action: 'Run comprehensive parity test suite',
        reasoning: `Parity score of ${parityPercentage}% is below acceptable threshold of ${this.config.thresholds.maxParityForConcern}%`,
        estimatedEffort: 'extensive'
      });
    }

    if (differenceCount >= this.config.thresholds.minDifferencesForDeepAnalysis) {
      recommendations.push({
        priority: 'medium',
        category: 'testing',
        action: 'Increase spot test command count for better coverage',
        reasoning: `${differenceCount} differences suggest more thorough testing may reveal additional issues`,
        estimatedEffort: 'quick'
      });
    }

    return recommendations;
  }

  /**
   * Get development recommendations
   */
  private getDevelopmentRecommendations(patterns: IssuePattern[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // If we have multiple pattern types, suggest systematic review
    if (patterns.length >= 3) {
      recommendations.push({
        priority: 'medium',
        category: 'development',
        action: 'Conduct systematic code review of affected systems',
        reasoning: `Multiple issue types (${patterns.length}) suggest broader implementation concerns`,
        estimatedEffort: 'extensive'
      });
    }

    // Suggest adding targeted unit tests
    if (patterns.some(p => p.severity === IssueSeverity.HIGH)) {
      recommendations.push({
        priority: 'medium',
        category: 'development',
        action: 'Add targeted unit tests for identified problem areas',
        reasoning: 'High-severity patterns indicate areas that need better test coverage',
        estimatedEffort: 'moderate'
      });
    }

    return recommendations;
  }

  /**
   * Get monitoring recommendations
   */
  private getMonitoringRecommendations(analysis: IssueAnalysis): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (analysis.recommendDeepAnalysis) {
      recommendations.push({
        priority: 'low',
        category: 'monitoring',
        action: 'Set up automated parity monitoring in CI/CD',
        reasoning: 'Regular spot testing can catch regressions early in development',
        estimatedEffort: 'moderate'
      });
    }

    if (analysis.patterns.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'monitoring',
        action: 'Track pattern trends over time',
        reasoning: 'Monitoring pattern consistency helps identify systemic vs. transient issues',
        estimatedEffort: 'quick'
      });
    }

    return recommendations;
  }

  /**
   * Sort recommendations by priority
   */
  private sortRecommendationsByPriority(recommendations: Recommendation[]): Recommendation[] {
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  /**
   * Calculate parity percentage
   */
  private calculateParityPercentage(totalCommands: number, differences: CommandDifference[]): number {
    if (totalCommands === 0) return 100;
    const matchingCommands = totalCommands - differences.length;
    return Math.round((matchingCommands / totalCommands) * 100 * 100) / 100;
  }

  /**
   * Identify patterns that appear consistently across runs
   */
  private identifyConsistentPatterns(patterns: IssuePattern[]): IssuePattern[] {
    const consistent: IssuePattern[] = [];

    for (const pattern of patterns) {
      const key = `${pattern.type}_${pattern.description}`;
      const historical = this.historicalPatterns.get(key);

      if (historical && historical.consistency >= 0.7) {
        consistent.push(pattern);
      }
    }

    return consistent;
  }
}